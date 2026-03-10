create or replace function public.accept_offer(target_offer_id uuid, target_campaign_name text default null)
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
  set status = 'rejected'
  where slot_id = selected_offer.slot_id
    and status = 'pending'
    and id <> selected_offer.id;

  update public.offers
  set status = 'accepted'
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
    campaign_name
  )
  values (
    selected_offer.slot_id,
    selected_offer.id,
    selected_slot.operator_organization_id,
    selected_offer.planner_organization_id,
    'confirmed',
    coalesce(nullif(trim(target_campaign_name), ''), 'Booked GlowHaul Campaign')
  )
  on conflict (offer_id) do update
  set
    campaign_name = excluded.campaign_name,
    status = 'confirmed'
  returning id into booking_id;

  return booking_id;
end;
$$;

grant execute on function public.accept_offer(uuid, text) to authenticated;

drop policy if exists "proof_assets_insert_driver" on public.proof_assets;
create policy "proof_assets_insert_driver"
on public.proof_assets
for insert
with check (
  driver_id = auth.uid()
  and public.current_user_can_access_proof_asset(run_id, driver_id)
);

drop policy if exists "proof_uploads_select_owner" on storage.objects;
create policy "proof_uploads_select_owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'proof-uploads'
  and owner_id = auth.uid()::text
);

drop policy if exists "proof_uploads_insert_owner_folder" on storage.objects;
create policy "proof_uploads_insert_owner_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'proof-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);
