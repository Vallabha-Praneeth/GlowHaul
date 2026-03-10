create or replace function public.current_user_can_access_booking(
  target_booking_id uuid,
  target_operator_organization_id uuid,
  target_planner_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_operator_organization_id = public.current_organization_id()
    or target_planner_organization_id = public.current_organization_id()
    or exists (
      select 1
      from public.runs r
      where r.booking_id = target_booking_id
        and r.driver_id = auth.uid()
    )
$$;

create or replace function public.current_user_can_access_run(
  target_booking_id uuid,
  target_driver_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_driver_id = auth.uid()
    or exists (
      select 1
      from public.bookings b
      where b.id = target_booking_id
        and (
          b.operator_organization_id = public.current_organization_id()
          or b.planner_organization_id = public.current_organization_id()
        )
    )
$$;

create or replace function public.current_user_can_mutate_run(target_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.id = target_booking_id
      and b.operator_organization_id = public.current_organization_id()
  )
$$;

create or replace function public.current_user_can_access_proof_asset(
  target_run_id uuid,
  target_driver_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_driver_id = auth.uid()
    or exists (
      select 1
      from public.runs r
      join public.bookings b on b.id = r.booking_id
      where r.id = target_run_id
        and (
          b.operator_organization_id = public.current_organization_id()
          or b.planner_organization_id = public.current_organization_id()
        )
    )
$$;

drop policy if exists "bookings_select_related_orgs_and_driver" on public.bookings;
create policy "bookings_select_related_orgs_and_driver"
on public.bookings
for select
using (
  public.current_user_can_access_booking(
    id,
    operator_organization_id,
    planner_organization_id
  )
);

drop policy if exists "runs_select_related_orgs_or_driver" on public.runs;
create policy "runs_select_related_orgs_or_driver"
on public.runs
for select
using (
  public.current_user_can_access_run(booking_id, driver_id)
);

drop policy if exists "runs_mutate_operator" on public.runs;
create policy "runs_mutate_operator"
on public.runs
for all
using (public.current_user_can_mutate_run(booking_id))
with check (public.current_user_can_mutate_run(booking_id));

drop policy if exists "proof_assets_select_related_orgs_or_driver" on public.proof_assets;
create policy "proof_assets_select_related_orgs_or_driver"
on public.proof_assets
for select
using (
  public.current_user_can_access_proof_asset(run_id, driver_id)
);
