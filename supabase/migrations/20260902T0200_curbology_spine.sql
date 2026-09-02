-- Layer B — the Opscend spine.
--
-- The first migration gave Curbology its four working tables. This one gives
-- the project the same auth/ops spine every other Opscend console is built on:
-- roles, profiles, an activity log, and the RPC write contract.
--
-- One deliberate divergence from the standard, stated here rather than left to
-- be discovered: the reference build is a browser client calling Supabase
-- directly, so `auth.uid()` is always the signed-in person. Curbology renders on
-- the server and READS with the service role. WRITES still go through these
-- functions carrying the person's own access token, so `has_role(auth.uid(),
-- 'admin')` inside each function means exactly what it means upstream — the
-- database re-checks the actor, and never takes the server's word for it.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- roles

do $$ begin
  create type public.app_role as enum ('admin','client');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  is_suspended boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role    public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid,
  primary key (user_id, role)
);

-- The building block of every admin policy and every RPC guard.
--
-- SECURITY DEFINER on purpose: a policy that queried user_roles directly would
-- recurse through user_roles' own policies. Definer breaks the cycle, and the
-- fixed search_path keeps a rogue schema from redefining what `user_roles`
-- means inside it.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = _user_id
      and ur.role = _role
      and p.is_suspended = false
  );
$$;

-- Suspension is checked inside has_role, so suspending someone revokes every
-- policy and every RPC in one write. It is not a flag a screen has to remember.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- Bootstraps the very first admin.
--
-- Self-guarding: it only works while there are no admins at all. Once one
-- exists the door closes and roles are granted by an admin through
-- admin_set_user_role. The application gates the button behind OWNER_EMAILS as
-- well, but this check is the one that actually holds, because it is the one an
-- attacker cannot skip by calling the RPC directly.
create or replace function public.claim_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Not signed in'; end if;
  if exists (select 1 from public.user_roles where role = 'admin') then
    raise exception 'An administrator already exists';
  end if;
  insert into public.profiles (id, email) values (_uid, auth.jwt() ->> 'email')
    on conflict (id) do nothing;
  insert into public.user_roles (user_id, role, granted_by) values (_uid, 'admin', _uid)
    on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------- activity

-- Every privileged write lands here. An admin console without one cannot answer
-- "who unpublished that review", which is the question you only ask afterwards.
create table if not exists public.admin_activity (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id   uuid,
  actor_email text,
  entity     text not null,
  entity_id  text,
  verb       text not null,
  detail     jsonb not null default '{}'::jsonb
);
create index if not exists admin_activity_created_idx on public.admin_activity (created_at desc);
create index if not exists admin_activity_entity_idx  on public.admin_activity (entity, created_at desc);

create or replace function public.log_activity(_entity text, _entity_id text, _verb text, _detail jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_activity (actor_id, actor_email, entity, entity_id, verb, detail)
  values (auth.uid(), auth.jwt() ->> 'email', _entity, _entity_id, _verb, coalesce(_detail, '{}'::jsonb));
$$;

-- Raises unless the caller is a live admin. Every RPC below opens with it.
create or replace function public.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null or not public.has_role(_uid, 'admin') then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return _uid;
end;
$$;

-- ---------------------------------------------------------------- content tables

-- The people on the site's about page. Distinct from Users (accounts) and Team
-- Access (permissions): this is copy, and it is the only one the public sees.
create table if not exists public.team_members (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  name         text not null,
  role_title   text,
  bio          text,
  photo_url    text,
  sort_order   int not null default 0,
  is_published boolean not null default false
);
drop trigger if exists team_members_updated_at on public.team_members;
create trigger team_members_updated_at before update on public.team_members
  for each row execute function public.update_updated_at_column();

-- Operational switches, as opposed to copy. Typed keys, same shape as
-- content_blocks so one editor pattern covers both.
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Per-path title/description overrides, read by the page's generateMetadata.
create table if not exists public.seo_overrides (
  path        text primary key,
  title       text,
  description text,
  noindex     boolean not null default false,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- Redirects, applied before the 404. `from_path` is stored with its leading
-- slash and without a query string; matching is exact.
create table if not exists public.redirects (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_path  text not null unique,
  to_path    text not null,
  permanent  boolean not null default true,
  hits       int not null default 0,
  is_active  boolean not null default true
);

-- ---------------------------------------------------------------- updated_at on the originals

alter table public.leads    add column if not exists updated_at timestamptz not null default now();
alter table public.reviews  add column if not exists updated_at timestamptz not null default now();
alter table public.bookings add column if not exists updated_at timestamptz not null default now();

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function public.update_updated_at_column();
drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.update_updated_at_column();
drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.update_updated_at_column();

-- ---------------------------------------------------------------- RLS

alter table public.profiles       enable row level security;
alter table public.user_roles     enable row level security;
alter table public.admin_activity enable row level security;
alter table public.team_members   enable row level security;
alter table public.site_settings  enable row level security;
alter table public.seo_overrides  enable row level security;
alter table public.redirects      enable row level security;

-- Owner-scoped: everyone may read their own profile.
drop policy if exists profiles_own_read on public.profiles;
create policy profiles_own_read on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists user_roles_own_read on public.user_roles;
create policy user_roles_own_read on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists user_roles_admin_read on public.user_roles;
create policy user_roles_admin_read on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
-- No admin WRITE policy on user_roles on purpose. Roles change only through
-- admin_set_user_role, so every grant is logged and none can be made silently.

drop policy if exists admin_activity_admin_read on public.admin_activity;
create policy admin_activity_admin_read on public.admin_activity
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
-- No write policy: rows appear only via log_activity, called inside the RPCs.

drop policy if exists team_public_read on public.team_members;
create policy team_public_read on public.team_members
  for select to anon using (is_published = true);

drop policy if exists team_admin_all on public.team_members;
create policy team_admin_all on public.team_members
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists seo_public_read on public.seo_overrides;
create policy seo_public_read on public.seo_overrides for select to anon using (true);
drop policy if exists redirects_public_read on public.redirects;
create policy redirects_public_read on public.redirects for select to anon using (is_active = true);
drop policy if exists settings_public_read on public.site_settings;
create policy settings_public_read on public.site_settings for select to anon using (true);
-- Those three are read by the public site on every request and hold nothing
-- private. Writes still have no policy — they go through the RPCs.

drop policy if exists leads_admin_all on public.leads;
create policy leads_admin_all on public.leads
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists content_admin_all on public.content_blocks;
create policy content_admin_all on public.content_blocks
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
