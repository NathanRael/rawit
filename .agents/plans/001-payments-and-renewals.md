# Payments and renewals

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Deliver SQLite-backed payment history management and renewal creation. Keep lifecycle independent of payment state and preserve every prior period and its payments.

## Completed

- [x] Inspected current payment repositories, period queries, routes, validation, and delivery requirements.
- [x] Added validated payment entry creation, editing, and confirmed removal; mutations use SQLite transactions and edits remain linked to the original period.
- [x] Added payment history, paid totals, remaining balances, and consistent balance summaries in period details, period/subscriber lists, and home.
- [x] Added renewal prefills for subscriber, network, amount, duration, and notes; the next start date follows the prior expiration (or today when that date has passed), and saving creates a new period.
- [x] Added remaining-balance tests and updated the delivery checklist/completion log.
- [x] Moved the static reusable-component demo from Home into a standalone `ComponentShowcase` component; no route renders it.

## Remaining

- None.

## Blockers / stopping point

- Native SQLite interaction and persistence were not manually smoke-tested in an installed build.

## Next step

- None.

## Relevant files and decisions

- `src/lib/database/payments.ts` — payment persistence exists; all mutations will use transactions and edits stay attached to their original period.
- `src/lib/database/subscriptions.ts` — payment total/status are already derived from SQLite joins.
- `src/components/PaymentForm.tsx` and `src/lib/validation/payment.ts` — validated payment entry UI.
- `src/components/SubscriptionPeriodForm.tsx` — renewal reuses the create form with values copied from the old period and an editable next start date.
- `src/app/subscriptions/[id]/index.tsx` — payment history/actions and renewal entry point; `src/app/index.tsx` — outstanding-balance summary; `src/components/ComponentShowcase.tsx` — unrendered reusable component demo.
- `docs/implementation-plan.md` — section 5 checklist and completion record.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `node --test src/lib/dates/index.test.mjs` — 5 tests passed.
- `pnpm exec expo export --platform all` — passed for iOS, Android, and web.
- Installed-build payment/renewal interaction and SQLite persistence — not manually verified.
