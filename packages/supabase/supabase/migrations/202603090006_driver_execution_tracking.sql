create or replace function public.update_driver_run_status(
  target_run_id uuid,
  target_status public.run_status
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_run public.runs%rowtype;
  selected_booking public.bookings%rowtype;
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
  where id = target_run_id;

  if not found then
    raise exception 'Run not found.';
  end if;

  if selected_run.driver_id <> auth.uid() then
    raise exception 'You do not have access to this run.';
  end if;

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
  where id = selected_run.booking_id;

  if not found then
    raise exception 'Booking not found for this run.';
  end if;

  update public.runs
  set status = target_status
  where id = target_run_id;

  update public.bookings
  set status = case
    when target_status = 'completed' then 'completed'
    when target_status in ('en_route', 'live', 'issue') then 'in_progress'
    else selected_booking.status
  end
  where id = selected_booking.id;

  update public.slots
  set status = case
    when target_status = 'completed' then 'completed'
    when target_status in ('en_route', 'live', 'issue') then 'running'
    else 'booked'
  end
  where id = selected_booking.slot_id;

  return target_run_id;
end;
$$;

grant execute on function public.update_driver_run_status(uuid, public.run_status) to authenticated;
