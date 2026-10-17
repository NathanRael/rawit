-- RAWIT keeps an offline SQLite copy per signed-in user. This table stores the
-- portable snapshot used to move that user's records between devices.
create table if not exists public.rawit_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  revision bigint not null check (revision > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.rawit_snapshots enable row level security;

revoke all on public.rawit_snapshots from anon;
grant select, insert, update on public.rawit_snapshots to authenticated;

create policy "Users read their own RAWIT snapshot"
  on public.rawit_snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create their own RAWIT snapshot"
  on public.rawit_snapshots for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own RAWIT snapshot"
  on public.rawit_snapshots for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- A single RPC gives each save an atomic revision check. A stale device cannot
-- replace newer cloud records without the user explicitly resolving a conflict.
create or replace function public.save_rawit_snapshot(
  expected_user_id uuid,
  expected_revision bigint,
  next_payload jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_revision bigint;
begin
  if (select auth.uid()) is null or (select auth.uid()) <> expected_user_id then
    raise exception 'Authentication required';
  end if;

  if jsonb_typeof(next_payload) <> 'object' then
    raise exception 'Invalid RAWIT snapshot';
  end if;

  if expected_revision = 0 then
    insert into public.rawit_snapshots (user_id, revision, payload)
    values ((select auth.uid()), 1, next_payload)
    on conflict (user_id) do nothing
    returning revision into next_revision;
  else
    update public.rawit_snapshots
    set revision = revision + 1,
        payload = next_payload,
        updated_at = now()
    where user_id = (select auth.uid()) and revision = expected_revision
    returning revision into next_revision;
  end if;

  if next_revision is null then
    raise exception 'RAWIT_SYNC_CONFLICT';
  end if;
  return next_revision;
end;
$$;

revoke all on function public.save_rawit_snapshot(uuid, bigint, jsonb) from public, anon;
grant execute on function public.save_rawit_snapshot(uuid, bigint, jsonb) to authenticated;
