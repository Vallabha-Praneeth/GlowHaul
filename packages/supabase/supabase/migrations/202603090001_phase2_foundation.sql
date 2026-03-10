create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('operator', 'planner', 'driver');
  end if;
  if not exists (select 1 from pg_type where typname = 'organization_kind') then
    create type public.organization_kind as enum ('operator', 'agency');
  end if;
  if not exists (select 1 from pg_type where typname = 'region_code') then
    create type public.region_code as enum ('DFW', 'Houston', 'Austin', 'San Antonio', 'El Paso', 'RGV');
  end if;
  if not exists (select 1 from pg_type where typname = 'slot_status') then
    create type public.slot_status as enum ('draft', 'available', 'offered', 'booked', 'running', 'completed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'offer_status') then
    create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'run_status') then
    create type public.run_status as enum ('assigned', 'en_route', 'live', 'completed', 'issue');
  end if;
  if not exists (select 1 from pg_type where typname = 'proof_asset_status') then
    create type public.proof_asset_status as enum ('pending', 'uploaded', 'approved', 'rejected');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind public.organization_kind not null,
  primary_region public.region_code,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null,
  organization_id uuid references public.organizations(id) on delete set null,
  phone text,
  onboarding_state text not null default 'invited',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trucks (
  id uuid primary key default gen_random_uuid(),
  operator_organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null,
  vehicle_code text not null unique,
  screen_width_ft integer not null,
  screen_height_ft integer not null,
  home_region public.region_code not null,
  verification_status text not null default 'pending',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid not null references public.trucks(id) on delete cascade,
  operator_organization_id uuid not null references public.organizations(id) on delete cascade,
  region public.region_code not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  rate_cents integer not null check (rate_cents > 0),
  status public.slot_status not null default 'draft',
  campaign_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint slots_time_window check (end_at > start_at)
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots(id) on delete cascade,
  planner_organization_id uuid not null references public.organizations(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  status public.offer_status not null default 'pending',
  message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.slots(id) on delete cascade,
  offer_id uuid unique references public.offers(id) on delete set null,
  operator_organization_id uuid not null references public.organizations(id) on delete cascade,
  planner_organization_id uuid not null references public.organizations(id) on delete cascade,
  status public.booking_status not null default 'pending',
  campaign_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  status public.run_status not null default 'assigned',
  proof_required boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint runs_time_window check (scheduled_end_at > scheduled_start_at)
);

create table if not exists public.proof_assets (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  driver_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  captured_at timestamptz,
  status public.proof_asset_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations
for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trucks_set_updated_at on public.trucks;
create trigger trucks_set_updated_at before update on public.trucks
for each row execute procedure public.set_updated_at();

drop trigger if exists slots_set_updated_at on public.slots;
create trigger slots_set_updated_at before update on public.slots
for each row execute procedure public.set_updated_at();

drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at before update on public.offers
for each row execute procedure public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at before update on public.bookings
for each row execute procedure public.set_updated_at();

drop trigger if exists runs_set_updated_at on public.runs;
create trigger runs_set_updated_at before update on public.runs
for each row execute procedure public.set_updated_at();

drop trigger if exists proof_assets_set_updated_at on public.proof_assets;
create trigger proof_assets_set_updated_at before update on public.proof_assets
for each row execute procedure public.set_updated_at();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.trucks enable row level security;
alter table public.slots enable row level security;
alter table public.offers enable row level security;
alter table public.bookings enable row level security;
alter table public.runs enable row level security;
alter table public.proof_assets enable row level security;

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
on public.organizations
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.organization_id = organizations.id
      and p.id = auth.uid()
  )
);

