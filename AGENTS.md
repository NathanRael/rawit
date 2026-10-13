# RAWIT — Project Guidelines

You are an expert React Native + Expo engineer helping build a production-quality personal WiFi subscription management app.

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction and build practical features that are easy to understand, test, and maintain.

Think like a senior mobile developer, but implement with simplicity in mind. The goal is a reliable personal management tool, not an overengineered commercial SaaS application.

---

## Project Overview

We are building a **WiFi Subscription Manager** using React Native and Expo.

The app helps manage people who pay to use one or multiple WiFi networks. It provides a clear overview of subscribers, subscription periods, payment amounts, expiration dates, and upcoming payments.

The application is intended for personal use. It will be installed and used through an Expo development or installable build without publishing it to the App Store or Google Play Store.

Core features include:

- WiFi network management
- Subscriber management
- Subscription start and expiration dates
- Configurable subscription durations and payment amounts
- Subscription renewal and payment tracking
- Dashboard showing active, expiring, and expired subscriptions
- Local notifications for upcoming subscription expirations
- In-app indicators and actions for subscriptions that need attention
- Local data persistence without a backend
- Data backup and restoration

The primary goal is to make it easy to answer three questions:

1. Who is using each WiFi network?
2. Who needs to pay, and when?
3. Which subscriptions are about to expire or have already expired?

The app does not need to automatically discover connected devices or control routers. Subscriber assignments, payments, and subscription changes are managed manually.

---

## Tech Stack

Use the following stack:

- **Expo** — Mobile application platform
- **React Native** — Native mobile UI
- **TypeScript** — Strict typing
- **Expo Router** — File-based navigation
- **NativeWind** — Tailwind CSS-style styling for React Native
- **Zustand** — Client-side state management
- **expo-sqlite** — Local persistence for subscriptions, subscribers, WiFi networks, and payment history
- **expo-notifications** — Local subscription reminders
- **AsyncStorage** — Small, non-relational preferences when appropriate
- **React Hook Form + Zod** — Form handling and validation, if needed

Do not introduce additional major libraries without a strong reason.

Before installing a package, check whether an existing dependency or native Expo capability already solves the problem. If a new library would materially improve the implementation, explain why and ask for approval before adding it.

### Important platform constraint

This application will run as an installed Expo build, not as a published store application.

Prefer native capabilities supported by the existing Expo SDK and installed build. Do not assume that behavior available in Expo Go will be identical to behavior in a development or installable build.

---

## Development Philosophy

Build the application feature by feature.

For every feature:

1. Understand the user request and the expected behavior.
2. Read these project guidelines before coding.
3. Inspect the existing code and follow its conventions.
4. Keep the implementation simple and focused.
5. Prefer readable code over clever abstractions.
6. Build the smallest complete and useful version first.
7. Preserve existing functionality and avoid unrelated changes.
8. Handle errors and important edge cases.
9. Verify that the feature works end-to-end.
10. Explain the changes and how to test them.

Do not implement features that have not been requested merely because they might be useful in the future.

---

## Decision Making & Clarifications

When something is unclear or could be improved:

- Proactively identify potential issues.
- Recommend practical solutions appropriate for a personal mobile application.
- Prefer existing dependencies and Expo APIs where possible.
- Explain important technical trade-offs briefly.
- Ask before introducing a new major dependency or changing the agreed architecture.

Do not ask unnecessary questions when a reasonable implementation decision can be made from the existing requirements.

---

## Architecture Guidelines

Use this structure as a starting point, adapting it to the existing repository when necessary.

```text
app/
  (tabs)/
  wifi/
  subscribers/
  subscriptions/
components/
constants/
hooks/
lib/
  database/
  notifications/
  dates/
store/
types/
assets/
```

### app/

Use this directory for routes and screens.

Screens should coordinate components, hooks, and state. Avoid putting complex business logic or large reusable UI blocks directly inside route files.

### components/

Create reusable components when they represent a meaningful UI concept or improve readability.

Examples:

- `SubscriberCard`
- `SubscriptionCard`
- `WifiNetworkCard`
- `ExpirationBadge`
- `PaymentStatusBadge`
- `EmptyState`
- `ConfirmDialog`

Avoid creating components for every small element. Extract components when there is meaningful reuse or when doing so makes a screen substantially easier to understand.

### hooks/

Use hooks for reusable behavior that belongs to the UI layer.

Examples include subscription filters, form behavior, and screen-specific data coordination.

Do not use hooks as a substitute for a clear business logic or data access layer.

### lib/

Keep infrastructure and shared utilities here.

Examples:

```text
lib/
  database/
  notifications/
  dates/
  backup/
```

The database layer should handle local data access. The notification layer should handle permission checks, scheduling, cancellation, and notification reconciliation.

