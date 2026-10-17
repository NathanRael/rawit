# RAWIT Agent Guide

This file defines the repository-wide rules for agents and contributors. Keep it concise and actionable. Product behavior belongs in [`docs/project-description.md`](docs/project-description.md); delivery status belongs in [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Start here

Before changing code:

1. Read this guide and the relevant parts of the project description.
2. Inspect the current implementation, `package.json`, and nearby conventions. The app currently uses Expo Router files under `src/app/`; do not assume a root-level `app/` directory.
3. Make the smallest complete change that satisfies the request. Avoid unrelated rewrites and speculative features.
4. Update the implementation plan only when the requested work completes a feature already listed there. Record the completion date and a short note.
5. Create or update a feature handoff plan in `.agents/plans/` for every feature or substantial task. Start the plan when work begins and keep it current as work progresses so another agent can resume it after an interruption or failure. Copy `.agents/plans/IMPLEMENTATION-PLAN.TEMPLATE.md` and name each plan with the next unused three-digit sequence and a short feature slug, for example `001-implement-specs.md`.
6. Follow the template headings and record the goal and current status, what has been completed, what remains, any blockers or where work stopped, the next concrete step, and relevant files, decisions, and checks. Mark finished items clearly; do not leave the plan implying unfinished work is complete.
7. Run relevant checks when appropriate. Check available scripts first; report only checks actually run and their results.

Do not add a major dependency or change the agreed architecture without explaining the need and getting approval. Prefer installed packages and Expo capabilities.

## Commit workflow

Commit only when the user explicitly asks. When asked to commit:

1. Inspect `git status`, the working diff, and `git log --oneline -10`. Identify existing user changes and keep them out unless requested.
2. Split work into small, cohesive commits by intent. Keep dependent changes together when splitting would leave an incomplete or broken state; otherwise, avoid bundling unrelated work or a separable 1000+ line change into one commit.
3. Use Conventional Commit messages in `<type>(<scope>): <imperative summary>` form. Prefer `feat` for behavior, `fix` for corrections, `docs` for documentation, and use `refactor`, `test`, or `chore` where appropriate. Examples: `feat(subscriptions): add period records`, `fix(dates): clamp month-end expiration`.
4. Stage only the files for the intended commit chunk, inspect the staged diff, and check for accidental secrets or unrelated edits.
5. Run relevant checks before committing and report the exact checks and results. If a commit hook fails, fix the cause and create a new commit; do not skip hooks or amend unless explicitly requested.

## Product and platform

RAWIT is a personal WiFi subscription manager backed by Supabase accounts and cross-device sync. It tracks WiFi networks, subscribers, subscription periods, payments, expiration dates, reminders, and backups. It supports installed mobile builds and a phone-sized web view; desktop web and store publication are out of scope.

Supabase Auth and a per-user cloud snapshot provide the requested login and cross-device sync. Do not add another backend, remote push service, router control, or connected-device discovery. Use local notifications only. Verify platform behavior against the installed Expo SDK and target build; Expo Go behavior is not proof of installed-build behavior.

## Stack and repository conventions

- Expo SDK 57, React Native, TypeScript, and Expo Router.
- NativeWind 5 RC with Tailwind CSS 4. Check the installed version and follow its matching syntax before styling or changing setup. Do not upgrade or reconfigure it without approval.
- SQLite (`expo-sqlite`) is the durable local copy for each signed-in account. A Supabase snapshot keyed by Auth user ID synchronizes it across devices; registration and sign-in require a connection.
- Zustand is for small shared UI state; do not mirror the database in it.
- AsyncStorage is for small preferences only.
- React Hook Form and Zod are available for forms and validation when useful.
- Keep routes and screens in `src/app/`. Put reusable UI in `src/components/`, UI behavior in `src/hooks/`, infrastructure and shared utilities in `src/lib/`, shared state in `src/store/`, and shared types in `src/types/` where those directories fit the existing code.

Follow the structure already present before creating folders or moving files. Routes should coordinate UI and data; keep substantial business logic and database access out of presentation components.

## Domain rules

### Subscriptions and payments

- A subscription links one subscriber to one WiFi network for a date range and amount.
- Keep lifecycle and payment state separate. Lifecycle is derived from dates and cancellation (`active`, `expiring soon`, `expired`, `cancelled`); payment is `paid`, `unpaid`, or `partially paid` only if partial payments are supported.
- A subscription may be active and unpaid, or expired and paid. Do not combine these states.
- Derive expiration consistently from start date and duration. Use local calendar dates for user-facing status and reminders; handle month ends, leap years, and “expires today” explicitly.
- Recalculate date-based status when the app starts or returns to the foreground. Do not depend on continuous background execution.
- Renewal must preserve prior subscription periods and payment history. Do not overwrite historical records to represent a renewal.

### Persistence and data safety

- Persist networks, subscribers, subscriptions, and payments in account-specific SQLite databases; retain cached records and local changes across restarts and temporary disconnections after sign-in.
- Never store passwords in SQLite or expose a Supabase service-role key in app code. Authenticate through Supabase Auth and enforce per-user cloud access with RLS.
- Preserve local edits when cloud sync fails. Compare revisions before replacing cloud or device data and require an explicit conflict choice when both changed.
- Keep SQL in the data-access layer, use parameterized queries, handle initialization and query failures, and use transactions for related writes.
- Preserve relationships and history. Confirm destructive actions, especially deleting records with linked history.
- For backup/restore, export a portable file, validate imports before modifying data, confirm replacement, and use a transaction. Report failures accurately; never claim a backup succeeded unless it did.

### Notifications

- Use `expo-notifications` for local expiration reminders, normally three days before, one day before, and on the expiration date; honor configured preferences.
- Reconcile reminders when a subscription is created, edited, renewed, cancelled, or deleted. Cancel obsolete reminders, avoid duplicates, skip invalid or past trigger times, and handle denied permissions without breaking core app use.
- Persist notification identifiers when needed to cancel or reconcile schedules.
- Notifications are reminders, not the source of truth. Screens must show expiring and expired subscriptions even if reminders are denied, dismissed, or missed.

## UI and accessibility

- When a design reference is supplied, match its meaningful layout, spacing, typography, colors, proportions, and visible controls closely. Do not redesign it without direction.
- Without a reference, use a clear mobile-first interface that surfaces upcoming expirations, unpaid amounts, the associated network, and useful payment/renewal actions.
- Prefer NativeWind classes where supported. Use `StyleSheet` or inline styles for platform-specific, calculated, or animated values that utilities cannot express cleanly.
- Avoid nested cards, excess borders, and decorative UI that obscures the task. Provide readable dates and amounts, clear separate status indicators, helpful empty/error states, and touch targets of at least 44 dp where practical.
- Give interactive controls accessible names and states. Confirm important destructive actions.

## TypeScript and maintainability

- Keep strict types at boundaries and use explicit status unions. Avoid `any`, arbitrary status strings, and unnecessary assertions.
- Handle nullable data deliberately. Prefer straightforward code over abstractions that do not remove meaningful duplication.
- Do not add a server-state library or another major dependency without a demonstrated need and approval.

## Validation and reporting

Check `package.json` for the actual scripts. The current scripts include `pnpm lint` and `pnpm typecheck` (equivalently use the repository's configured package manager). Run relevant checks for code changes when appropriate, and fix issues introduced by the change.

After implementing each feature, run a platform export/build check to catch bundling or build errors. For this app, use `pnpm exec expo export --platform all`; when a change affects native behavior that export cannot validate, also run an installed development/preview build when available. Resolve build failures before marking the feature complete, or record any unavailable validation in the handoff plan and final response.

For date, persistence, payment, renewal, backup, or notification changes, consider the relevant cases from the product description and implementation plan. Test notification behavior on an installed build and supported devices when the change depends on native scheduling. Clearly state when device validation was not possible.

In the final response, summarize the change, important decisions, checks actually run, and any material unverified behavior. Keep it practical and concise.
