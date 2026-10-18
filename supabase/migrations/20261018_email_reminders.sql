-- Email is opt-in. The app's local reminder choices are copied here only when enabled.
create table public.rawit_email_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_enabled boolean not null default false,
  reminders_enabled boolean not null default true,
  intervals_days integer[] not null default array[3, 1, 0],
  updated_at timestamptz not null default now(),
  constraint rawit_email_intervals_valid check (
    intervals_days <@ array[0, 1, 2, 3]::integer[]
  )
);

alter table public.rawit_email_preferences enable row level security;
revoke all on public.rawit_email_preferences from anon;
grant select, insert, update on public.rawit_email_preferences to authenticated;
create policy "Users read their email settings" on public.rawit_email_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create their email settings" on public.rawit_email_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their email settings" on public.rawit_email_preferences
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table public.rawit_email_deliveries (
  user_id uuid not null references auth.users (id) on delete cascade,
  period_id text not null,
  expiration_date date not null,
  days_before integer not null,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key (user_id, period_id, expiration_date, days_before)
);
alter table public.rawit_email_deliveries enable row level security;
revoke all on public.rawit_email_deliveries from anon, authenticated;

-- Service-role-only RPCs keep the Auth email and delivery ledger off the client API.
create or replace function public.rawit_due_email_reminders()
returns table (
  user_id uuid, period_id text, subscriber_name text, network_name text,
  expiration_date date, days_before integer
)
language sql security invoker set search_path = ''
as $$
  select p.user_id, period.value->>'id', subscriber.value->>'name', network.value->>'name',
    dates.expiration_date, dates.expiration_date - (now() at time zone 'UTC')::date
  from public.rawit_email_preferences p
  join public.rawit_snapshots s on s.user_id = p.user_id
  cross join lateral jsonb_array_elements(s.payload->'records'->'subscriptionPeriods') period(value)
  cross join lateral (
    select case period.value->>'durationUnit'
      when 'month' then ((period.value->>'startDate')::date +
        ((period.value->>'durationValue')::integer || ' months')::interval)::date
      when 'week' then (period.value->>'startDate')::date + (period.value->>'durationValue')::integer * 7
      else (period.value->>'startDate')::date + (period.value->>'durationValue')::integer
    end as expiration_date
  ) dates
  join lateral jsonb_array_elements(s.payload->'records'->'subscribers') subscriber(value)
    on subscriber.value->>'id' = period.value->>'subscriberId'
  join lateral jsonb_array_elements(s.payload->'records'->'wifiNetworks') network(value)
    on network.value->>'id' = period.value->>'wifiNetworkId'
  where p.email_enabled and p.reminders_enabled
    and period.value->>'cancelledAt' is null
    and dates.expiration_date - (now() at time zone 'UTC')::date = any(p.intervals_days)
  order by p.user_id, period.value->>'id';
$$;
revoke all on function public.rawit_due_email_reminders() from public, anon, authenticated;
grant execute on function public.rawit_due_email_reminders() to service_role;

create or replace function public.rawit_claim_email_reminder(
  p_user_id uuid, p_period_id text, p_expiration_date date, p_days_before integer
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.rawit_email_deliveries (user_id, period_id, expiration_date, days_before)
  values (p_user_id, p_period_id, p_expiration_date, p_days_before)
  on conflict (user_id, period_id, expiration_date, days_before) do update
    set claimed_at = now()
    where public.rawit_email_deliveries.sent_at is null
      and public.rawit_email_deliveries.claimed_at < now() - interval '1 hour';
  return found;
end;
$$;
revoke all on function public.rawit_claim_email_reminder(uuid, text, date, integer) from public, anon, authenticated;
grant execute on function public.rawit_claim_email_reminder(uuid, text, date, integer) to service_role;