drop policy if exists "profiles_select_self_or_org" on public.profiles;
create policy "profiles_select_self_or_org"
on public.profiles
for select
using (
  id = auth.uid()
  or organization_id = public.current_organization_id()
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "trucks_select_operator_or_planner" on public.trucks;
create policy "trucks_select_operator_or_planner"
on public.trucks
for select
using (
  operator_organization_id = public.current_organization_id()
  or public.current_user_role() = 'planner'
);

drop policy if exists "trucks_mutate_operator" on public.trucks;
create policy "trucks_mutate_operator"
on public.trucks
for all
using (
  public.current_user_role() = 'operator'
  and operator_organization_id = public.current_organization_id()
)
with check (
  public.current_user_role() = 'operator'
  and operator_organization_id = public.current_organization_id()
);

drop policy if exists "slots_select_related_or_available" on public.slots;
create policy "slots_select_related_or_available"
on public.slots
for select
using (
  operator_organization_id = public.current_organization_id()
  or (public.current_user_role() = 'planner' and status in ('available', 'offered', 'booked'))
);

drop policy if exists "slots_mutate_operator" on public.slots;
create policy "slots_mutate_operator"
on public.slots
for all
using (
  public.current_user_role() = 'operator'
  and operator_organization_id = public.current_organization_id()
)
with check (
  public.current_user_role() = 'operator'
  and operator_organization_id = public.current_organization_id()
);

drop policy if exists "offers_select_related_orgs" on public.offers;
create policy "offers_select_related_orgs"
on public.offers
for select
using (
  planner_organization_id = public.current_organization_id()
  or exists (
    select 1
    from public.slots s
    where s.id = offers.slot_id
      and s.operator_organization_id = public.current_organization_id()
  )
);

drop policy if exists "offers_insert_planner" on public.offers;
create policy "offers_insert_planner"
on public.offers
for insert
with check (
  public.current_user_role() = 'planner'
  and planner_organization_id = public.current_organization_id()
);

drop policy if exists "offers_update_related_orgs" on public.offers;
create policy "offers_update_related_orgs"
on public.offers
for update
using (
  planner_organization_id = public.current_organization_id()
  or exists (
    select 1
    from public.slots s
    where s.id = offers.slot_id
      and s.operator_organization_id = public.current_organization_id()
  )
)
with check (
  planner_organization_id = public.current_organization_id()
  or exists (
    select 1
    from public.slots s
    where s.id = offers.slot_id
      and s.operator_organization_id = public.current_organization_id()
  )
);

drop policy if exists "bookings_select_related_orgs_and_driver" on public.bookings;
create policy "bookings_select_related_orgs_and_driver"
on public.bookings
for select
using (
  operator_organization_id = public.current_organization_id()
  or planner_organization_id = public.current_organization_id()
  or exists (
    select 1
    from public.runs r
    where r.booking_id = bookings.id
      and r.driver_id = auth.uid()
  )
);

drop policy if exists "bookings_mutate_operator" on public.bookings;
create policy "bookings_mutate_operator"
on public.bookings
for all
using (
  operator_organization_id = public.current_organization_id()
)
with check (
  operator_organization_id = public.current_organization_id()
);

drop policy if exists "runs_select_related_orgs_or_driver" on public.runs;
create policy "runs_select_related_orgs_or_driver"
on public.runs
for select
using (
  driver_id = auth.uid()
  or exists (
    select 1
    from public.bookings b
    where b.id = runs.booking_id
      and (
        b.operator_organization_id = public.current_organization_id()
        or b.planner_organization_id = public.current_organization_id()
      )
  )
);

drop policy if exists "runs_mutate_operator" on public.runs;
create policy "runs_mutate_operator"
on public.runs
for all
using (
  exists (
    select 1
    from public.bookings b
    where b.id = runs.booking_id
      and b.operator_organization_id = public.current_organization_id()
  )
)
with check (
  exists (
    select 1
    from public.bookings b
    where b.id = runs.booking_id
      and b.operator_organization_id = public.current_organization_id()
  )
);

drop policy if exists "proof_assets_select_related_orgs_or_driver" on public.proof_assets;
create policy "proof_assets_select_related_orgs_or_driver"
on public.proof_assets
for select
using (
  driver_id = auth.uid()
  or exists (
    select 1
    from public.runs r
    join public.bookings b on b.id = r.booking_id
    where r.id = proof_assets.run_id
      and (
        b.operator_organization_id = public.current_organization_id()
        or b.planner_organization_id = public.current_organization_id()
      )
  )
);

drop policy if exists "proof_assets_insert_driver" on public.proof_assets;
create policy "proof_assets_insert_driver"
on public.proof_assets
for insert
with check (
  driver_id = auth.uid()
);

insert into storage.buckets (id, name, public)
values ('proof-uploads', 'proof-uploads', false)
on conflict (id) do nothing;
