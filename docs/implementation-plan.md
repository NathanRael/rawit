# RAWIT — Implementation Plan

This document breaks the project into small, sequential, verifiable features. Each feature has a checklist of concrete tasks. Mark items `[x]` as they are completed, and update this file immediately when a feature is finished.

> **Rule:** Whenever you complete a feature listed here, update this plan to mark it `done` before moving to the next one.

---

## Phase 0 — Project Bootstrap & Tooling

Make the repository ready for feature development and verify the agreed stack works.

- [x] **0.1 Inspect current state**
  - [ ] Confirm `package.json`, `app.json`, `tsconfig.json`, and `src/app/` layout.
  - [ ] Confirm the app runs with `pnpm start` / `npx expo start` with no build errors.
- [x] **0.2 Install and configure NativeWind v5**
  - [ ] Add `nativewind@^5`, `tailwindcss`, and the required peer dependencies.
  - [ ] Create `tailwind.config.js` with the content paths for `src/**/*.{ts,tsx}`.
  - [ ] Create/update `babel.config.js` to use the NativeWind Babel plugin.
  - [ ] Create/update `metro.config.js` for NativeWind CSS processing.
  - [ ] Create `src/global.css` with the `@tailwind` directives.
  - [ ] Import `global.css` in `src/app/_layout.tsx`.
  - [ ] Replace the `StyleSheet` usage in `src/app/index.tsx` with a NativeWind className smoke test.
  - [ ] Run the app and confirm NativeWind classes are applied.
- [ ] **0.3 Install core state, persistence, and form libraries**
  - [ ] Add `zustand`.
  - [ ] Add `expo-sqlite`.
  - [ ] Add `expo-notifications`.
  - [ ] Add `@react-native-async-storage/async-storage`.
  - [ ] Add `react-hook-form` and `zod` (with `@hookform/resolvers`).
  - [ ] *(Optional, ask for approval)* Add `date-fns` for robust calendar-month expiration math.
  - [ ] *(Optional, ask for approval)* Add `expo-file-system` and `expo-sharing` for backup export.
- [ ] **0.4 Configure plugins**
  - [ ] Add `expo-notifications` plugin configuration to `app.json`.
  - [ ] Add `expo-sqlite` plugin if required by the installed version.
- [x] **0.5 Project hygiene**
  - [ ] Confirm `pnpm run lint` / `npm run lint` passes after setup.
  - [ ] Confirm TypeScript compiles (`tsc --noEmit` or the project’s typecheck script).

**Acceptance:** `expo start` launches, NativeWind styling works, no lint/type errors from new dependencies.

> **Status:** NativeWind v5 RC0 is installed and configured. The remaining dependency installs in 0.3/0.4 will be done as each feature is implemented.

---

## Phase 1 — Foundation (Types, Dates, DB, Store, Base UI)

Build the shared layer every later feature depends on.

- [ ] **1.1 Shared types**
  - [ ] Create `types/index.ts`.
  - [ ] Define `WifiNetwork` (`id`, `name`, `ssid?`, `notes?`, `createdAt`).
  - [ ] Define `Subscriber` (`id`, `name`, `phone?`, `email?`, `notes?`, `createdAt`).
  - [ ] Define `Subscription` (`id`, `subscriberId`, `wifiNetworkId`, `startDate`, `durationValue`, `durationUnit`, `endDate`, `amount`, `paymentStatus`, `status`, `notes?`, `createdAt`).
  - [ ] Define `Payment` (`id`, `subscriptionId`, `amount`, `paidAt`, `notes?`).
  - [ ] Define explicit enums/union types:
    - `SubscriptionLifecycleStatus`: `active`, `expiring_soon`, `expired`, `cancelled`.
    - `PaymentStatus`: `paid`, `unpaid`, `partially_paid`.
    - `DurationUnit`: `day`, `week`, `month`.
- [ ] **1.2 Date utilities**
  - [ ] Create `lib/dates/index.ts`.
  - [ ] Implement `startOfDayLocal(date)`.
  - [ ] Implement `addDuration(startDate, value, unit)` handling month boundaries.
  - [ ] Implement `calculateExpirationDate(startDate, durationValue, durationUnit)`.
  - [ ] Implement `getSubscriptionLifecycleStatus(endDate, expiringSoonDays)`.
  - [ ] Implement `formatDateLocal(date)` and `formatCurrency(amount)` helpers.
  - [ ] Add unit-style tests for edge cases (end-of-month, leap years, today at midnight).
