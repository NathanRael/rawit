# Local expiration reminders

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Implement configurable local expiration reminders for subscription periods: schedule notifications at configurable intervals before expiration, reconcile schedules when periods or preferences change, handle denied permissions without breaking core app use, and keep in-app lifecycle status independent of notification delivery.

## Completed

- [x] Added `ReminderPreferences` domain type and AsyncStorage-backed persistence with validation/normalization.
- [x] Built `expo-notifications` service for permission checks, permission requests, single-reminder scheduling, and cancellation.
- [x] Built reminder reconciliation:
  - Per-subscription reconciliation cancels obsolete reminders and schedules only valid future reminders.
  - Global reconciliation refreshes all active/expiring-soon periods and removes reminders for expired/cancelled/missing periods.
  - Lifecycle-change refresh removes reminders for periods that became expired or cancelled.
- [x] Integrated reconciliation into subscription period create, update, cancel, and delete without blocking core operations.
- [x] Added app-startup and foreground reconciliation via `RootLayout`.
- [x] Added `/settings` screen with toggles for reminder enable/disable and preset intervals (3, 2, 1, 0 days before), plus reset-to-defaults.
- [x] Added settings link from the Home screen header.
- [x] Ran `pnpm lint`, `pnpm typecheck`, and `pnpm exec expo export --platform all`; all pass.

## Remaining

- None.

## Blockers / stopping point

- None.

## Next step

- None. Feature is complete. Reminder scheduling behavior still needs validation on an installed build (see unverified behavior below).

## Relevant files and decisions

- `src/types/domain.ts` — added `ReminderPreferences`.
- `src/lib/notifications/preferences.ts` — AsyncStorage preferences, defaults, validation, normalization.
- `src/lib/notifications/service.ts` — `expo-notifications` permission and scheduling/cancellation wrapper; guards unsupported platforms; reminders fire at 09:00 local time on the trigger date.
- `src/lib/notifications/reminders.ts` — reconciliation logic, stored reminder rows, global and per-subscription refresh.
- `src/lib/notifications/index.ts` — public exports.
- `src/lib/database/subscriptions.ts` — hooks reconcile/cancel reminders after create, update, cancel, and delete.
- `src/lib/navigation.ts` — added `settingsHref`.
- `src/app/_layout.tsx` — reconciles all reminders after database init and refreshes on foreground.
- `src/app/settings/index.tsx` — settings UI for reminder preferences.
- `src/app/index.tsx` — added settings icon button.
- `src/lib/database/migrations.ts` — `subscription_reminders` table already existed from project setup.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform all` — passed; bundles generated for iOS, Android, and web.
- Installed-build notification scheduling and denied-permission behavior were not verified on a device.
