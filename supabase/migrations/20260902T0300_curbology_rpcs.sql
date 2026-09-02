-- The write contract.
--
-- Nothing in the console updates a table directly. Every privileged mutation is
-- a SECURITY DEFINER function named <entity>_<verb> that opens by calling
-- require_admin() and closes by calling log_activity(). That gives three things
-- a route handler cannot: the check happens where the data is, the check cannot
-- be skipped by any caller, and the log cannot be forgotten by a new screen.
--
-- Definer functions run as the owner, so they see past RLS. require_admin() is
-- therefore not decoration — it is the whole gate.

-- ---------------------------------------------------------------- leads

create or replace function public.lead_set_status(_id uuid, _status text, _note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if _status not in ('new','contacted','quoted','won','lost','spam') then
    raise exception 'Unknown lead status %', _status;
  end if;
  update public.leads
     set status = _status,
         notes  = coalesce(nullif(_note, ''), notes)
   where id = _id;
  if not found then raise exception 'No such lead'; end if;
  perform public.log_activity('lead', _id::text, 'set_status', jsonb_build_object('status', _status));
end; $$;

create or replace function public.lead_set_quote(_id uuid, _amount numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  update public.leads set quoted_amount = _amount where id = _id;
  if not found then raise exception 'No such lead'; end if;
  perform public.log_activity('lead', _id::text, 'set_quote', jsonb_build_object('amount', _amount));
end; $$;

-- ---------------------------------------------------------------- reviews

-- Publishing and archiving in one call, because they are one decision on one
-- screen. `published` is the only thing that changes what the public sees, so
-- it is logged with its old value as well as its new one.
create or replace function public.review_set_state(_id uuid, _published boolean, _archived boolean, _reply text default null)
returns void language plpgsql security definer set search_path = public as $$
declare _was boolean;
begin
  perform public.require_admin();
  select published into _was from public.reviews where id = _id;
  if _was is null then raise exception 'No such review'; end if;
  update public.reviews
     set published   = _published,
         owner_reply = nullif(_reply, ''),
         status      = case when _archived then 'archived'
                            when nullif(_reply, '') is not null then 'replied'
                            else 'new' end
   where id = _id;
  perform public.log_activity('review', _id::text, 'set_state',
    jsonb_build_object('published_from', _was, 'published_to', _published, 'archived', _archived));
end; $$;

-- ---------------------------------------------------------------- bookings

create or replace function public.booking_set_state(_id uuid, _state text, _video_url text default null, _confirmed_slot timestamptz default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if _state not in ('requested','confirmed','recorded','received','published','declined','no-show') then
    raise exception 'Unknown booking state %', _state;
  end if;
  update public.bookings
     set state          = _state,
         video_url      = nullif(_video_url, ''),
         confirmed_slot = coalesce(_confirmed_slot, confirmed_slot)
   where id = _id;
  if not found then raise exception 'No such booking'; end if;
  perform public.log_activity('booking', _id::text, 'set_state', jsonb_build_object('state', _state));
end; $$;

-- ---------------------------------------------------------------- content & settings

create or replace function public.content_upsert(_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare _k text; _v jsonb;
begin
  perform public.require_admin();
  for _k, _v in select * from jsonb_each(_patch) loop
    insert into public.content_blocks (key, value, updated_at, updated_by)
    values (_k, _v, now(), auth.jwt() ->> 'email')
    on conflict (key) do update
      set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by;
  end loop;
  perform public.log_activity('content', null, 'upsert',
    jsonb_build_object('keys', (select jsonb_agg(k) from jsonb_object_keys(_patch) k)));
end; $$;

create or replace function public.setting_upsert(_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare _k text; _v jsonb;
begin
  perform public.require_admin();
  for _k, _v in select * from jsonb_each(_patch) loop
    insert into public.site_settings (key, value, updated_at, updated_by)
    values (_k, _v, now(), auth.jwt() ->> 'email')
    on conflict (key) do update
      set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by;
  end loop;
  perform public.log_activity('setting', null, 'upsert',
    jsonb_build_object('keys', (select jsonb_agg(k) from jsonb_object_keys(_patch) k)));
end; $$;

-- ---------------------------------------------------------------- seo & redirects

create or replace function public.seo_upsert(_path text, _title text, _description text, _noindex boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if _path !~ '^/' then raise exception 'Path must start with /'; end if;
  insert into public.seo_overrides (path, title, description, noindex, updated_at, updated_by)
  values (_path, nullif(_title,''), nullif(_description,''), coalesce(_noindex,false), now(), auth.jwt() ->> 'email')
  on conflict (path) do update
    set title = excluded.title, description = excluded.description,
        noindex = excluded.noindex, updated_at = now(), updated_by = excluded.updated_by;
  perform public.log_activity('seo', _path, 'upsert', jsonb_build_object('noindex', _noindex));
end; $$;

create or replace function public.seo_delete(_path text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  delete from public.seo_overrides where path = _path;
  perform public.log_activity('seo', _path, 'delete', '{}'::jsonb);
end; $$;

-- A redirect whose target is another redirect is a loop waiting to happen, and
-- the cheapest place to refuse one is here.
create or replace function public.redirect_upsert(_from text, _to text, _permanent boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if _from !~ '^/' then raise exception 'From-path must start with /'; end if;
  if _from = _to then raise exception 'A redirect to itself is a loop'; end if;
  if exists (select 1 from public.redirects where from_path = _to and is_active) then
    raise exception 'That target is itself redirected — the pair would loop';
  end if;
  insert into public.redirects (from_path, to_path, permanent)
  values (_from, _to, coalesce(_permanent, true))
  on conflict (from_path) do update
    set to_path = excluded.to_path, permanent = excluded.permanent, is_active = true;
  perform public.log_activity('redirect', _from, 'upsert', jsonb_build_object('to', _to));
end; $$;

create or replace function public.redirect_delete(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  delete from public.redirects where id = _id;
  perform public.log_activity('redirect', _id::text, 'delete', '{}'::jsonb);
end; $$;

-- Counting a hit is the one write the public makes here, so it is its own
-- function and it can do nothing else.
create or replace function public.redirect_hit(_from text)
returns void language sql security definer set search_path = public as $$
  update public.redirects set hits = hits + 1 where from_path = _from and is_active;
$$;

-- ---------------------------------------------------------------- team (content)

create or replace function public.team_upsert(_patch jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare _id uuid := nullif(_patch ->> 'id','')::uuid;
begin
  perform public.require_admin();
  if _id is null then
    insert into public.team_members (name, role_title, bio, photo_url, sort_order, is_published)
    values (_patch ->> 'name', nullif(_patch ->> 'role_title',''), nullif(_patch ->> 'bio',''),
            nullif(_patch ->> 'photo_url',''), coalesce((_patch ->> 'sort_order')::int, 0),
            coalesce((_patch ->> 'is_published')::boolean, false))
    returning id into _id;
    perform public.log_activity('team', _id::text, 'create', jsonb_build_object('name', _patch ->> 'name'));
  else
    update public.team_members
       set name = coalesce(_patch ->> 'name', name),
           role_title = nullif(_patch ->> 'role_title',''),
           bio = nullif(_patch ->> 'bio',''),
           photo_url = nullif(_patch ->> 'photo_url',''),
           sort_order = coalesce((_patch ->> 'sort_order')::int, sort_order),
           is_published = coalesce((_patch ->> 'is_published')::boolean, is_published)
     where id = _id;
    if not found then raise exception 'No such team member'; end if;
    perform public.log_activity('team', _id::text, 'update', '{}'::jsonb);
  end if;
  return _id;
end; $$;

create or replace function public.team_delete(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  delete from public.team_members where id = _id;
  perform public.log_activity('team', _id::text, 'delete', '{}'::jsonb);
end; $$;

-- ---------------------------------------------------------------- users & access

create or replace function public.list_users()
returns table (id uuid, email text, display_name text, is_suspended boolean,
               created_at timestamptz, last_sign_in_at timestamptz, roles text[])
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.display_name, p.is_suspended, p.created_at, u.last_sign_in_at,
         coalesce(array_agg(ur.role::text) filter (where ur.role is not null), '{}')
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.user_roles ur on ur.user_id = p.id
  where public.has_role(auth.uid(), 'admin')
  group by p.id, p.email, p.display_name, p.is_suspended, p.created_at, u.last_sign_in_at
  order by p.created_at;
$$;
-- The has_role check sits in the WHERE clause rather than a preceding raise:
-- a set-returning SQL function that is not an admin's simply returns nothing.

create or replace function public.admin_set_user_role(_user_id uuid, _role public.app_role, _granted boolean)
returns void language plpgsql security definer set search_path = public as $$
declare _me uuid;
begin
  _me := public.require_admin();
  -- The last admin cannot remove their own admin role. A console with no
  -- administrator needs a database session to fix, which is exactly the
  -- situation claim_admin() exists to avoid ever needing again.
  if _role = 'admin' and not _granted and _user_id = _me
     and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'You are the only administrator — grant someone else first';
  end if;
  if _granted then
    insert into public.user_roles (user_id, role, granted_by) values (_user_id, _role, _me)
      on conflict do nothing;
  else
    delete from public.user_roles where user_id = _user_id and role = _role;
  end if;
  perform public.log_activity('user', _user_id::text, case when _granted then 'grant_role' else 'revoke_role' end,
    jsonb_build_object('role', _role));
end; $$;

create or replace function public.admin_suspend_user(_user_id uuid, _suspended boolean)
returns void language plpgsql security definer set search_path = public as $$
declare _me uuid;
begin
  _me := public.require_admin();
  if _user_id = _me and _suspended then raise exception 'You cannot suspend yourself'; end if;
  update public.profiles set is_suspended = _suspended where id = _user_id;
  if not found then raise exception 'No such user'; end if;
  perform public.log_activity('user', _user_id::text,
    case when _suspended then 'suspend' else 'unsuspend' end, '{}'::jsonb);
end; $$;
