# RAWIT

RAWIT is a personal WiFi subscription manager for installed mobile builds and **phone-sized web browsers**. Track WiFi networks, subscribers, subscription periods, payments, and upcoming expirations from an email/password account. Supabase provides account sign-in and synchronizes each user's records across devices. **Desktop web is not a supported layout.**

## How it works

- Register with an email address and password, then enter the confirmation code sent by Supabase before opening the account. The app can resend the code; an unconfirmed login returns to confirmation.
- Each account has its own SQLite copy on the device or browser. Changes are saved locally first, then uploaded to that user's Supabase snapshot. The app also checks for newer cloud records when it returns to the foreground or when you choose **Sync now**.
- An internet connection is required for registration, sign-in, and cross-device synchronization. Previously loaded account records can remain available during a temporary disconnection; unsynced changes stay on that device until a later sync. This is a connected app with a local copy, not a backend-free offline app.
- Expiration reminders are local notifications on installed iOS and Android builds. Mobile web shows expiration status in the app but does not schedule browser notifications.

## Environment files

RAWIT selects one environment file explicitly, so local values cannot silently override a production build:

| File | Purpose | Commands |
| --- | --- | --- |
| `.env.local` | Local Supabase used during development | `pnpm start`, `pnpm web`, `pnpm android`, `pnpm ios` |
| `.env` | Hosted Supabase used for production checks and exports | `pnpm start:prod`, `pnpm export:prod` |
| `supabase/functions/.env` | Private Brevo values used by local serving and uploaded as hosted secrets | `pnpm supabase:function:serve`, `pnpm supabase:secrets:set` |

The Expo commands run through `scripts/run-expo-env.mjs`. It disables Expo's automatic dotenv loading and reads only the file shown above. Both real environment files are ignored by Git; commit only their `.example` templates. Never put a Supabase service-role key or Brevo API key in an Expo environment file because `EXPO_PUBLIC_*` values are included in the app bundle.

## First-time local setup

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and keep it running, then install dependencies and start the local Supabase stack:

```powershell
pnpm install
pnpm env:init:local
pnpm supabase:start
```

`pnpm env:init:local` creates `.env.local` and `supabase/functions/.env` from their templates without overwriting existing files. Copy the API URL and publishable key printed by `pnpm supabase:start` into `.env.local`.

Keep the local URL as `http://127.0.0.1:54321`. Web uses it directly. During native development, RAWIT replaces the loopback hostname with the Metro server's reachable hostname, which lets Expo Go and emulators connect to Supabase on this computer. The phone and computer must be on the same network, and Windows Firewall must allow the local Supabase ports.

Add a Brevo API key plus a verified sender to `supabase/functions/.env`. Do not add Supabase keys to the function file. The local Supabase runtime supplies `SUPABASE_URL` and its publishable key to the function.

## Run the complete local stack

Keep Docker Desktop running and use three terminals from the repository root.

Terminal 1 — local Supabase:

```powershell
pnpm supabase:start
```

Terminal 2 — Brevo Edge Function:

```powershell
pnpm supabase:function:serve
```

Terminal 3 — Expo app:

```powershell
pnpm start
```

You can start a target directly with `pnpm web`, `pnpm android`, or `pnpm ios`. Register a local account, then read its six digit confirmation code at [http://127.0.0.1:54324](http://127.0.0.1:54324). The local Supabase configuration uses `supabase/templates/confirmation.html`, which includes the token required by RAWIT's confirmation screen. After signing in, use **Settings → Test email delivery → Send test email**; this request reaches the locally served function and Brevo sends to the connected account's confirmed email.

Stop the local Supabase containers when finished:

```powershell
pnpm supabase:stop
```

## Hosted Supabase and production

1. Create a Supabase project and run [the RAWIT SQL migration](supabase/migrations/20261017_user_snapshots.sql) in its SQL editor.
2. In **Authentication → Providers → Email**, enable email/password signups and keep **Confirm Email** on. In **Authentication → Email Templates → Confirm sign up**, include `{{ .Token }}`.
3. Run `pnpm env:init:prod`, then enter the hosted project's URL and publishable key in `.env`. Existing `.env` files are preserved.
4. Link and deploy the Edge Function, then add the private Brevo values to Supabase:

   ```powershell
   pnpm supabase:link -- --project-ref your-project-ref
   pnpm supabase:secrets:set
   pnpm supabase:function:deploy
   ```

Use `pnpm start:prod` to run Expo against the hosted project and `pnpm export:prod` for the production export. See [Supabase setup](docs/supabase-setup.md) for account sync, deployment details, and current limitations.

Available checks:

```powershell
pnpm lint
pnpm typecheck
pnpm export:prod
```

## Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm env:init:local` | Create missing local Expo and Brevo environment files from templates |
| `pnpm env:init:prod` | Create a missing hosted Expo `.env` from its template |
| `pnpm supabase:login` | Sign the CLI into Supabase |
| `pnpm supabase:start` | Start the local Supabase containers and apply migrations |
| `pnpm supabase:stop` | Stop the local Supabase containers |
| `pnpm supabase:status` | Show local service URLs and keys |
| `pnpm supabase:reset` | Recreate the local database and reapply migrations |
| `pnpm supabase:link -- --project-ref <ref>` | Link this repository to a hosted project |
| `pnpm supabase:db:diff` | Show local schema changes as SQL |
| `pnpm supabase:migration:new -- <name>` | Create a timestamped migration file |
| `pnpm supabase:db:pull` | Create a migration from the linked hosted schema |
| `pnpm supabase:db:push` | Apply pending migrations to the linked hosted database |
| `pnpm supabase:function:serve` | Serve the reminder function locally with the Brevo env file |
| `pnpm supabase:secrets:set` | Upload the Brevo env file to the linked project's function secrets |
| `pnpm supabase:secrets:list` | List secret names configured on the linked project |
| `pnpm supabase:function:deploy` | Deploy the reminder function to the linked project |
| `pnpm check` | Run lint and TypeScript checks |
| `pnpm test` | Run the repository's date and overview tests |
| `pnpm build` | Export production bundles for web, Android, and iOS |
| `pnpm verify` | Run checks, tests, and the production build in sequence |

Database reset, pull, and push commands modify database state. Review the target and pending migrations before using them.

Expo Router routes live in `src/app/`. Native features such as notifications and keyboard movement need an installed-build check; Expo Go and bundle exports do not establish installed-device behavior.

## Web deployment

The web target is designed for a **mobile viewport**. Desktop browser use is outside the supported experience. Deploy over HTTPS, serve the Expo SQLite worker and WASM assets, provide the required cross-origin isolation headers, and route nested paths to the app entry point. See [Supabase setup](docs/supabase-setup.md) for the hosting requirements and current web limitations.

## Project documents

- [Project description](docs/project-description.md): product behavior and scope.
- [Implementation plan](docs/implementation-plan.md): delivery checklist and milestones.
- [Agent guide](AGENTS.md): repository rules for implementation and maintenance.

RAWIT does not discover connected WiFi clients or control routers. Store publication is outside this project's scope.
