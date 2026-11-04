-- The instant quote.
--
-- Same posture as the core tables: nothing is readable or writable with the
-- anon key. Customers reach their own quote only through server routes, using a
-- random token whose hash is stored here. The owner's decisions go through the
-- RPCs below, so they are role-checked and logged like every other console write.

-- Every saved rate card is kept, so an old quote can always show which numbers
-- priced it. The newest row is the current card. approved_at is null until the
-- owner approves that exact row, and no customer sees a price from a null row.
create table if not exists public.quote_rate_cards (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  card        jsonb not null,
  approved_at timestamptz,
  created_by  text
);
create index if not exists quote_rate_cards_created_idx on public.quote_rate_cards (created_at desc);

create table if not exists public.quotes (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  token_hash     text not null,
  ip_hash        text not null,
  status         text not null default 'draft'
                 check (status in ('draft','reading','priced','review','released','declined','outside')),
  address        text not null,
  matched_address text,
  area           text not null check (area in ('inside','outside','unknown')),
  service        text,
  photo_paths    text[] not null default '{}',
  name           text,
  email          text,
  phone          text,
  message        text,
  text_consent   boolean not null default false,
  text_consent_wording text,
  submitted_at   timestamptz,
  items          jsonb not null default '[]',
  -- What the photo reader reported, and when it could not read them, nothing.
  photo_read     jsonb,
  -- The whole calculation, including a suggestion the customer never sees when
  -- the outcome is review.
  result         jsonb,
  rate_card_id   uuid references public.quote_rate_cards (id),
  -- The only money a customer is shown. Set when the outcome is priced, or when
  -- the owner releases a reviewed quote.
  price_cents    int check (price_cents is null or price_cents >= 0),
  deposit_cents  int check (deposit_cents is null or deposit_cents >= 0),
  decided_by     text,
  decided_at     timestamptz,
  owner_note     text,
  lead_id        uuid references public.leads (id) on delete set null
);
create index if not exists quotes_status_created_idx on public.quotes (status, created_at desc);
create index if not exists quotes_ip_created_idx on public.quotes (ip_hash, created_at desc);

alter table public.quote_rate_cards enable row level security;
alter table public.quotes           enable row level security;

-- Photos of people's homes. Private, and only ever read with the secret key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quote-photos', 'quote-photos', false, 3670016, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Parallel uploads would lose paths with a read-then-write from the route, and
-- could pass the photo limit. One update statement does both checks at once.
-- Called with the secret key by the upload route, so it must not be public.
create or replace function public.quote_add_photo(_id uuid, _path text, _max int)
returns boolean language sql security definer set search_path = public as $$
  with changed as (
    update public.quotes
       set photo_paths = array_append(photo_paths, _path), updated_at = now()
     where id = _id and status = 'draft' and coalesce(array_length(photo_paths, 1), 0) < _max
    returning id
  )
  select exists (select 1 from changed);
$$;
revoke all on function public.quote_add_photo(uuid, text, int) from public, anon, authenticated;
grant execute on function public.quote_add_photo(uuid, text, int) to service_role;

-- ---------------------------------------------------------------- the owner

-- A changed card is an unapproved card. Approval is a statement about these
-- exact numbers, so it cannot carry over from the previous row.
create or replace function public.quote_rates_save(_card jsonb, _approve boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare _new uuid;
begin
  perform public.require_admin();
  insert into public.quote_rate_cards (card, approved_at, created_by)
  values (_card, case when _approve then now() end, auth.jwt() ->> 'email')
  returning id into _new;
  perform public.log_activity('quote_rates', _new::text, case when _approve then 'approve' else 'save' end, _card);
  return _new;
end; $$;

-- 'reading' is allowed because a worker can die during the photo read, and the
-- customer who is left waiting still needs an answer from someone. 'outside' is
-- allowed because the owner may choose to travel for a job.
create or replace function public.quote_release(_id uuid, _price_cents int, _deposit_cents int, _note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare _lead uuid;
begin
  perform public.require_admin();
  if _price_cents is null or _price_cents <= 0 then raise exception 'A released quote needs a price'; end if;
  if _deposit_cents is null or _deposit_cents < 0 then raise exception 'That deposit is not a number'; end if;
  update public.quotes
     set status = 'released', price_cents = _price_cents, deposit_cents = _deposit_cents,
         owner_note = nullif(_note, ''), decided_by = auth.jwt() ->> 'email',
         decided_at = now(), updated_at = now()
   where id = _id and status in ('review','reading','outside')
  returning lead_id into _lead;
  if not found then raise exception 'That quote is not waiting for a decision'; end if;
  if _lead is not null then
    update public.leads set quoted_amount = _price_cents / 100.0, status = 'quoted' where id = _lead;
  end if;
  perform public.log_activity('quote', _id::text, 'release',
    jsonb_build_object('price_cents', _price_cents, 'deposit_cents', _deposit_cents));
end; $$;

create or replace function public.quote_decline(_id uuid, _note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  update public.quotes
     set status = 'declined', price_cents = null, deposit_cents = null,
         owner_note = nullif(_note, ''), decided_by = auth.jwt() ->> 'email',
         decided_at = now(), updated_at = now()
   where id = _id and status in ('review','reading','outside');
  if not found then raise exception 'That quote is not waiting for a decision'; end if;
  perform public.log_activity('quote', _id::text, 'decline', '{}'::jsonb);
end; $$;
