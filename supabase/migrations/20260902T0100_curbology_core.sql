-- Curbology core tables.
--
-- Posture, and the reason for it: nothing here is readable or writable with the
-- anon key. Every public write goes through a server route that validates the
-- input and sets the columns the submitter is not allowed to choose — status,
-- published, timestamps. A client-side insert with an anon key would let anyone
-- set `published = true` on their own review, or mark their own lead as won.


-- Inbound quote requests from the site's contact form.
create table if not exists public.curbology_leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null,
  phone         text,
  address       text,
  town          text,
  service       text,
  message       text,
  photo_paths   text[] not null default '{}',
  source_page   text,
  status        text not null default 'new'
                check (status in ('new','contacted','quoted','won','lost','spam')),
  quoted_amount numeric(10,2),
  notes         text
);
create index if not exists curbology_leads_status_created_idx on public.curbology_leads (status, created_at desc);

-- Reviews. They arrive unpublished; publishing is the owner's decision, per
-- review. He can choose what the site shows. He cannot make one disappear from
-- the inbox — that is the difference between curation and suppression.
create table if not exists public.curbology_reviews (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  email        text not null,
  rating       int  not null check (rating between 1 and 5),
  body         text not null,
  service      text,
  consented    boolean not null default false,
  published    boolean not null default false,
  owner_reply  text,
  status       text not null default 'new'
               check (status in ('new','replied','flagged','archived'))
);
create index if not exists curbology_reviews_published_idx on public.curbology_reviews (published, created_at desc);

-- Video testimonial bookings.
create table if not exists public.curbology_bookings (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  name           text not null,
  email          text not null,
  phone          text,
  format         text check (format in ('in-person','self-record','either')),
  requested_slots text,
  confirmed_slot timestamptz,
  state          text not null default 'requested'
                 check (state in ('requested','confirmed','recorded','received','published','declined','no-show')),
  video_url      text,
  notes          text
);
create index if not exists curbology_bookings_state_idx on public.curbology_bookings (state, created_at desc);

-- Editable site copy. Typed keys, not a page builder.
create table if not exists public.curbology_content_blocks (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Email suppression. Written ONLY by the unsubscribe POST handler — never on
-- page render, because scanners fetch every URL in a message before delivery.
create table if not exists public.curbology_unsubscribes (
  id             uuid primary key default gen_random_uuid(),
  contact_id     text,
  email          text,
  reason         text,
  unsubscribed_at timestamptz not null default now()
);
create unique index if not exists curbology_unsubscribes_contact_idx on public.curbology_unsubscribes (contact_id)
  where contact_id is not null;

alter table public.curbology_leads           enable row level security;
alter table public.curbology_reviews         enable row level security;
alter table public.curbology_bookings        enable row level security;
alter table public.curbology_content_blocks  enable row level security;
alter table public.curbology_unsubscribes    enable row level security;

-- No policies for anon or authenticated on purpose. RLS denies by default, and
-- the service role bypasses it — so the server routes are the only way in and
-- out. Adding an anon policy here would quietly undo the paragraph at the top.

-- Site copy is the one thing the public site reads directly, and only ever reads.
drop policy if exists content_public_read on public.curbology_content_blocks;
create policy content_public_read on public.curbology_content_blocks
  for select to anon using (true);
