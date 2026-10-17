# RAWIT — Feature Delivery Checklist

This checklist defines the work and acceptance criteria for each feature. Product behavior is defined in [project-description.md](project-description.md); engineering constraints are in [AGENTS.md](../AGENTS.md). Follow the repository's existing structure and installed Expo APIs. Keep SQLite as the source of truth for business records, keep UI state small, and do not add out-of-scope services or features.

## How to use this plan

- Work through features in dependency order. A feature is complete only when its checklist and acceptance criteria are met.
- Check off verified work only. When a feature is complete, record its date and a short note in the completion log.
- Keep each change focused on the feature being delivered. Update this plan if implementation evidence requires a requirement or sequence to change.
- Check available scripts before validation. Run relevant checks for code changes and report only checks actually run. Validate native notification behavior in an installed build.

## 0. Project setup — complete

- [x] Expo Router app runs from `src/app/` with the agreed Expo, React Native, and TypeScript stack.
- [x] NativeWind v5 RC and Tailwind CSS v4 are configured and styling is verified.
- [x] SQLite, local notifications, AsyncStorage, forms/validation, and file sharing dependencies are installed.
- [x] Lint, TypeScript, and platform exports were checked as recorded below.

**Acceptance:** The app starts and the configured styling/build setup works.

## 1. Domain, dates, and local storage

- [x] Define typed records for WiFi networks, subscribers, subscription periods, and payments; use day/week/month durations and keep lifecycle and payment status separate.
- [x] Derive expiration from start date plus duration using local calendar dates; clamp month-end dates consistently (Jan 31 + 1 month = Feb 28/29).
- [x] Handle leap years and future start dates. A period expiring today is expired; “expiring soon” means expiration is within the next three local calendar days.
- [ ] Build SQLite initialization and versioned migrations for networks, subscribers, subscriptions, payments, and reminder identifiers/preferences as needed. (Implemented; installed-build initialization and restart persistence remain unverified because Android tooling/device access is unavailable here.)
- [x] Add typed data access with parameterized SQL, relationship-preserving constraints, deliberate query/init errors, and transactions for related writes.
- [x] Recalculate date-based lifecycle when the app opens and returns to foreground.

**Acceptance:** Data survives app restarts; migrations initialize safely; dates and lifecycle follow the defined local-calendar rules.

**Current validation:** Date/lifecycle tests, lint, TypeScript, and `pnpm exec expo export --platform all` pass. Native SQLite migration/startup and restart persistence still need an installed-build smoke test.

## 2. WiFi networks — complete

- [x] Create, list, view, and edit named networks, with optional SSID and notes.
- [x] Validate required fields and show useful empty and error states.
- [x] Require confirmation before deletion; block deleting a network while it has linked subscription history.

**Acceptance:** Network changes persist and appear immediately; deleting a network cannot silently orphan or erase subscription history.

**Validation:** SQLite-backed create/read/update/delete flows are implemented. The add action opens an Expo UI bottom sheet with 50%/90% snap points and pan-down dismissal; the empty list uses a reusable centered action card. Lint, TypeScript, and all-platform export pass. Native gesture and persistence behavior were not manually smoke-tested in an installed build.

## 3. Subscribers

- [x] Create, list, search, view, and edit subscribers; capture name and optional contact details/notes.
- [x] Show a subscriber's current network/subscription summary and relevant history.
- [x] Require confirmation before deletion; block deleting a subscriber while they have linked subscription or payment history.

**Acceptance:** Subscriber records persist, search works, and linked history cannot be silently removed.

**Validation:** SQLite-backed subscriber CRUD, search, subscription history, and transaction-guarded deletion are implemented. Create uses a draggable Expo UI bottom sheet; the shared bottom navigation stays mounted across routes. Lint, TypeScript, SQLite query smoke test, and all-platform export pass. Installed-build interaction and persistence were not manually tested.

## 4. Subscription periods

- [x] Create a period linking exactly one subscriber and one network, with start date, duration, amount, and optional notes.
- [x] Derive its expiration date using the shared date rule; validate required links, positive duration, and non-negative amount.
- [x] List and view periods with subscriber, network, dates, amount, lifecycle, and payment status shown separately.
- [x] Support editing and cancellation. Confirm deletion and block it when payment history exists.
- [x] Provide useful filters for all, active, expiring soon, expired, and unpaid periods; include empty and error states.

**Acceptance:** Period data persists and filters/statuses remain correct after restart and foreground refresh.

**Validation:** Lint, typecheck, date/lifecycle tests, SQLite period join/payment-history guard smoke test, and `pnpm exec expo export --platform all` pass. Installed-build interaction and restart persistence were not manually tested.

## 5. Payments and renewals

- [ ] Record, view, edit, and remove payment entries with amount, date, and optional notes.
- [ ] Derive payment status from amount due and payment total: unpaid, partially paid, or paid. Do not change lifecycle when payment changes.
- [ ] Show payment history and remaining amount; make payment totals consistent across details, lists, and overview.
- [ ] Renew by creating a new period prefilled from the prior one. Never overwrite the old period or its payments.
- [ ] Keep related payment and period writes transactional.

**Acceptance:** Payments and balances persist accurately; renewal creates a separate period and keeps the full prior history.

## 6. Overview