- [ ] **1.3 SQLite database layer**
  - [ ] Create `lib/database/index.ts` for connection/opening.
  - [ ] Create `lib/database/migrations.ts` with schema version 1:
    - `wifi_networks`
    - `subscribers`
    - `subscriptions`
    - `payments`
    - `subscription_notifications` (subscription_id, trigger_date, notification_id)
  - [ ] Implement `migrateDatabase()` with `user_version` tracking.
  - [ ] Create `lib/database/wifiNetworks.ts` with CRUD + list.
  - [ ] Create `lib/database/subscribers.ts` with CRUD + list + search.
  - [ ] Create `lib/database/subscriptions.ts` with CRUD, list, listByStatus, listExpiringSoon, listExpired, listUnpaid.
  - [ ] Create `lib/database/payments.ts` with CRUD for payments and totals per subscription.
  - [ ] Create `lib/database/notifications.ts` to store/clear scheduled notification IDs.
  - [ ] Use parameterized queries everywhere; wrap multi-step writes in transactions.
- [ ] **1.4 Database initialization hook**
  - [ ] Create `hooks/useDatabase.ts` that opens SQLite and runs migrations once.
  - [ ] Show a loading/startup screen while the DB is initializing.
  - [ ] Surface migration errors clearly.
- [ ] **1.5 Zustand store**
  - [ ] Create `store/index.ts`.
  - [ ] Store: selected WiFi network ID, dashboard filter, notification preferences, app foreground state.
  - [ ] Keep store small; do not mirror the whole database.
- [ ] **1.6 Base reusable components**
  - [ ] Create `components/ThemedView.tsx`.
  - [ ] Create `components/ThemedText.tsx`.
  - [ ] Create `components/Card.tsx`.
  - [ ] Create `components/Button.tsx`.
  - [ ] Create `components/Badge.tsx`.
  - [ ] Create `components/EmptyState.tsx`.
  - [ ] Create `components/ConfirmDialog.tsx`.

**Acceptance:** App launches, migrations run, sample CRUD operations can be tested manually, no type errors.

---

## Phase 2 — WiFi Network Management

Manage the networks subscribers connect to.

- [ ] **2.1 WiFi network data layer**
  - [ ] Add validation schema (`zod`) for create/edit forms.
  - [ ] Add `createWifiNetwork`, `updateWifiNetwork`, `deleteWifiNetwork`, `getWifiNetworkById`, `listWifiNetworks`.
- [ ] **2.2 WiFi list screen**
  - [ ] Create `app/wifi/index.tsx`.
  - [ ] Display networks with `WifiNetworkCard`.
  - [ ] Add FAB / header button to add a network.
  - [ ] Handle empty state.
- [ ] **2.3 WiFi add/edit screens**
  - [ ] Create `app/wifi/add.tsx` form with React Hook Form + Zod.
  - [ ] Create `app/wifi/[id].tsx` for viewing/editing/deleting.
- [ ] **2.4 Delete safety**
  - [ ] Confirm destructive delete with `ConfirmDialog`.
  - [ ] Block deletion or warn if the network has linked subscriptions.
  - [ ] Cascade or reassign subscriptions depending on chosen behavior.

**Acceptance:** Can add, edit, delete WiFi networks; deletion warns when subscriptions exist; list updates immediately.

---

## Phase 3 — Subscriber Management

Manage the people who pay for access.

- [ ] **3.1 Subscriber data layer**
  - [ ] Add Zod schema for subscriber forms.
  - [ ] Add CRUD in `lib/database/subscribers.ts`.
- [ ] **3.2 Subscriber list screen**
  - [ ] Create `app/subscribers/index.tsx`.
  - [ ] Display `SubscriberCard` with name, contact, and assigned network count.
  - [ ] Add search input.
  - [ ] Add empty state.
- [ ] **3.3 Subscriber add/edit/detail screens**
  - [ ] Create `app/subscribers/add.tsx` form.
  - [ ] Create `app/subscribers/[id].tsx` detail/edit/delete screen.
  - [ ] Show current/active subscription summary on the detail screen.
- [ ] **3.4 Delete safety**
  - [ ] Confirm delete with `ConfirmDialog`.
  - [ ] Block or warn if subscriber has payment/subscription history.

**Acceptance:** Can create, search, edit, delete subscribers; deleting protected subscribers requires confirmation.

---

## Phase 4 — Subscription Management (Core)

Create and edit subscriptions linking a subscriber, a network, dates, and amounts.

- [ ] **4.1 Subscription data layer**
  - [ ] Add Zod schema for subscription forms.
  - [ ] Implement `createSubscription`, `updateSubscription`, `cancelSubscription`, `deleteSubscription`, `getSubscriptionById`, `listSubscriptions`.
  - [ ] Derive `endDate` from start date + duration before writing to DB.
  - [ ] Compute lifecycle status on read using `lib/dates` helpers.
