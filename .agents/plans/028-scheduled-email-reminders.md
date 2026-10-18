# Scheduled expiration email reminders

**Status:** Complete<br>
**Started:** 2026-10-18<br>
**Last updated:** 2026-10-18<br>
**Completed:** 2026-10-18

## Goal

Send opt-in expiration emails to the signed-in account email on the same enabled days as local reminders, with one daily Supabase Cron invocation and duplicate prevention.

## Completed

- [x] Inspected local preferences, cloud snapshots, email function, and Supabase scheduling docs.
- [x] Added opt-in per-user cloud preferences, time-zone-aware due query, and delivery ledger.
- [x] Added the daily dispatcher, Cron setup SQL, local invoke command, Settings switch, and setup docs.
- [x] Applied migrations and deployed both functions to the linked hosted project. Created Vault secrets and activated the 06:00 UTC Cron job.
- [x] Validated local and hosted dispatcher paths with zero opted-in accounts.

## Remaining

- None.

## Blockers / stopping point

- No account has opted in yet, so a real due email and delivery deduplication could not be observed. Installed-device notification behavior was not checked.

## Next step

- None.

## Relevant files and decisions

- `src/lib/notifications/preferences.ts` — existing device reminder preferences.
- `supabase/functions/send-reminder-email/index.ts` — existing authenticated test sender.
- `supabase/migrations/20261017_user_snapshots.sql` — cloud records.
- `supabase/cron/setup.sql` — active once-daily hosted job; private values live in Vault.
- `supabase/migrations/20261018_email_reminders.sql` and `202610180001_email_timezone.sql` — applied locally and hosted.

## Checks

- `pnpm lint`, `pnpm typecheck`, and `pnpm export:prod` passed; the first sandboxed export failed because Hermes could not write to the sandbox temp directory, and the retry with normal temp access passed.
- Local migration apply and due query passed; local and hosted dispatcher calls returned `sent: 0, failed: 0, skipped: 0`.
- Hosted Cron query showed `active=true`, schedule `0 6 * * *`; no hosted accounts are opted into email yet.