- [ ] Make the primary screen answer: who owes money, how much, and which periods need attention.
- [ ] Show counts or summaries for active, expiring soon, and expired periods, plus total unpaid amount.
- [ ] Show actionable attention items with subscriber, network, expiration, amount/payment state, and navigation to the period.
- [ ] Refresh from SQLite on app open/foreground; do not treat cached UI state as business data.

**Acceptance:** Overview figures agree with stored records and date-derived statuses.

## 7. Local expiration reminders

- [ ] Add local reminder preferences, enabled by default, for 3 days before, 1 day before, and expiration day; allow reminders to be disabled and intervals to be changed.
- [ ] Request notification permission when needed and handle denial without blocking core use.
- [ ] Schedule only valid future reminders; include enough context to identify subscriber, network, and expiration.
- [ ] Reconcile reminders after create, edit, renewal, cancellation, deletion, and preference changes; cancel obsolete reminders and avoid duplicates.
- [ ] Store notification identifiers when needed for reliable cancellation. Keep in-app lifecycle status independent of notification delivery.

**Acceptance:** Reminder schedules match current periods/preferences; denied, dismissed, or missed notifications do not hide expiring/expired periods. Verify scheduling on an installed build.

## 8. Backup and restore

- [ ] Export all business records and required relationships to a portable, versioned file; report success only after the file is written and offered to the user.
- [ ] Let the user select a backup and validate its version, shape, and relationships before changing stored data.
- [ ] Explain that restore replaces current data and require confirmation.
- [ ] Restore all related records in one transaction; roll back and report failure if any step fails.
- [ ] Provide clear progress, success, invalid-file, and failure states.

**Acceptance:** A valid export can restore equivalent data; invalid or failed imports leave existing data intact.

## 9. Settings, accessibility, and release readiness

- [ ] Provide settings for reminder preferences and backup/restore; persist small preferences in AsyncStorage and business data in SQLite.
- [ ] Ensure controls have accessible names/states, readable status and amount labels, and practical 44 dp touch targets.
- [ ] Handle startup and query failures visibly; provide usable loading, empty, and error states.
- [ ] Apply a consistent theme and support light/dark appearance where the app's design supports it.
- [ ] Run the repository's lint and type checks; resolve issues introduced by the work.
- [ ] Install a development/preview build and check core flows on supported target devices when available.

**Acceptance:** Core workflows are understandable and accessible; checks pass; installed-build behavior is recorded, including anything not device-verified.

## 10. Local database backup for reinstall recovery

- [ ] Let the user export a portable backup of all SQLite business records, relationships, and required format/version metadata.
- [ ] Save or share the backup to a user-selected location outside RAWIT's private app storage, such as the device's documents or downloads, so it remains available if the app is uninstalled.
- [ ] Let the user select a previously saved backup file to import after reinstalling the app.
- [ ] Validate the backup and explain that importing replaces current local records; require confirmation before restore.
- [ ] Restore all records and relationships transactionally, and leave existing data intact if validation or restore fails.
- [ ] Show clear export, import, success, invalid-file, and failure states; never report success until the file operation completes.

**Acceptance:** A user can save a backup outside the app sandbox, uninstall and reinstall RAWIT, then import the backup and recover equivalent records and relationships. An invalid backup or failed restore does not damage current data.

## End-to-end acceptance checklist

- [ ] Create a network and subscriber, then create a linked subscription period.
- [ ] Verify a Jan 31 monthly start, leap-year handling, future starts, expiration today, and the expiring-soon boundary.
- [ ] Record partial and full payments; verify balances and that lifecycle remains independent.
- [ ] Renew and verify the old period and payment history remain intact.
- [ ] Confirm destructive actions protect linked history.
- [ ] Close and reopen the app; verify records and derived statuses.
- [ ] Verify reminder rescheduling and denied-permission behavior on an installed build.
- [ ] Export, replace local data with a restore, and verify relationships; reject an invalid backup without changing data.

## Completion log

| Date | Feature | Notes |
|---|---|---|
| 2026-10-13 | Project setup | Installed/configured NativeWind v5 RC, Tailwind v4, SQLite, notifications, AsyncStorage, forms/validation, file sharing, and related Expo plugins. Lint, TypeScript, and web export passed; `date-fns` was deferred. |
| 2026-10-17 | Project setup | Aligned Metro with the NativeWind `withNativewind` export, moved styling build tools to dev dependencies, and enabled Tailwind IntelliSense. Lint, typecheck, and web/iOS/Android exports passed. |
| 2026-10-17 | WiFi networks | Added network CRUD screens, a draggable Expo UI bottom-sheet add flow, reusable centered empty state, required-name validation, and deletion protection for linked history. Lint, typecheck, and all-platform export passed; native interaction and persistence smoke tests remain unverified. |
| 2026-10-17 | Subscribers | Added subscriber CRUD, search, current subscription summary, full network/payment-status history, and deletion protection for linked periods. Added subscriber bottom-sheet creation and one persistent bottom navigation across routes. Lint, typecheck, SQLite query smoke test, and all-platform export passed; installed-build behavior remains unverified. |
| 2026-10-17 | Subscription periods | Added period creation/editing, joined list/detail views, lifecycle/payment filters, cancellation, and payment-history-safe deletion. Lint, typecheck, date tests, SQLite query smoke test, and all-platform export passed; installed-build interaction and restart persistence remain unverified. |
