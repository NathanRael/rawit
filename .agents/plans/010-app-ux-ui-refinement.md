# App UX and UI refinement

**Status:** Complete (installed-build device validation pending)<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17 (code and export checks; device check not run)

## Goal

Make detail, subpage, and form flows cleaner and more consistent: overflow menus for secondary actions, back headers on subpages, native date pickers, structured detail layouts, payment entry in a bottom sheet, and compact confirmation dialogs. No change to data handling, validation, or business rules. No new dependencies (uses installed `@expo/ui/community/menu` and `@expo/ui/community/datetime-picker`).

## Completed

- [x] Reviewed screens, shared components, conventions skill, and installed `@expo/ui` community APIs.
- [x] Shared: `AppScreenFrame` back header (`onBack`, `headerAction`); `back` and `overflow` icons; `OverflowMenu` (wraps `MenuView`); `DateField` (wraps `DateTimePicker`, web text fallback); `DetailRow`/`DetailDivider`; `PaymentSheet`; `SubscriptionStatusBadges`.
- [x] Detail screens (subscription period, WiFi network, subscriber): Edit/Cancel/Delete moved to overflow menu; grouped detail cards; status badges.
- [x] Subpages (new/edit for subscriptions, subscribers, WiFi networks): back header.
- [x] Forms: native date picker for period start date and payment date.
- [x] Payments: record/edit in bottom sheet; per-payment overflow for edit/remove.
- [x] Checks: `pnpm typecheck`, `pnpm lint`, `pnpm exec expo export --platform all` all passed.

## Remaining

- [ ] Installed dev/preview build check: overflow menu open/select, Android date dialog, iOS inline picker, payment sheet keyboard handling.
- [ ] Optional: apply `SubscriptionStatusBadges` to list cards (not changed in this pass).

## Blockers / stopping point

- Device validation not possible in this session; native menu, picker, and sheet behavior unverified on device.

## Next step

- Build installed dev/preview build and verify flows listed above.

## Relevant files and decisions

- `src/components/AppScreenFrame.tsx` — add optional `onBack`; subpages replace brand header with back header.
- `src/components/Icon.tsx` — add `back` and `overflow` symbols.
- `src/components/OverflowMenu.tsx` (new) — wraps `MenuView` from `@expo/ui/community/menu`.
- `src/components/DateField.tsx` (new) — wraps `DateTimePicker` from `@expo/ui/community/datetime-picker`; web fallback to text input because the picker renders null on web.
- `src/components/DetailRow.tsx` (new) — label/value row for detail cards.
- `src/components/PaymentSheet.tsx` (new) — bottom sheet hosting `PaymentForm`.
- `src/app/subscriptions/[id]/index.tsx`, `src/app/wifi/[id]/index.tsx`, `src/app/subscribers/[id]/index.tsx` — detail screens.
- `src/components/SubscriptionPeriodForm.tsx`, `src/components/PaymentForm.tsx` — date fields.
- Decision: long period form stays a full page with back header; short payment form uses a bottom sheet; edit subpages stay routes (per request 2).

## Checks

- None run yet.