- [ ] **4.2 Subscription list screen**
  - [ ] Create `app/subscriptions/index.tsx`.
  - [ ] Display `SubscriptionCard` with subscriber name, network, dates, amount, badges.
  - [ ] Add filters: All / Active / Expiring Soon / Expired / Unpaid.
  - [ ] Add empty states per filter.
- [ ] **4.3 Subscription add/edit/detail screens**
  - [ ] Create `app/subscriptions/add.tsx` form: select subscriber, select network, start date, duration, amount, notes.
  - [ ] Create `app/subscriptions/[id].tsx` for detail/edit/cancel/delete.
  - [ ] Show lifecycle badge and payment status badge separately.
- [ ] **4.4 Date edge cases**
  - [ ] Recompute status when app foregrounds.
  - [ ] Handle subscriptions that start in the future.
  - [ ] Avoid off-by-one errors for “expires today”.

**Acceptance:** Can create/edit subscriptions; expiration dates calculate correctly; filters show correct results after restart.

---

## Phase 5 — Payments & Renewals

Track who has paid and renew subscriptions without losing history.

- [ ] **5.1 Payment recording**
  - [ ] Add `recordPayment`, `updatePayment`, `deletePayment`, `getPaymentsForSubscription`, `getTotalPaidForSubscription`.
  - [ ] Add “Mark as Paid” quick action on `SubscriptionCard` and detail screen.
  - [ ] Support full payment; decide if partial payment is supported and implement accordingly.
  - [ ] Update `paymentStatus` on the subscription after each payment change.
- [ ] **5.2 Payment history UI**
  - [ ] Show payment history inside `app/subscriptions/[id].tsx`.
  - [ ] Add `PaymentListItem` component with date and amount.
- [ ] **5.3 Renewal flow**
  - [ ] Add `renewSubscription(subscriptionId)` that creates a **new** subscription period after the current one ends.
  - [ ] Preserve the old subscription and its payment records.
  - [ ] Pre-fill renewal form with previous duration/amount/network/subscriber.
  - [ ] Provide a “Renew” quick action and a dedicated renewal confirmation.
- [ ] **5.4 Unpaid tracking**
  - [ ] Add `getTotalUnpaidAmount()` / list unpaid subscriptions.
  - [ ] Display unpaid total in the dashboard.

**Acceptance:** Payments persist across restarts; renewing creates a new period; old payments remain visible.

---

## Phase 6 — Dashboard

Give the owner an at-a-glance view of what needs attention.

- [ ] **6.1 Tab layout**
  - [ ] Convert `src/app` to `(tabs)` structure: Dashboard, Subscriptions, WiFi, Subscribers, Settings.
  - [ ] Create `app/(tabs)/_layout.tsx` with bottom tab icons and labels.
- [ ] **6.2 Dashboard screen**
  - [ ] Create `app/(tabs)/index.tsx`.
  - [ ] Show summary cards: Active subscriptions, Expiring soon, Expired, Total unpaid.
  - [ ] Show a “Needs attention” list combining expiring/expired/unpaid items.
  - [ ] Tapping an item navigates to the subscription detail.
- [ ] **6.3 Foreground refresh**
  - [ ] Add `useAppState` listener to recompute dashboard statuses when app returns to foreground.
  - [ ] Ensure SQLite is re-querried, not relying on stale Zustand state.

**Acceptance:** Dashboard numbers match the database; opening the app after several days shows correct statuses.

---

## Phase 7 — Local Notifications

Remind the owner before subscriptions expire.

- [ ] **7.1 Notification infrastructure**
  - [ ] Create `lib/notifications/index.ts`.
  - [ ] Request permissions on first use.
  - [ ] Handle denied permissions gracefully (show in-app guidance).
- [ ] **7.2 Scheduling logic**
  - [ ] Schedule reminders at configurable intervals: 3 days before, 1 day before, on expiration day.
  - [ ] Notification body includes subscriber name, WiFi network, expiration date, amount due.
  - [ ] Skip scheduling for past dates.
  - [ ] Store scheduled notification IDs in `subscription_notifications`.
- [ ] **7.3 Reconciliation**
  - [ ] On subscription create/edit/renew/cancel/delete, cancel obsolete reminders and reschedule.
  - [ ] Prevent duplicate reminders.
- [ ] **7.4 Settings**
  - [ ] Add notification on/off toggle.
  - [ ] Add configurable reminder days (default 3 and 1).
  - [ ] Persist preferences in AsyncStorage or SQLite settings table.

**Acceptance:** Notifications schedule without errors; editing a subscription updates reminders; denied permission does not crash.

---

## Phase 8 — Backup & Restore

Protect subscriber and payment data from accidental loss.

