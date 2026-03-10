-- Local-first demo seed data for operator, planner, and driver flows.
-- The auth.users inserts mirror a local development setup and are intentionally deterministic.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'operator.demo@glowhaul.local',
    crypt('demo-password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Operator Demo"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'planner.demo@glowhaul.local',
    crypt('demo-password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Planner Demo"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'driver.demo@glowhaul.local',
    crypt('demo-password', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Driver Demo"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into public.organizations (id, name, slug, kind, primary_region)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GlowHaul Fleet Co.', 'glowhaul-fleet', 'operator', 'DFW'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Northstar Media Planning', 'northstar-media-planning', 'agency', 'Austin')
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role, organization_id, phone, onboarding_state)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'operator.demo@glowhaul.local',
    'Olivia Operator',
    'operator',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '+15555550101',
    'active'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'planner.demo@glowhaul.local',
    'Parker Planner',
    'planner',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '+15555550102',
    'active'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'driver.demo@glowhaul.local',
    'Drew Driver',
    'driver',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '+15555550103',
    'active'
  )
on conflict (id) do nothing;

insert into public.trucks (
  id,
  operator_organization_id,
  display_name,
  vehicle_code,
  screen_width_ft,
  screen_height_ft,
  home_region,
  verification_status,
  notes
)
values
  (
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'GlowHaul Prime 01',
    'GH-DFW-001',
    20,
    10,
    'DFW',
    'verified',
    'Flagship Dallas inventory'
  )
on conflict (id) do nothing;

insert into public.slots (
  id,
  truck_id,
  operator_organization_id,
  region,
  start_at,
  end_at,
  rate_cents,
  status,
  campaign_notes
)
values
  (
    '55555555-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'DFW',
    timezone('utc', now()) + interval '1 day',
    timezone('utc', now()) + interval '1 day 4 hours',
    250000,
    'booked',
    'Prime evening commute route for Dallas Product Launch'
  ),
  (
    'aaaaaaaa-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Austin',
    timezone('utc', now()) + interval '2 days',
    timezone('utc', now()) + interval '2 days 3 hours',
    265000,
    'available',
    'Capitol corridor evening inventory'
  )
on conflict (id) do nothing;

insert into public.offers (
  id,
  slot_id,
  planner_organization_id,
  amount_cents,
  status,
  message
)
values
  (
    '66666666-6666-6666-6666-666666666666',
    '55555555-5555-5555-5555-555555555555',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    240000,
    'accepted',
    'Accepted launch inventory for the Dallas Product Launch.'
  ),
  (
    'bbbbbbbb-6666-6666-6666-666666666666',
    'aaaaaaaa-5555-5555-5555-555555555555',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    255000,
    'pending',
    'Ready to lock this Austin route for a regional launch.'
  )
on conflict (id) do nothing;

insert into public.bookings (
  id,
  slot_id,
  offer_id,
  operator_organization_id,
  planner_organization_id,
  status,
  campaign_name
)
values
  (
    '77777777-7777-7777-7777-777777777777',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'confirmed',
    'Dallas Product Launch'
  )
on conflict (id) do nothing;

insert into public.runs (
  id,
  booking_id,
  driver_id,
  scheduled_start_at,
  scheduled_end_at,
  status,
  proof_required
)
values
  (
    '88888888-8888-8888-8888-888888888888',
    '77777777-7777-7777-7777-777777777777',
    '33333333-3333-3333-3333-333333333333',
    timezone('utc', now()) + interval '1 day',
    timezone('utc', now()) + interval '1 day 4 hours',
    'assigned',
    true
  )
on conflict (id) do nothing;

insert into public.proof_assets (
  id,
  run_id,
  driver_id,
  storage_path,
  mime_type,
  captured_at,
  status
)
values
  (
    '99999999-9999-9999-9999-999999999999',
    '88888888-8888-8888-8888-888888888888',
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333/77777777-7777-7777-7777-777777777777/proof-01.jpg',
    'image/jpeg',
    timezone('utc', now()),
    'uploaded'
  )
on conflict (id) do nothing;
