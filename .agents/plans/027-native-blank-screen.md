# Fix native blank screen

**Status:** In progress<br>
**Started:** 2026-10-18<br>
**Last updated:** 2026-10-18<br>
**Completed:** N/A

## Goal

Find and fix the native Expo startup failure that leaves a blank white screen while web continues to work.

## Completed

- [x] Began tracing root routing, authentication, persistence, and native-only startup code.
- [x] Confirmed local Expo uses a loopback Supabase URL that is unreachable from a physical phone.
- [x] Made native development translate a loopback Supabase URL to Metro's reachable host while preserving web and production behavior.

## Remaining

- [ ] Confirm the corrected endpoint behavior on the user's physical Expo Go device.

## Blockers / stopping point

- Device validation still requires reopening the project in Expo Go on the user's phone.

## Next step

- Reopen Expo Go from a Metro server started with a cleared cache and confirm the login or app screen renders.

## Relevant files and decisions

- `src/app/_layout.tsx` — root authentication and account initialization gate.
- `src/lib/cloud/client.ts` — Supabase native client and session storage.
- `.env.local` may safely keep `127.0.0.1`; only native development rewrites the hostname from Expo's development manifest.
- `src/lib/database/index.ts` — platform-specific SQLite initialization.

## Checks

- `pnpm check` — passed.
- `pnpm export:prod` — passed for web, Android, and iOS. An earlier export to a custom output directory generated all bundles but returned an abnormal Windows process code after completion; the standard retry exited successfully.
- `pnpm exec expo install --check` — passed with current online Expo SDK compatibility data.
- `pnpm verify` — passed, including all seven tests and fresh production bundles for web, Android, and iOS.
