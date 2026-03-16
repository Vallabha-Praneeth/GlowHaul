do $$
begin
  create type public.notification_kind as enum (
    'offer_accepted',
    'campaign_client_ready',
    'campaign_closed',
    'dispatch_updated',
    'run_issue_reported',
    'proof_uploaded',
    'proof_reviewed'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  run_id uuid references public.runs(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  proof_asset_id uuid references public.proof_assets(id) on delete set null,
  kind public.notification_kind not null,
  title text not null,
  body text not null,
  href text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_profile_id, created_at desc);

create index if not exists notifications_recipient_read_at_idx
  on public.notifications (recipient_profile_id, read_at, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Recipients can read notifications" on public.notifications;
create policy "Recipients can read notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = recipient_profile_id);

drop policy if exists "Recipients can update notification read state" on public.notifications;
create policy "Recipients can update notification read state"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = recipient_profile_id)
  with check (auth.uid() = recipient_profile_id);

grant select, update on public.notifications to authenticated;
