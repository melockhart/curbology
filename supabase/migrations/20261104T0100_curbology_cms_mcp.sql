-- Drafts, history and media for site edits, and the tables behind the MCP server.
--
-- Same posture as everything else: RLS on with no policies for anon or
-- authenticated. The MCP server and the site read these with the secret key.

-- ---------------------------------------------------------------- acting through a token

-- MCP tokens are not Supabase sessions, so the console RPCs see no person. The
-- secret key already bypasses every policy in the database, so treating it as an
-- admin here gives it nothing new. What this adds is the record of who: the server
-- states the token owner's address in a header, and only the secret key is believed.
create or replace function public.curbology_is_service_call()
returns boolean language sql stable as $$
  select coalesce(current_setting('role', true), '') = 'service_role'
      or coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

create or replace function public.curbology_current_actor_email()
returns text language plpgsql stable as $$
declare _headers json;
begin
  if public.curbology_is_service_call() then
    begin
      _headers := nullif(current_setting('request.headers', true), '')::json;
    exception when others then
      _headers := null;
    end;
    return coalesce(_headers ->> 'x-curbology-actor', 'service');
  end if;
  return auth.jwt() ->> 'email';
end; $$;

create or replace function public.curbology_require_admin()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare _uid uuid := auth.uid();
begin
  if public.curbology_is_service_call() then return _uid; end if;
  if _uid is null or not public.curbology_has_role(_uid, 'admin') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return _uid;
end; $$;

