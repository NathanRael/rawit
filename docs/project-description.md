# RAWIT Product Description

## Purpose

RAWIT is a personal tool for managing people who pay to use one or more WiFi networks. Its main purpose is to make it easy to answer:

1. Who uses each network?
2. Who owes money, and how much?
3. Which subscription is approaching expiration or has expired?

The app is built with Expo and React Native, runs as an installed build, and stores data locally so core use does not require internet access. Store publication is out of scope.

## Core records and workflows

- **WiFi networks:** create, view, edit, and safely remove named networks.
- **Subscribers:** record subscriber details and assign them to network subscriptions.
- **Subscription periods:** record the subscriber, network, start date, duration, amount, and notes. Calculate the expiration date consistently from the duration.
- **Payments:** record payment history and show paid, unpaid, or partial payment status when partial payments are supported.
- **Renewals:** create a new period while preserving previous subscription and payment records.
- **Overview:** show active, expiring, and expired periods, unpaid amounts, and actions that need attention.
- **Reminders:** schedule configurable local reminders before expiration and on the expiration date. In-app status remains correct even when notifications are unavailable.
- **Backup and restore:** export portable data and safely validate and restore it.

## Rules that affect behavior

### Lifecycle and payment are separate

Subscription lifecycle is date-based (`active`, `expiring soon`, `expired`) or `cancelled`. Payment status is tracked separately. An active period can be unpaid, and an expired period can be paid.

### Dates use local calendar meaning

Use the device's local date for user-facing dates and reminders. Handle month boundaries, leap years, and the expiration day consistently. Refresh derived status when the app opens or returns to the foreground; the app is not assumed to run continuously in the background.

### Local data is the source of truth

SQLite stores networks, subscribers, subscription periods, and payments. Zustand is for small shared UI state; AsyncStorage is for small preferences. Notifications only remind the owner and do not determine subscription status.

## Out of scope

- Backend services, cloud synchronization, accounts, or authentication.
- Remote push notifications.
- Automatic discovery of connected devices or router control.
- App Store or Google Play publication requirements.

See [AGENTS.md](../AGENTS.md) for engineering rules and [implementation-plan.md](implementation-plan.md) for planned and completed work.
