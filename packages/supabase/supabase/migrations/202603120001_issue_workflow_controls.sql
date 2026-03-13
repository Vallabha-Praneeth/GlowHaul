alter table public.runs
  add column if not exists issue_note text,
  add column if not exists issue_reported_at timestamptz,
  add column if not exists issue_resolved_at timestamptz;

create or replace function public.update_driver_run_status(
  target_run_id uuid,
  target_status public.run_status,
  target_issue_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_run public.runs%rowtype;
  selected_booking public.bookings%rowtype;
  normalized_issue_note text;
  proof_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if public.current_user_role() <> 'driver' then
    raise exception 'Only drivers can update run status.';
  end if;

  select *
  into selected_run
  from public.runs
  where id = target_run_id
  for update;

  if not found then
    raise exception 'Run not found.';
  end if;

  if selected_run.driver_id is null or selected_run.driver_id <> auth.uid() then
    raise exception 'You do not have access to this run.';
  end if;

  normalized_issue_note := nullif(trim(target_issue_note), '');

  if selected_run.status = 'completed' and target_status <> 'completed' then
    raise exception 'Completed runs cannot be reopened.';
  end if;

  if selected_run.status = 'assigned' and target_status not in ('assigned', 'en_route', 'issue') then
    raise exception 'Assigned runs can only move to en_route or issue.';
  end if;

  if selected_run.status = 'en_route' and target_status not in ('en_route', 'live', 'issue') then
    raise exception 'En route runs can only move to live or issue.';
  end if;

  if selected_run.status = 'live' and target_status not in ('live', 'completed', 'issue') then
    raise exception 'Live runs can only move to completed or issue.';
  end if;

  if selected_run.status = 'issue' and target_status not in ('issue', 'en_route', 'live') then
    raise exception 'Issue runs can only resume to en_route or live.';
  end if;

  if target_status = 'issue' and selected_run.status <> 'issue' and normalized_issue_note is null then
    raise exception 'Add an issue note before reporting a run issue.';
  end if;

  if target_status = 'completed' and selected_run.proof_required then
    select count(*)
    into proof_count
    from public.proof_assets
    where run_id = target_run_id
      and driver_id = auth.uid();

    if proof_count = 0 then
      raise exception 'Upload at least one proof asset before completing this run.';
    end if;
  end if;

  select *
  into selected_booking
  from public.bookings
  where id = selected_run.booking_id
  for update;

  if not found then
    raise exception 'Booking not found for this run.';
  end if;

  update public.runs
  set
    status = target_status,
    issue_note = case
      when target_status = 'issue' then coalesce(normalized_issue_note, selected_run.issue_note)
      else selected_run.issue_note
    end,
    issue_reported_at = case
      when target_status = 'issue' and selected_run.status <> 'issue' then now()
      when target_status = 'issue' then coalesce(selected_run.issue_reported_at, now())
      else selected_run.issue_reported_at
    end,
    issue_resolved_at = case
      when target_status = 'issue' then null
      when selected_run.status = 'issue' and target_status <> 'issue' then now()
      else selected_run.issue_resolved_at
    end
  where id = target_run_id;

  update public.bookings
  set status = (
    case
      when target_status = 'completed' then 'completed'
      when target_status in ('en_route', 'live', 'issue') then 'in_progress'
      else selected_booking.status::text
    end
  )::public.booking_status
  where id = selected_booking.id
    and selected_booking.status <> 'cancelled';

  update public.slots
  set status = (
    case
      when target_status = 'completed' then 'completed'
      when target_status in ('en_route', 'live', 'issue') then 'running'
      else 'booked'
    end
  )::public.slot_status
  where id = selected_booking.slot_id
    and selected_booking.status <> 'cancelled';

  return target_run_id;
end;
$$;

create or replace function public.mutate_booking_slot_run_transaction(
  target_booking_id uuid,
  target_operator_organization_id uuid,
  target_internal_note text default null,
  target_booking_status public.booking_status default null,
  target_slot_status public.slot_status default null,
  target_driver_id uuid default null,
  target_run_status public.run_status default null,
  target_issue_note text default null,
  target_proof_required boolean default null,
  target_start_at timestamptz default null,
  target_end_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_booking public.bookings%rowtype;
  selected_slot public.slots%rowtype;
  selected_run public.runs%rowtype;
  selected_driver public.profiles%rowtype;
  normalized_internal_note text;
  normalized_issue_note text;
  next_booking_status public.booking_status;
  next_slot_status public.slot_status;
  next_run_status public.run_status;
  next_driver_id uuid;
  next_proof_required boolean;
  next_start_at timestamptz;
  next_end_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if public.current_user_role() <> 'operator' then
    raise exception 'Only operators can update campaign execution.';
  end if;

  if public.current_organization_id() is null or public.current_organization_id() <> target_operator_organization_id then
    raise exception 'You do not have access to this operator organization.';
  end if;

  select *
  into selected_booking
  from public.bookings
  where id = target_booking_id
    and operator_organization_id = target_operator_organization_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  select *
  into selected_slot
  from public.slots
  where id = selected_booking.slot_id
  for update;

  if not found then
    raise exception 'Slot not found for booking.';
  end if;

  select *
  into selected_run
  from public.runs
  where booking_id = target_booking_id
  order by scheduled_start_at
  limit 1
  for update;

  normalized_internal_note := nullif(trim(target_internal_note), '');
  normalized_issue_note := nullif(trim(target_issue_note), '');
  next_booking_status := coalesce(target_booking_status, selected_booking.status);
  next_slot_status := coalesce(target_slot_status, selected_slot.status);
  next_run_status := coalesce(target_run_status, selected_run.status, 'assigned'::public.run_status);
  next_driver_id := case
    when next_booking_status = 'cancelled' then null
    else coalesce(target_driver_id, selected_run.driver_id)
  end;
  next_proof_required := coalesce(target_proof_required, selected_run.proof_required, true);
  next_start_at := coalesce(target_start_at, selected_run.scheduled_start_at, selected_slot.start_at);
  next_end_at := coalesce(target_end_at, selected_run.scheduled_end_at, selected_slot.end_at);

  if next_start_at is null or next_end_at is null or next_end_at <= next_start_at then
    raise exception 'The run end time must be after the start time.';
  end if;

  if next_booking_status = 'cancelled' and selected_run.id is not null and selected_run.status in ('en_route', 'live', 'completed') then
    raise exception 'Live or completed campaigns cannot be cancelled.';
  end if;

  if next_booking_status <> 'cancelled' and next_driver_id is null then
    raise exception 'Choose a valid driver before saving dispatch changes.';
  end if;

  if next_driver_id is not null then
    select *
    into selected_driver
    from public.profiles
    where id = next_driver_id
      and organization_id = target_operator_organization_id
      and role = 'driver'
    limit 1;

    if not found then
      raise exception 'Choose a valid driver before saving dispatch changes.';
    end if;
  end if;

  if next_booking_status = 'confirmed' and next_run_status <> 'assigned' then
    raise exception 'Confirmed campaigns must keep the run assigned until dispatch begins.';
  end if;

  if next_booking_status = 'in_progress' and next_run_status not in ('en_route', 'live', 'issue') then
    raise exception 'In-progress campaigns must use en_route, live, or issue run states.';
  end if;

  if next_booking_status = 'completed' and next_run_status <> 'completed' then
    raise exception 'Completed campaigns must keep the run completed.';
  end if;

  if next_run_status = 'issue' and normalized_issue_note is null then
    raise exception 'Add an issue note before parking a run in issue state.';
  end if;

  update public.bookings
  set
    internal_note = normalized_internal_note,
    status = next_booking_status
  where id = selected_booking.id;

  update public.slots
  set status = next_slot_status
  where id = selected_slot.id;

  if selected_run.id is not null then
    update public.runs
    set
      driver_id = next_driver_id,
      issue_note = case
        when next_run_status = 'issue' then normalized_issue_note
        else selected_run.issue_note
      end,
      issue_reported_at = case
        when next_run_status = 'issue' and selected_run.status <> 'issue' then now()
        when next_run_status = 'issue' then coalesce(selected_run.issue_reported_at, now())
        else selected_run.issue_reported_at
      end,
      issue_resolved_at = case
        when next_run_status = 'issue' then null
        when selected_run.status = 'issue' and next_run_status <> 'issue' then now()
        else selected_run.issue_resolved_at
      end,
      proof_required = next_proof_required,
      scheduled_end_at = next_end_at,
      scheduled_start_at = next_start_at,
      status = next_run_status
    where id = selected_run.id;
  elsif next_booking_status <> 'cancelled' then
    insert into public.runs (
      booking_id,
      driver_id,
      issue_note,
      issue_reported_at,
      issue_resolved_at,
      proof_required,
      scheduled_end_at,
      scheduled_start_at,
      status
    ) values (
      selected_booking.id,
      next_driver_id,
      case when next_run_status = 'issue' then normalized_issue_note else null end,
      case when next_run_status = 'issue' then now() else null end,
      null,
      next_proof_required,
      next_end_at,
      next_start_at,
      next_run_status
    );
  end if;

  return selected_booking.id;
end;
$$;

grant execute on function public.mutate_booking_slot_run_transaction(
  uuid,
  uuid,
  text,
  public.booking_status,
  public.slot_status,
  uuid,
  public.run_status,
  text,
  boolean,
  timestamptz,
  timestamptz
) to authenticated;
