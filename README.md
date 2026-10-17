# RAWIT

RAWIT is a personal WiFi subscription manager for installed mobile builds and **phone-sized web browsers**. Track WiFi networks, subscribers, subscription periods, payments, and upcoming expirations from an email/password account. Supabase provides account sign-in and synchronizes each user's records across devices. **Desktop web is not a supported layout.**

## How it works

- Register or log in with an email address and password. Email confirmation is disabled in the intended Supabase configuration.
- Each account has its own SQLite copy on the device or browser. Changes are saved locally first, then uploaded to that user's Supabase snapshot. The app also checks for newer cloud records when it returns to the foreground or when you choose **Sync now**.
- An internet connection is required for registration, sign-in, and cross-device synchronization. Previously loaded account records can remain available during a temporary disconnection; unsynced changes stay on that device until a later sync. This is a connected app with a local copy, not a backend-free offline app.
- Expiration reminders are local notifications on installed iOS and Android builds. Mobile web shows expiration status in the app but does not schedule browser notifications.

## Set up the account service

1. Create a Supabase project and run [the RAWIT SQL migration](supabase/migrations/20261017_user_snapshots.sql) in its SQL editor. It creates the per-user snapshot table, row-level security policies, and revision-checked save function.
2. In **Authentication → Providers → Email**, enable email/password signups and turn **Confirm Email** off.
3. Copy `.env.example` to `.env.local` and enter the project's URL and **publishable** key. Do not put a service-role or secret key in an Expo app.

See [Supabase setup](docs/supabase-setup.md) for import, sync, and deployment details. The cloud migration and Auth setting must be applied before testing account flows end to end.

## Run locally

Use the package manager represented by `pnpm-lock.yaml`:

```sh
pnpm install
pnpm start
```

Choose the installed mobile build or web option from Expo CLI. To start the mobile web view directly, run `pnpm web`. Expo Router routes live in `src/app/`.

Available checks:

```sh
pnpm lint
pnpm typecheck
pnpm exec expo export --platform all
```

Native features such as notifications and keyboard movement need an installed-build check; Expo Go and bundle exports do not establish installed-device behavior.

## Web deployment

The web target is designed for a **mobile viewport**. Desktop browser use is outside the supported experience. Deploy over HTTPS, serve the Expo SQLite worker and WASM assets, provide the required cross-origin isolation headers, and route nested paths to the app entry point. See [Supabase setup](docs/supabase-setup.md) for the hosting requirements and current web limitations.

## Project documents

- [Project description](docs/project-description.md): product behavior and scope.
- [Implementation plan](docs/implementation-plan.md): delivery checklist and milestones.
- [Agent guide](AGENTS.md): repository rules for implementation and maintenance.

RAWIT does not discover connected WiFi clients or control routers. Store publication is outside this project's scope.
