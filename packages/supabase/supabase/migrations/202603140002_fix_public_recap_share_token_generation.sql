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
  generated_token := encode(extensions.gen_random_bytes(24), 'hex');

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