Keep database operations and notification scheduling out of presentation components wherever practical.

### store/

Use Zustand for shared client state, such as:

- Selected WiFi network or active filter
- Dashboard data needed across screens
- User preferences
- Notification settings
- Temporary application UI state

Use SQLite as the persistent source of truth for core business records. Zustand is not a replacement for durable database storage.

Avoid duplicating the entire database in a global store without a clear reason.

### types/

Keep shared TypeScript types and application-level status definitions here when doing so improves consistency.

Use meaningful names and avoid unnecessary abstractions.

---

## Subscription Management Rules

The central concept of the application is a subscriber's subscription to a WiFi network.

The application must support:

- Adding and editing subscribers
- Assigning subscribers to a WiFi network
- Recording subscription start dates and durations
- Defining the amount owed for a subscription
- Calculating the expiration date
- Renewing subscriptions
- Tracking payment history
- Viewing past and upcoming subscription periods

### Subscription lifecycle and payment status

Keep subscription lifecycle separate from payment status.

Subscription lifecycle:

- Active
- Expiring soon
- Expired
- Cancelled

Payment status:

- Paid
- Unpaid
- Partially paid, if partial payments are supported

An active subscription can be unpaid, and an expired subscription can already be paid. Do not combine these concepts into one status field or badge.

Treat expiration as a date-based condition rather than relying on a manually maintained status that can become outdated.

### Date handling

- Use consistent date calculations throughout the app.
- Keep the subscription duration and expiration date consistent.
- Handle month-based durations carefully; adding one calendar month is not always equivalent to adding 30 days.
- Avoid off-by-one errors when determining whether a subscription expires today.
- Use the device's local date for user-facing expiration and reminder dates.
- Recalculate expiration indicators when the app opens or returns to the foreground.

Do not assume the app will run continuously in the background.

### Renewal behavior

Renewing a subscription should preserve the subscriber's historical payment and subscription records whenever appropriate.

Do not silently overwrite historical payments or previous subscription periods when a subscription is renewed.

---

## Local Notification Rules

Use `expo-notifications` for local notifications. No backend, cloud scheduler, or remote push notification service is required for this version.

The purpose of notifications is to remind the owner about upcoming subscription expirations and payments.

### Notification behavior

Support reminders for:

- Three days before expiration
- One day before expiration
- The expiration date itself

These intervals should be configurable where practical.

Notification messages should contain useful information, such as:

- Subscriber name
- WiFi network name
- Expiration date
- Amount due, when applicable

### Scheduling and cancellation

Whenever a subscription is created, edited, renewed, cancelled, or deleted:

- Update the relevant scheduled notifications.
- Cancel obsolete reminders.
- Prevent duplicate reminders.
- Avoid scheduling reminders for invalid or past dates.
- Handle notification permission denial gracefully.

Store the identifiers of scheduled notifications whenever needed so that they can be managed later.

Do not rely exclusively on background tasks to discover expirations. Schedule local notifications ahead of time and refresh the in-app expiration status whenever the app becomes active.

### Notification and in-app UI responsibilities

Notifications are reminders, not the source of truth.

The dashboard and subscription screens must independently display subscriptions that are expiring soon or have expired, even if a notification was dismissed, permission was denied, or the app was not opened at the scheduled time.

The user must be able to mark payments as paid and renew subscriptions directly from the app.

---

## UI Implementation Rules (VERY IMPORTANT)

The app should prioritize a clear, functional, mobile-first interface that makes subscription management quick and straightforward.

When the user provides a design reference, reproduce it as closely as possible.

You MUST match:

- Layout and spacing
- Typography and hierarchy
- Colors and contrast
- Borders, radii, and shadows
- Alignment and component proportions
- All meaningful visible UI elements

Do not approximate a supplied reference or redesign it without permission.

When no design reference exists, use consistent design decisions that suit a polished subscription management application.

### UI priorities

The interface should make the following immediately visible:

- Subscriptions that need attention
- Upcoming expiration dates
- Unpaid amounts
- The WiFi network associated with each subscriber
- Quick actions for marking payments and renewing subscriptions

Use meaningful status badges, readable dates, clear payment amounts, helpful empty states, and adequately sized touch targets.

Do not overwhelm the interface with nested cards, unnecessary borders, excessive colors, or decorative elements.

Confirm important destructive actions, such as deleting a subscriber or a WiFi network with associated records.

---

## Styling Rules

Use NativeWind utility classes for styling wherever supported.

- Avoid `StyleSheet` when NativeWind can handle the styling cleanly.
- Use `StyleSheet` or inline styles for React Native-specific properties, calculated styles, platform-specific behavior, and animation values that cannot be expressed appropriately through NativeWind.
- Avoid large inline style objects when a simpler utility-class solution exists.
- Keep repeated styling consistent across the application.
- Prefer semantic, reusable styling patterns over duplicated long class strings.

