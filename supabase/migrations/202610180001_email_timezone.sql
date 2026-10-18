-- Interpret selected reminder days in the account's saved IANA time zone.
alter table public.rawit_email_preferences
  add column time_zone text not null default 'UTC';

create or replace function public.rawit_due_email_reminders()
returns table (
  user_id uuid, period_id text, subscriber_name text, network_name text,
  expiration_date date, days_before integer
)
language sql security invoker set search_path = ''
as $$
  select p.user_id, period.value->>'id', subscriber.value->>'name', network.value->>'name',
    dates.expiration_date, dates.expiration_date - (now() at time zone zone.name)::date
  from public.rawit_email_preferences p
  join pg_catalog.pg_timezone_names zone on zone.name = p.time_zone
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
    and dates.expiration_date - (now() at time zone zone.name)::date = any(p.intervals_days)
  order by p.user_id, period.value->>'id';
$$;
