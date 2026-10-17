# Account login and registration

**Status:** In progress<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** Implementation complete; project setup and runtime validation pending.

## Goal

Add login, registration, per-user data access, cross-device sync, legacy record import, and logout with the current RAWIT visual language.

## Completed

- [x] Inspected the existing Expo Router shell, SQLite schema and repositories, settings screen, and dependencies.
- [x] Identified pre-existing workspace changes in `app.json`, `package.json`, `pnpm-lock.yaml`, `src/app/_layout.tsx`, and plan 018; preserve them.
- [x] Confirmed accounts must sync across devices, Supabase is the selected hosted service, and earlier local records should be imported into the first account.
- [x] Chose Supabase Auth plus a revision-checked, per-user cloud snapshot while retaining an account-specific SQLite copy for offline access.
- [x] Added the Supabase client dependencies, cloud schema migration, and initial database/sync infrastructure.
- [x] Added login and registration screens, protected account routes, a conflict screen, sync status, and logout in Settings.
- [x] Split SQLite data by Supabase user ID and import earlier records into the first account used on a device.
- [x] Added revision-checked cloud writes, row-level security, and setup documentation.
- [x] Updated the product description and repository guidance for the requested account model.

## Remaining

- [ ] Apply the SQL migration to the selected Supabase project and turn off Confirm Email.
- [ ] Validate registration, login, legacy import, logout, and sync between two installed/browser clients against that project.
- [x] Run lint, typecheck, and all-platform export.

## Blockers / stopping point

- A project URL and publishable key are configured locally, but the cloud snapshot table is absent. The project owner must apply the SQL migration and disable Confirm Email. No service credentials are available in this workspace, so end-to-end account and sync behavior cannot yet be validated.

## Next step

- Apply the migration and Auth setting in Supabase, then validate the full flow on web and an installed build.

## Relevant files and decisions

- `src/app/_layout.tsx`, `src/app/auth.tsx`, `src/app/sync-conflict.tsx`, `src/app/(app)/settings/index.tsx` — auth gates, account UI, conflict resolution, logout.
- `src/lib/database/index.ts` — separate SQLite database per account; legacy `rawit.db` retained for import.
- `src/lib/cloud/sync.ts` — revisioned snapshot sync and import logic.
- `src/lib/cloud/` and `supabase/migrations/20261017_user_snapshots.sql` — Supabase auth and revision-checked per-user snapshots; password handling stays with Supabase Auth.
- `docs/supabase-setup.md` — deployment steps.

## Checks

- `pnpm lint` — passed 2026-10-17.
- `pnpm typecheck` — passed 2026-10-17.
- `pnpm exec expo export --platform web` — passed 2026-10-17.
- `pnpm exec expo export --platform all` — passed 2026-10-17 outside the sandbox. The sandboxed attempt failed because Hermes could not write its temporary bytecode file.