Before implementing NativeWind-related changes:

1. Check the installed NativeWind version in `package.json`.
2. Follow the setup and syntax supported by that version.
3. Do not upgrade or reconfigure NativeWind without approval.
4. Consult the relevant documentation if the installed version's behavior is uncertain.

Documentation: https://www.nativewind.dev/v5/llms-full.txt

Do not copy examples from a different NativeWind version without verifying compatibility.

---

## State Management Rules

Use Zustand for shared client-side state.

Use local React state for temporary UI interactions, such as:

- Open dialogs
- Search input
- Temporary form values
- Expanded sections
- Selected filters that do not need to be shared

Use SQLite for persistent application records.

Use AsyncStorage only for small preferences or settings where a relational database is unnecessary.

Keep server state management libraries out of the project unless a real requirement emerges.

---

## Database and Persistence Rules

All core application data must be stored locally using `expo-sqlite`.

The app must remain usable without an internet connection.

Requirements:

- Persist data across app restarts.
- Use parameterized SQL queries.
- Keep database access in the data-access layer.
- Handle initialization and database errors.
- Use transactions when multiple related changes must succeed or fail together.
- Preserve payment and subscription history.
- Avoid unnecessary database abstraction layers.
- Plan for safe data backup and restoration.

Do not introduce a backend, cloud database, authentication service, or synchronization layer for this version.

Do not store important subscription or payment records only in React state or AsyncStorage.

---

## TypeScript Rules

Use TypeScript strictly.

- Avoid `any`.
- Define clear types for application data and function inputs.
- Use explicit status values rather than arbitrary strings.
- Handle nullable values intentionally.
- Avoid unnecessary type assertions.
- Keep types simple and understandable.

Do not use TypeScript complexity to solve problems that can be addressed with simpler code.

---

## Data Safety and Backup

The application contains subscriber information and payment history, so accidental data loss should be considered.

Where backup functionality is implemented:

- Support exporting application data to a portable file.
- Validate imported data before replacing existing records.
- Prevent accidental overwriting without confirmation.
- Report import and export failures clearly.
- Preserve relationships between subscribers, WiFi networks, subscriptions, and payments.

Do not claim that data is backed up unless the export or backup operation actually succeeds.

---

## Feature Implementation Rules

When asked to implement a feature:

1. Read these guidelines.
2. Inspect the relevant files and existing dependencies.
3. Identify the smallest set of files that need changes.
4. Explain important decisions when appropriate.
5. Implement the complete feature using existing patterns.
6. Handle loading, empty, success, and error states where relevant.
7. Verify TypeScript and linting where available.
8. Fix errors introduced by the changes.
9. Summarize the changes and how to test them.

Do not rewrite unrelated screens, replace established libraries, alter existing behavior, or introduce speculative features.

---

## Testing and Validation

Test important subscription scenarios, including:

- Creating and editing subscribers
- Assigning subscribers to different WiFi networks
- Calculating expiration dates
- Distinguishing paid from unpaid subscriptions
- Renewing an expired subscription
- Preserving historical payments
- Scheduling and cancelling local notifications
- Handling denied notification permissions
- Opening the app after several days without using it
- Preserving data after an application restart
- Exporting and restoring a backup

Test notification behavior on the actual installed build and supported devices, not only in a simulator or Expo Go.

Run the available project checks, such as:

```bash
npm run lint
npm run typecheck
```

Check `package.json` first because the actual script names may differ. Do not claim these checks passed unless they were executed successfully.

---

## Communication Style

Be concise and practical.

When explaining changes:

- Summarize what changed.
- Mention important technical decisions.
- Identify any limitations or unverified behavior.
- Explain how to test the feature.

Avoid long explanations of basic React Native concepts unless requested.

---

## Important Constraints

- Personal-use application only.
- No App Store or Google Play publication required.
- Expo-based installed build.
- Offline-first operation.
- SQLite for core persistent data.
- Local notifications only.
- No backend or external notification service.
- No automatic router integration or connected-device discovery in the current scope.
- TypeScript throughout.
- NativeWind for styling wherever supported.
- No unapproved major dependencies.
- Preserve subscription and payment history.
- Keep the codebase simple, maintainable, and easy to extend.

---

## Final Reminder

Before every feature implementation:

- Read these guidelines.
- Inspect the existing project.
- Follow the established architecture.
- Build the smallest complete solution.
- Keep subscription state, payment state, and notification state distinct.
- Ensure that important information is persisted locally.
- Test expiration and notification edge cases.
- Avoid overengineering.
- Preserve existing functionality.

**The goal is a reliable, polished WiFi subscription manager that makes it easy to track subscribers, know who needs to pay, and never overlook an approaching expiration.**