create or replace function public.curbology_log_activity(_entity text, _entity_id text, _verb text, _detail jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.curbology_admin_activity (actor_id, actor_email, entity, entity_id, verb, detail)
  values (auth.uid(), public.curbology_current_actor_email(), _entity, _entity_id, _verb, coalesce(_detail, '{}'::jsonb));
$$;

-- The quote decisions record who decided, so they follow the same rule.
create or replace function public.curbology_quote_rates_save(_card jsonb, _approve boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare _new uuid;
begin
  perform public.curbology_require_admin();
  insert into public.curbology_quote_rate_cards (card, approved_at, created_by)
  values (_card, case when _approve then now() end, public.curbology_current_actor_email())
  returning id into _new;
  perform public.curbology_log_activity('quote_rates', _new::text, case when _approve then 'approve' else 'save' end, _card);
  return _new;
end; $$;

create or replace function public.curbology_quote_release(_id uuid, _price_cents int, _deposit_cents int, _note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare _lead uuid;
begin
  perform public.curbology_require_admin();
  if _price_cents is null or _price_cents <= 0 then raise exception 'A released quote needs a price'; end if;
  if _deposit_cents is null or _deposit_cents < 0 then raise exception 'That deposit is not a number'; end if;
  update public.curbology_quotes
     set status = 'released', price_cents = _price_cents, deposit_cents = _deposit_cents,
         owner_note = nullif(_note, ''), decided_by = public.curbology_current_actor_email(),
         decided_at = now(), updated_at = now()
   where id = _id and status in ('review','reading','outside')
  returning lead_id into _lead;
  if not found then raise exception 'That quote is not waiting for a decision'; end if;
  if _lead is not null then
    update public.curbology_leads set quoted_amount = _price_cents / 100.0, status = 'quoted' where id = _lead;
  end if;
  perform public.curbology_log_activity('quote', _id::text, 'release',
    jsonb_build_object('price_cents', _price_cents, 'deposit_cents', _deposit_cents));
end; $$;

create or replace function public.curbology_quote_decline(_id uuid, _note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.curbology_require_admin();
  update public.curbology_quotes
     set status = 'declined', price_cents = null, deposit_cents = null,
         owner_note = nullif(_note, ''), decided_by = public.curbology_current_actor_email(),
         decided_at = now(), updated_at = now()
   where id = _id and status in ('review','reading','outside');
  if not found then raise exception 'That quote is not waiting for a decision'; end if;
  perform public.curbology_log_activity('quote', _id::text, 'decline', '{}'::jsonb);
end; $$;

-- ---------------------------------------------------------------- drafts

-- A draft holds changes nobody sees until it is published. The value at a key is
-- a string for copy, or {url, alt} for an image slot ("image.<slot>").
create table if not exists public.curbology_site_drafts (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  name         text not null,
  status       text not null default 'open' check (status in ('open','published','discarded')),
  changes      jsonb not null default '{}'::jsonb,
  created_by   text,
  published_at timestamptz,
  published_by text
);
create index if not exists curbology_site_drafts_status_idx on public.curbology_site_drafts (status, updated_at desc);

-- Every published change, with what it replaced, so any of them can be undone.
create table if not exists public.curbology_content_history (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  key        text not null,
  old_value  jsonb,
  new_value  jsonb,
  draft_id   uuid references public.curbology_site_drafts (id) on delete set null,
  actor      text
);
create index if not exists curbology_content_history_created_idx on public.curbology_content_history (created_at desc);

create table if not exists public.curbology_site_media (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path       text not null unique,
  url        text not null,
  alt        text not null default '',
  mime       text not null,
  bytes      int not null,
  created_by text
);

alter table public.curbology_site_drafts     enable row level security;
alter table public.curbology_content_history enable row level security;
alter table public.curbology_site_media      enable row level security;

-- Pictures on the public site, so the bucket is public. Uploads need the secret key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curbology-site-media', 'curbology-site-media', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Merging in the database means two edits to one draft cannot lose each other.
create or replace function public.curbology_draft_merge(_id uuid, _set jsonb, _remove text[] default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare _out jsonb;
begin
  perform public.curbology_require_admin();
  update public.curbology_site_drafts
     set changes = (changes - coalesce(_remove, '{}')) || coalesce(_set, '{}'::jsonb), updated_at = now()
   where id = _id and status = 'open'
  returning changes into _out;
  if not found then raise exception 'That draft is not open'; end if;
  return _out;
end; $$;

-- All of it goes live or none of it does.
create or replace function public.curbology_draft_publish(_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare _changes jsonb; _k text; _v jsonb; _n int := 0; _actor text := public.curbology_current_actor_email();
begin
  perform public.curbology_require_admin();
  select changes into _changes from public.curbology_site_drafts where id = _id and status = 'open' for update;
  if _changes is null then raise exception 'That draft is not open'; end if;
  for _k, _v in select * from jsonb_each(_changes) loop
    insert into public.curbology_content_history (key, old_value, new_value, draft_id, actor)
    values (_k, (select value from public.curbology_content_blocks where key = _k), _v, _id, _actor);
    insert into public.curbology_content_blocks (key, value, updated_at, updated_by)
    values (_k, _v, now(), _actor)
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by;
    _n := _n + 1;
  end loop;
  update public.curbology_site_drafts
     set status = 'published', published_at = now(), published_by = _actor, updated_at = now()
   where id = _id;
  perform public.curbology_log_activity('draft', _id::text, 'publish', jsonb_build_object('changes', _n));
  return _n;
end; $$;

create or replace function public.curbology_draft_discard(_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.curbology_require_admin();
  update public.curbology_site_drafts set status = 'discarded', updated_at = now() where id = _id and status = 'open';
  if not found then raise exception 'That draft is not open'; end if;
  perform public.curbology_log_activity('draft', _id::text, 'discard', '{}'::jsonb);
end; $$;

-- Undo one published change. With no earlier value, the row goes and the default
-- from the code shows again. The undo is itself recorded, so it can be undone.
create or replace function public.curbology_content_revert(_history_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare _h public.curbology_content_history; _actor text := public.curbology_current_actor_email();
begin
  perform public.curbology_require_admin();
  select * into _h from public.curbology_content_history where id = _history_id;
  if not found then raise exception 'No such change'; end if;
  insert into public.curbology_content_history (key, old_value, new_value, actor)
  values (_h.key, (select value from public.curbology_content_blocks where key = _h.key), _h.old_value, _actor);
  if _h.old_value is null then
    delete from public.curbology_content_blocks where key = _h.key;
  else
    insert into public.curbology_content_blocks (key, value, updated_at, updated_by)
    values (_h.key, _h.old_value, now(), _actor)
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by;
  end if;
  perform public.curbology_log_activity('content', _h.key, 'revert', jsonb_build_object('history_id', _history_id));
  return _h.key;
end; $$;

revoke all on function public.curbology_draft_merge(uuid, jsonb, text[]) from public, anon;
revoke all on function public.curbology_draft_publish(uuid) from public, anon;
revoke all on function public.curbology_draft_discard(uuid) from public, anon;
revoke all on function public.curbology_content_revert(uuid) from public, anon;

-- ---------------------------------------------------------------- MCP and OAuth

-- Only hashes are stored. owner_email is checked against the admin allowlist on
-- every call, so removing an address ends its tokens immediately.
create table if not exists public.curbology_api_tokens (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null,
  owner_email  text not null,
  name         text,
  token_hash   text not null unique,
  token_prefix text,
  scopes       text[] not null default array['read','write'],
  client_id    text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

create table if not exists public.curbology_oauth_clients (
  client_id   text primary key,
  client_name text,
  redirect_uris text[] not null default '{}',
  token_endpoint_auth_method text not null default 'none',
  created_at  timestamptz not null default now()
);

create table if not exists public.curbology_oauth_codes (
  code_hash      text primary key,
  client_id      text not null,
  redirect_uri   text not null,
  code_challenge text not null,
  code_challenge_method text not null default 'S256',
  scope          text,
  owner_id       uuid not null,
  owner_email    text not null,
  resource       text,
  used           boolean not null default false,
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now()
);

create table if not exists public.curbology_oauth_refresh_tokens (
  token_hash  text primary key,
  owner_id    uuid not null,
  owner_email text not null,
  client_id   text not null,
  scopes      text[] not null default array['read','write'],
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

-- Written by the endpoint from the initialize handshake, for the connections page.
create table if not exists public.curbology_mcp_sessions (
  session_id     text primary key,
  token_id       uuid,
  client_name    text,
  client_version text,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  calls          int not null default 0,
  tools          jsonb not null default '{}'::jsonb
);

alter table public.curbology_api_tokens           enable row level security;
alter table public.curbology_oauth_clients        enable row level security;
alter table public.curbology_oauth_codes          enable row level security;
alter table public.curbology_oauth_refresh_tokens enable row level security;
alter table public.curbology_mcp_sessions         enable row level security;

-- One round trip, because a Worker cancels anything left unawaited.
create or replace function public.curbology_mcp_touch(_session text, _tool text)
returns void language sql security definer set search_path = public as $$
  update public.curbology_mcp_sessions
     set calls = calls + 1, last_seen_at = now(),
         tools = jsonb_set(tools, array[_tool], to_jsonb(coalesce((tools ->> _tool)::int, 0) + 1))
   where session_id = _session;
$$;
revoke all on function public.curbology_mcp_touch(text, text) from public, anon, authenticated;
grant execute on function public.curbology_mcp_touch(text, text) to service_role;
