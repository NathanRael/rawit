# Advanced period filters and subscriber history

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Add an advanced-filter control to the subscription periods screen for subscriber and expiration-date range filtering, and show only the three newest subscription periods on subscriber details until the user expands the history.

## Completed

- [x] Inspected the period list, subscriber details, date controls, and existing data access patterns.
- [x] Chose local filtering over database changes because the list query already returns subscriber IDs/names and expiration dates for all periods.
- [x] Implemented an accessible advanced-filter sheet with subscriber selection, an optional expiration end date, validation, and combined status/payment filtering.
- [x] Collapsed subscriber history to the three newest records with Show all/Show less controls; retained a concise current-network summary.

## Remaining

- None.

## Blockers / stopping point

- None.

## Next step

- None.

## Relevant files and decisions

- `src/app/subscriptions/index.tsx` — existing status/payment chips and joined period list; advanced filtering is applied to the same loaded results.
- `src/components/SubscriptionPeriodFilterSheet.tsx` — sheet with subscriber select and optional expiration-date range; range filters by derived expiration date.
- `src/app/subscribers/[id]/index.tsx` — subscriber-linked period history, ordered newest first by the repository; shows three initially and preserves a compact current-network summary.
- `src/lib/database/subscriptions.ts` — existing queries provide the data needed; no persistence or query changes are expected.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform all` — passed for iOS, Android, and web.
- Installed-build interaction was not manually smoke-tested.
