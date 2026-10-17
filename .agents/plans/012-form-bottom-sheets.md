# Bottom sheets for all create and edit forms

**Status:** Complete for code scope (installed-build interaction pending)<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17 (code and export checks; device check not run)

## Goal

Present every create and edit form in the existing shared draggable bottom-sheet style, including network, subscriber, subscription-period, renewal, and payment workflows. Preserve current validation, persistence, and navigation outcomes.

## Completed

- [x] Inspected existing `FormSheet`, create sheets, standalone routes, and form components.
- [x] Reused the shared sheet wrapper for create/edit network and subscriber flows, plus new/edit/renew subscription periods.
- [x] Connected overview, list, and detail actions to sheets; payment create/edit was already sheet-based.
- [x] Converted legacy create/edit routes to sheet presentations and retained validation, save destinations, and refresh behavior.
- [x] Verified lint, TypeScript, diff whitespace, and Android/iOS/web exports.

## Remaining

- Installed-build sheet gestures, keyboard interaction, and visual behavior were not manually tested.

## Blockers / stopping point

- No blocker for code completion; an installed device/build was not used for native interaction validation.

## Next step

- When a target device/build is available, manually verify sheet dragging, dismissal, keyboard/scroll behavior, and create/edit/renew flows.

## Relevant files and decisions

- `src/components/FormSheet.tsx` — shared `@expo/ui` draggable sheet chrome to reuse.
- `src/components/WifiNetworkSheet.tsx`, `src/components/SubscriberSheet.tsx`, `src/components/PaymentSheet.tsx` — existing sheet wrappers.
- `src/components/SubscriptionPeriodSheet.tsx` — shared sheet wrapper for create, edit, and renewal.
- `src/app/` — current add/edit entry points to move into sheets.
- Decision: no new dependency; keep the common snap/drag/scroll interaction through `FormSheet`.

## Checks

- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `git diff --check` — passed (only Git line-ending notices).
- `pnpm exec expo export --platform all` — passed (Android, iOS, and web; 16 static routes).
