# Full-app UI/UX audit and redesign

**Status:** Complete for code scope (device/visual validation pending)<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17 (code and export checks; device check not run)

## Goal

Audit every screen, list, modal, sheet, and form for layout, hierarchy, alignment, overflow, and touch issues. Redesign raw-text lists into structured rows, move Settings into the home header, remove the duplicated page-name badge, add truncation for long text, and keep actions aligned. No change to data, validation, business rules, or routes. No new dependencies.

## Completed

- [x] Audited screens: home, wifi list/new/detail/edit, subscribers list/new/detail/edit, subscriptions list/new/detail/edit, settings.
- [x] Audited shared components: AppScreenFrame, AppPageHeader, OverflowMenu, Card, Button, IconButton, Badge, DetailRow, EmptyState, FilterChip, TextField, DateField, sheets, forms.
- [x] Icon: added `chevron` symbol.
- [x] `AppPageHeader`: removed duplicated page-name badge; optional trailing `action`; truncation.
- [x] `AppScreenFrame`: `pageName` prop removed; `headerAction` now also shown in brand header; back-header title truncates to 2 lines; page titles use `title` type scale.
- [x] `RecordRow` (new): shared structured pressable row with leading tile, title, detail lines, chevron.
- [x] `PeriodListItem` (new): shared period row (subscriber, network, dates, remaining, lifecycle/payment badges); used on Overview and Periods.
- [x] Wi-Fi list: structured rows with wifi tile, name, SSID, notes.
- [x] Subscriber list: structured rows with initials tile, name, contact.
- [x] Periods list: uses `PeriodListItem`; removed raw text lines.
- [x] Overview: Settings moved from separate row into header; attention list uses `PeriodListItem`.
- [x] Settings: back header added (now reached from header only).
- [x] Checks: `pnpm typecheck`, `pnpm lint`, `pnpm exec expo export --platform all` all passed.
- [x] Pass 2: `FormSheet` shared bottom-sheet chrome; WifiNetworkSheet, SubscriberSheet, PaymentSheet now thin wrappers (copy unchanged; snap points unchanged per sheet).
- [x] Pass 2: `FormActions` shared save/cancel block; replaces 4 duplicated variants (WifiNetworkForm, SubscriberForm, PaymentForm, SubscriptionPeriodForm).
- [x] Pass 2: checks re-run, all passed.

## Remaining

- [ ] Visual review on device/simulator: row alignment, long-name truncation, overflow menu placement, small screens, large text, dark mode (not done; no dark theme in code).
- [ ] Not changed: EmptyState styling, Settings section layout, subscriber/network/period detail cards, ComponentShowcase (dev only), unused `PlanCard` and `AlertBox`.
- [ ] Optional: payment row overflow menu alignment check on device.

## Blockers / stopping point

- Visual and native behavior unverified; no device or simulator run in this session.

## Next step

- Build installed dev/preview build and review: home header, each list, long names, payment overflow menu, settings back, sheets.

## Relevant files and decisions

- `src/components/RecordRow.tsx` (new) — shared row, leading tile, title and detail text.
- `src/components/PeriodListItem.tsx` (new) — shared period row for Overview and Periods.
- `src/components/AppPageHeader.tsx` — brand header; badge removed; `action` slot.
- `src/components/AppScreenFrame.tsx` — `pageName` removed; `headerAction` in both header variants.
- `src/components/Icon.tsx` — `chevron` added.
- `src/app/index.tsx`, `src/app/wifi/index.tsx`, `src/app/subscribers/index.tsx`, `src/app/subscriptions/index.tsx` — list and home redesign.
- `src/app/settings/index.tsx` — back header.
- Decision: Settings in home header only (plus back on the settings page).
- Decision: no new dependencies; shared rows instead of per-screen cards.

## Checks

- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm exec expo export --platform all` — passed (android, ios, web bundles and 16 static routes).
</content>