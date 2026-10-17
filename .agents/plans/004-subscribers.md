# Subscriber management

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Deliver persistent subscriber creation, listing, search, detail, editing, subscription summaries, history, and safe deletion.

## Completed

- [x] Reviewed subscriber requirements, the existing SQLite schema and repository, network screens, shared UI conventions, and available scripts.
- [x] Added transaction-guarded deletion and subscriber-scoped subscription history reads with network names and derived lifecycle/payment status.
- [x] Added subscriber list, search, bottom-sheet creation, detail, edit, and confirmed deletion flows with loading, empty, and error states.
- [x] Showed current subscription/network summaries and full history; block deletion while linked subscription or payment history exists.
- [x] Moved bottom navigation to root layout so one bar stays mounted across route changes.
- [x] Updated the feature checklist and completion log after validation.

## Remaining

- None.

## Blockers / stopping point

- No implementation blockers. Installed-build interaction and persistence were not manually tested.

## Next step

- None.

## Relevant files and decisions

- `src/lib/database/subscribers.ts` — typed subscriber CRUD, search, history count, and safe deletion.
- `src/lib/database/subscriptions.ts` — subscriber-specific history query with network names and derived lifecycle/payment statuses.
- `src/types/domain.ts` — shared subscriber and subscription record types.
- `src/app/wifi/` and `src/components/WifiNetworkForm.tsx` — patterns for CRUD routes, forms, errors, and confirmation.
- `src/components/AppScreenFrame.tsx` — shared route layout; navigation lives outside route screens.
- `src/components/AppNavigationBar.tsx` — single persistent bottom navigation.
- `src/components/SubscriberSheet.tsx` and `src/components/SubscriberForm.tsx` — subscriber bottom-sheet creation and validated form.
- `docs/implementation-plan.md` — update only subscriber checklist and completion log for this task.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform all` — passed for iOS, Android, and web; subscriber routes included.
- SQLite query smoke test — passed; verified subscriber history join, aggregate payment amount, and network name.
- `git diff --check` — passed; existing working-tree line-ending notices remain.
- Installed-build subscriber interactions and persistence — not manually tested.
