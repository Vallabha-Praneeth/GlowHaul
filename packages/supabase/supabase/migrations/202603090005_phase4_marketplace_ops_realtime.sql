alter table public.offers
  add column if not exists operator_note text,
  add column if not exists decided_at timestamptz;

alter table public.bookings
  add column if not exists internal_note text;

alter table public.proof_assets
  add column if not exists review_notes text,
  add column if not exists reviewed_at timestamptz;

create or replace function public.accept_offer(
  target_offer_id uuid,
  target_campaign_name text default null,
  target_operator_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_offer public.offers%rowtype;
  selected_slot public.slots%rowtype;
  booking_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if public.current_user_role() <> 'operator' then
    raise exception 'Only operators can accept offers.';
  end if;

  select *
  into selected_offer
  from public.offers
  where id = target_offer_id;

  if not found then
    raise exception 'Offer not found.';
  end if;

  if selected_offer.status <> 'pending' then
    raise exception 'Only pending offers can be accepted.';
  end if;

  select *
  into selected_slot
  from public.slots
  where id = selected_offer.slot_id;

  if not found then
    raise exception 'Slot not found for offer.';
  end if;

  if selected_slot.operator_organization_id <> public.current_organization_id() then
    raise exception 'You do not have access to this offer.';
  end if;

  update public.offers
  set
    status = 'rejected',
    operator_note = coalesce(operator_note, 'Another offer was selected for this slot.'),
    decided_at = timezone('utc', now())
  where slot_id = selected_offer.slot_id
    and status = 'pending'
    and id <> selected_offer.id;

  update public.offers
  set
    status = 'accepted',
    operator_note = nullif(trim(target_operator_note), ''),
    decided_at = timezone('utc', now())
  where id = selected_offer.id;

  update public.slots
  set status = 'booked'
  where id = selected_offer.slot_id;

  insert into public.bookings (
    slot_id,
    offer_id,
    operator_organization_id,
    planner_organization_id,
    status,
    campaign_name,
    internal_note
  )
  values (
    selected_offer.slot_id,
    selected_offer.id,
    selected_slot.operator_organization_id,
    selected_offer.planner_organization_id,
    'confirmed',
    coalesce(nullif(trim(target_campaign_name), ''), 'Booked GlowHaul Campaign'),
    nullif(trim(target_operator_note), '')
  )
  on conflict (offer_id) do update
  set
    campaign_name = excluded.campaign_name,
    internal_note = excluded.internal_note,
    status = 'confirmed'
  returning id into booking_id;

  return booking_id;
end;
$$;

create or replace function public.reject_offer(
  target_offer_id uuid,
  target_operator_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_offer public.offers%rowtype;
  selected_slot public.slots%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if public.current_user_role() <> 'operator' then
    raise exception 'Only operators can reject offers.';
  end if;

  select *
  into selected_offer
  from public.offers
  where id = target_offer_id;

  if not found then
    raise exception 'Offer not found.';
  end if;

  if selected_offer.status <> 'pending' then
    raise exception 'Only pending offers can be rejected.';
  end if;

  select *
  into selected_slot
  from public.slots
  where id = selected_offer.slot_id;

  if not found then
    raise exception 'Slot not found for offer.';
  end if;

  if selected_slot.operator_organization_id <> public.current_organization_id() then
    raise exception 'You do not have access to this offer.';
  end if;

  update public.offers
  set
    status = 'rejected',
    operator_note = coalesce(nullif(trim(target_operator_note), ''), 'Offer declined by the operator.'),
    decided_at = timezone('utc', now())
  where id = selected_offer.id;

  if not exists (
    select 1
    from public.offers
    where slot_id = selected_offer.slot_id
      and status = 'pending'
  ) then
    update public.slots
    set status = 'available'
    where id = selected_offer.slot_id
      and status <> 'booked';
  end if;

  return selected_offer.id;
end;
$$;

create or replace function public.update_campaign_execution(
  target_booking_id uuid,
  target_booking_status public.booking_status default null,
  target_run_status public.run_status default null,
  target_internal_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_booking public.bookings%rowtype;
  selected_run public.runs%rowtype;
  next_booking_status public.booking_status;
  next_run_status public.run_status;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if public.current_user_role() <> 'operator' then
    raise exception 'Only operators can update campaign execution.';
  end if;

  select *
  into selected_booking
  from public.bookings
  where id = target_booking_id;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if selected_booking.operator_organization_id <> public.current_organization_id() then
    raise exception 'You do not have access to this booking.';
  end if;

  select *
  into selected_run
  from public.runs
  where booking_id = target_booking_id
  order by scheduled_start_at
  limit 1;

  next_booking_status := coalesce(target_booking_status, selected_booking.status);
  next_run_status := coalesce(target_run_status, selected_run.status);

  update public.bookings
  set
    status = next_booking_status,
    internal_note = nullif(trim(target_internal_note), '')
  where id = target_booking_id;

  if selected_run.id is not null then
    update public.runs
    set status = next_run_status
    where id = selected_run.id;
  end if;

  update public.slots
  set status = case
    when next_booking_status = 'cancelled' then 'cancelled'
    when next_booking_status = 'completed' or next_run_status = 'completed' then 'completed'
    when next_booking_status = 'in_progress' or next_run_status in ('en_route', 'live') then 'running'
    else 'booked'
  end
  where id = selected_booking.slot_id;

  return target_booking_id;
end;
$$;

create or replace function public.review_proof_asset(
  target_proof_asset_id uuid,
  target_status public.proof_asset_status,
  target_review_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_proof public.proof_assets%rowtype;
  selected_run public.runs%rowtype;
  selected_booking public.bookings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if public.current_user_role() <> 'operator' then
    raise exception 'Only operators can review proof.';
  end if;

  if target_status not in ('approved', 'rejected') then
    raise exception 'Proof review status must be approved or rejected.';
  end if;

  select *
  into selected_proof
  from public.proof_assets
  where id = target_proof_asset_id;

  if not found then
    raise exception 'Proof asset not found.';
  end if;

  select *
  into selected_run
  from public.runs
  where id = selected_proof.run_id;

  if not found then
    raise exception 'Run not found for proof asset.';
  end if;

  select *
  into selected_booking
  from public.bookings
  where id = selected_run.booking_id;

  if not found then
    raise exception 'Booking not found for proof asset.';
  end if;

  if selected_booking.operator_organization_id <> public.current_organization_id() then
    raise exception 'You do not have access to this proof asset.';
  end if;

  update public.proof_assets
  set
    status = target_status,
    review_notes = nullif(trim(target_review_notes), ''),
    reviewed_at = timezone('utc', now())
  where id = target_proof_asset_id;

  return target_proof_asset_id;
end;
$$;

grant execute on function public.accept_offer(uuid, text, text) to authenticated;
grant execute on function public.reject_offer(uuid, text) to authenticated;
grant execute on function public.update_campaign_execution(uuid, public.booking_status, public.run_status, text) to authenticated;
grant execute on function public.review_proof_asset(uuid, public.proof_asset_status, text) to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.slots;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.offers;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.bookings;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.runs;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.proof_assets;
  exception when duplicate_object then
    null;
  end;
end $$;