- [ ] **8.1 Export**
  - [ ] Create `lib/backup/export.ts` that reads all SQLite tables and writes a timestamped JSON file.
  - [ ] Use `expo-file-system` to write to the cache directory.
  - [ ] Use `expo-sharing` (or OS share sheet) to let the user save the file.
  - [ ] Report export success/failure clearly.
- [ ] **8.2 Import**
  - [ ] Create `lib/backup/import.ts` that reads a selected JSON file.
  - [ ] Validate schema with Zod before touching the database.
  - [ ] Show confirmation before overwriting existing data.
  - [ ] Import within a transaction; roll back on error.
  - [ ] Preserve relationships between networks, subscribers, subscriptions, and payments.
- [ ] **8.3 Backup UI**
  - [ ] Add Backup/Restore section in Settings.
  - [ ] Add export button and import file picker.

**Acceptance:** Exported file contains all data; import restores the app to the same state; invalid files are rejected safely.

---

## Phase 9 — Settings, Theming & Polish

Make the app feel complete and reliable.

- [ ] **9.1 Settings screen**
  - [ ] Create `app/(tabs)/settings.tsx`.
  - [ ] Notification toggles and reminder-day inputs.
  - [ ] Backup/Restore actions.
  - [ ] Currency/locale format preference (optional).
- [ ] **9.2 Dark/light mode**
  - [ ] Support `useColorScheme()` with NativeWind dark variants.
  - [ ] Ensure all screens adapt correctly.
- [ ] **9.3 Error handling**
  - [ ] Add an error boundary for the root layout.
  - [ ] Surface DB errors in UI instead of silently failing.
  - [ ] Add fallback UI when queries fail.
- [ ] **9.4 Accessibility & touch targets**
  - [ ] Add accessibility labels to all action buttons.
  - [ ] Ensure touch targets are at least 44×44 dp.
- [ ] **9.5 Performance**
  - [ ] Avoid unnecessary re-renders in lists.
  - [ ] Use `FlashList` only if lists become large; otherwise `FlatList` is fine.
- [ ] **9.6 Final checks**
  - [ ] Run `pnpm run lint` and fix issues.
  - [ ] Run TypeScript check and fix issues.
  - [ ] Manually verify every scenario in Phase 10.

**Acceptance:** Settings persist, theme adapts, errors are handled gracefully, lint/type checks pass.

---

## Phase 10 — Testing & Device Validation

Validate real-world behavior, especially dates and notifications.

- [ ] **10.1 Functional tests**
  - [ ] Create a subscriber and WiFi network.
  - [ ] Create a 1-month subscription starting today; verify expiration date.
  - [ ] Mark payment as paid; verify payment status.
  - [ ] Renew subscription; verify old record is preserved and a new active period exists.
  - [ ] Delete a subscriber and confirm history is protected by confirmation.
- [ ] **10.2 Date edge cases**
  - [ ] Subscription starting Jan 31 for 1 month ends Feb 28/29.
  - [ ] Subscription expiring today shows “Expired”.
  - [ ] Subscription expiring in 2 days shows “Expiring soon”.
  - [ ] Open app after changing device date; statuses refresh.
- [ ] **10.3 Notification tests**
  - [ ] Schedule reminders and confirm IDs are stored.
  - [ ] Edit a subscription and confirm old reminders are cancelled.
  - [ ] Deny notification permission and confirm app still works.
  - [ ] Test on a real device or installed build (not only Expo Go).
- [ ] **10.4 Persistence tests**
  - [ ] Kill and reopen app; verify all data remains.
  - [ ] Export backup, clear app data, import backup; verify restoration.
- [ ] **10.5 Build**
  - [ ] Create `eas.json` or local build config for an installable build.
  - [ ] Run a preview/development build and install on a device.
  - [ ] Smoke test on both Android and iOS if possible.

**Acceptance:** All functional scenarios pass on a real installed build; backup round-trip works; notifications schedule correctly.

---

## How to Use This Plan

1. Work top to bottom. Do not skip a phase unless its outputs are genuinely already complete.
2. Mark every sub-task `[x]` as it is finished.
3. When a whole feature (e.g., **2. WiFi Network Management**) is complete, update the heading to include `✅` and write a short completion note with the commit/date.
4. Before starting the next feature, re-read `AGENTS.md` and this plan.

---

## Completion Log

Use this section to record when major milestones are finished.

| Date | Feature | Notes |
|------|---------|-------|
| 2026-10-13 | Phase 0 — NativeWind bootstrap | Installed nativewind@5.0.0-rc.0 + react-native-css@3.1.0-rc.0, Tailwind v4, PostCSS, Metro config, global.css, smoke test. TypeScript and lint pass; web export succeeds. |
