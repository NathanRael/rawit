# RAWIT Product Description

## Purpose

RAWIT is a personal tool for managing people who pay to use one or more WiFi networks. Its main purpose is to make it easy to answer:

1. Who uses each network?
2. Who owes money, and how much?
3. Which subscription is approaching expiration or has expired?

The app is built with Expo and React Native for installed mobile builds and a phone-sized web view. Desktop web is outside the supported layout. Supabase is required for email/password accounts and cross-device synchronization. Signed-in users keep an account-specific SQLite copy so previously loaded records and local changes can remain available during temporary disconnections. Store publication is out of scope.

## Core records and workflows

- **Accounts:** register with email and password, confirm the email with a code, log in, access only that account's records, and log out. Account records are opened and earlier local records are imported only after a confirmed session exists.
- **WiFi networks:** create, view, edit, and safely remove named networks.
- **Subscribers:** record subscriber details and assign them to network subscriptions.
- **Subscription periods:** record the subscriber, network, start date, duration, amount, and notes. Calculate the expiration date consistently from the duration.
- **Payments:** record payment history and show paid, unpaid, or partial payment status when partial payments are supported.
- **Renewals:** create a new period while preserving previous subscription and payment records.
- **Overview:** show active, expiring, and expired periods, unpaid amounts, and actions that need attention.
- **Reminders:** schedule configurable local reminders before expiration and on the expiration date, with optional transactional email reminders sent only to the connected user's confirmed Supabase account email through Brevo and Supabase Edge Functions. Subscriber email addresses are not recipients. In-app status remains correct even when reminders are unavailable.
- **Backup and restore:** export portable data and safely validate and restore it.

## Rules that affect behavior

### Lifecycle and payment are separate

Subscription lifecycle is date-based (`active`, `expiring soon`, `expired`) or `cancelled`. Payment status is tracked separately. An active period can be unpaid, and an expired period can be paid.

### Dates use local calendar meaning

Use the device's local date for user-facing dates and reminders. Handle month boundaries, leap years, and the expiration day consistently. Refresh derived status when the app opens or returns to the foreground; the app is not assumed to run continuously in the background.

### Account data and synchronization

SQLite stores networks, subscribers, subscription periods, and payments separately for each signed-in account. Supabase Auth stores credentials and supplies the immutable user ID used to scope a cloud snapshot of those records. Registration and sign-in require a connection. Local changes are saved first and synchronized when connected; unsynced changes remain on that device. Cloud revisions prevent one device from silently overwriting another device's newer changes; the user chooses which copy to keep when both have changed. Zustand is for small shared UI state; AsyncStorage is for small preferences and sync metadata. Notifications only remind the owner and do not determine subscription status.

Existing records in the original local database are imported into the first account used on that device. Account data is never keyed by a password, and the app never stores a password in SQLite.

## Out of scope

- Remote push notifications.
- Automatic discovery of connected devices or router control.
- App Store or Google Play publication requirements.

See [AGENTS.md](../AGENTS.md) for engineering rules and [implementation-plan.md](implementation-plan.md) for planned and completed work.
