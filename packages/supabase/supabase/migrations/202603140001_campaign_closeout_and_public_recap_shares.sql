alter table public.bookings
  add column if not exists client_ready_at timestamptz,
  add column if not exists client_ready_by uuid references public.profiles(id) on delete set null,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references public.profiles(id) on delete set null,
  add column if not exists closeout_note text;

create table if not exists public.campaign_recap_shares (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  token text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists campaign_recap_shares_booking_idx
  on public.campaign_recap_shares (booking_id, created_at desc);

create index if not exists campaign_recap_shares_active_idx
  on public.campaign_recap_shares (booking_id, expires_at)
  where revoked_at is null;

alter table public.campaign_recap_shares enable row level security;

create or replace function public.current_user_can_manage_campaign_recap(
  target_operator_organization_id uuid,
  target_planner_organization_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      (
        public.current_user_role() = 'operator'
        and public.current_organization_id() = target_operator_organization_id
      )
      or (
        public.current_user_role() = 'planner'
        and public.current_organization_id() = target_planner_organization_id
      )
    );
$$;

create or replace function public.update_campaign_closeout(
  target_booking_id uuid,
  target_intent text,
  target_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_booking public.bookings%rowtype;
  selected_run public.runs%rowtype;
  approved_proof_exists boolean;
  normalized_note text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if target_intent not in ('mark_client_ready', 'mark_closed') then
    raise exception 'Unsupported closeout action.';
  end if;

  select *
  into selected_booking
  from public.bookings
  where id = target_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if not public.current_user_can_manage_campaign_recap(
    selected_booking.operator_organization_id,
    selected_booking.planner_organization_id
  ) then
    raise exception 'You do not have access to this campaign closeout.';
  end if;

  normalized_note := nullif(trim(target_note), '');

  select *
  into selected_run
  from public.runs
  where booking_id = selected_booking.id
  order by scheduled_start_at desc
  limit 1
  for update;

  approved_proof_exists := false;

  if selected_run.id is not null then
    select exists (
      select 1
      from public.proof_assets
      where run_id = selected_run.id
        and status = 'approved'
    )
    into approved_proof_exists;
  end if;

  if target_intent = 'mark_client_ready' then
    if selected_booking.status <> 'completed' then
      raise exception 'Only completed campaigns can be marked client-ready.';
    end if;

    if selected_run.id is not null and coalesce(selected_run.proof_required, true) and not approved_proof_exists then
      raise exception 'Approve at least one proof asset before marking this campaign client-ready.';
    end if;

    update public.bookings
    set
      client_ready_at = coalesce(client_ready_at, now()),
      client_ready_by = coalesce(client_ready_by, auth.uid()),
      closeout_note = coalesce(normalized_note, closeout_note)
    where id = selected_booking.id;

    return selected_booking.id;
  end if;

  if selected_booking.status not in ('completed', 'cancelled') then
    raise exception 'Only completed or cancelled campaigns can be closed.';
  end if;

  if selected_booking.status = 'completed' and selected_booking.client_ready_at is null then
    raise exception 'Mark the campaign client-ready before closing it.';
  end if;

  update public.bookings
  set
    closed_at = coalesce(closed_at, now()),
    closed_by = coalesce(closed_by, auth.uid()),
    closeout_note = coalesce(normalized_note, closeout_note)
  where id = selected_booking.id;

  return selected_booking.id;
end;
$$;

create or replace function public.create_or_refresh_campaign_recap_share(
  target_booking_id uuid,
  target_expiry_hours integer default 168
)
returns table(token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_booking public.bookings%rowtype;
  selected_run public.runs%rowtype;
  approved_proof_exists boolean;
  generated_token text;
  normalized_expiry_hours integer;
  share_expiry timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into selected_booking
  from public.bookings
  where id = target_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if not public.current_user_can_manage_campaign_recap(
    selected_booking.operator_organization_id,
    selected_booking.planner_organization_id
  ) then
    raise exception 'You do not have access to share this recap.';
  end if;

  if selected_booking.status <> 'completed' then
    raise exception 'Only completed campaigns can create public recap links.';
  end if;

  if selected_booking.client_ready_at is null then
    raise exception 'Mark the campaign client-ready before creating a public recap link.';
  end if;

  select *
  into selected_run
  from public.runs
  where booking_id = selected_booking.id
  order by scheduled_start_at desc
  limit 1
  for update;

  approved_proof_exists := false;

  if selected_run.id is not null then
    select exists (
      select 1
      from public.proof_assets
      where run_id = selected_run.id
        and status = 'approved'
    )
    into approved_proof_exists;
  end if;

  if selected_run.id is not null and coalesce(selected_run.proof_required, true) and not approved_proof_exists then
    raise exception 'Approve at least one proof asset before creating a public recap link.';
  end if;

  normalized_expiry_hours := greatest(24, least(coalesce(target_expiry_hours, 168), 24 * 30));
  share_expiry := now() + make_interval(hours => normalized_expiry_hours);
  generated_token := encode(gen_random_bytes(24), 'hex');

  update public.campaign_recap_shares
  set revoked_at = now()
  where booking_id = selected_booking.id
    and revoked_at is null;

  insert into public.campaign_recap_shares (
    booking_id,
    token,
    created_by,
    expires_at
  )
  values (
    selected_booking.id,
    generated_token,
    auth.uid(),
    share_expiry
  );

  return query
  select generated_token, share_expiry;
end;
$$;

create or replace function public.revoke_campaign_recap_share(target_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_booking public.bookings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into selected_booking
  from public.bookings
  where id = target_booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if not public.current_user_can_manage_campaign_recap(
    selected_booking.operator_organization_id,
    selected_booking.planner_organization_id
  ) then
    raise exception 'You do not have access to revoke this recap share.';
  end if;

  update public.campaign_recap_shares
  set revoked_at = now()
  where booking_id = selected_booking.id
    and revoked_at is null;

  return selected_booking.id;
end;
$$;

grant execute on function public.current_user_can_manage_campaign_recap(uuid, uuid) to authenticated;
grant execute on function public.update_campaign_closeout(uuid, text, text) to authenticated;
grant execute on function public.create_or_refresh_campaign_recap_share(uuid, integer) to authenticated;
grant execute on function public.revoke_campaign_recap_share(uuid) to authenticated;
