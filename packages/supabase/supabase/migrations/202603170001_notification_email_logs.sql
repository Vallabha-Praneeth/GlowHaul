create table if not exists public.notification_email_logs (
  id uuid not null default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc', now()),
  recipient_profile_id uuid not null references public.profiles(id),
  event_key text not null,
  subject text not null,
  href text not null,
  attempts int not null,
  error text not null,
  primary key (id)
);
create index if not exists notification_email_logs_recipient_idx
  on public.notification_email_logs (recipient_profile_id, created_at desc);
