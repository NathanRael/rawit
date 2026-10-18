# Supabase setup for RAWIT accounts

RAWIT uses Supabase Auth for email/password accounts and one revisioned cloud snapshot per user. Supabase connectivity is required to register, sign in, and synchronize across devices. The app keeps a local SQLite copy for each signed-in account so previously loaded records can remain available during temporary disconnections. Passwords are handled by Supabase Auth and are never stored in RAWIT's SQLite database.

## Configure the project

1. Create a Supabase project.
2. In its SQL editor, run [`supabase/migrations/20261017_user_snapshots.sql`](../supabase/migrations/20261017_user_snapshots.sql). This creates the per-user snapshot table, row-level security policies, and an atomic save function.
3. In **Authentication → Providers → Email**, enable email/password signups and keep **Confirm Email** on.
4. In **Authentication → Email Templates → Confirm sign up**, include `{{ .Token }}` in the message so the recipient can enter the code in RAWIT. You may keep `{{ .ConfirmationURL }}` as an additional email link, but the in-app code flow requires the token. Supabase's default link-only template does not show a code. Send a test confirmation email after saving the template. For production delivery to addresses outside your Supabase organization, configure a custom SMTP provider.
5. Copy `.env.example` to `.env` and add the hosted project's URL and **publishable** key. Never use a service-role or secret key in an Expo app. `.env` is ignored by Git.
6. For local development, run `pnpm env:init:local` and use the API URL and publishable key printed by `pnpm supabase:start`. Keep the loopback API URL in `.env.local`; native development replaces its hostname with Metro's reachable host for Expo Go and emulators. The initialization command creates missing `.env.local` and `supabase/functions/.env` files without overwriting existing files. The normal `pnpm start`, `pnpm web`, `pnpm android`, and `pnpm ios` commands read only `.env.local`; `pnpm start:prod` and `pnpm export:prod` read only `.env`. The wrapper disables Expo's automatic dotenv precedence so `.env.local` cannot override a production command.
7. Restart Expo after changing environment variables. Set the same hosted public values in the web and installed-build deployment environments.

After registration, RAWIT asks for the email code and offers **Resend code**. If the app closes before confirmation, sign in with the same email and password; Supabase's unconfirmed-email response returns you to the code screen. If sending or verifying fails, retry or resend and use the latest code received. Supabase owns the pending Auth user, so the public app cannot safely delete it as a rollback. RAWIT does not open an account database, import legacy records, or upload a snapshot until Supabase issues a confirmed session.

The app checks account ownership using the authenticated user's immutable Supabase ID. Email addresses can change; passwords are never used as record keys. Supabase row-level security limits reads and writes to the signed-in user's snapshot.

## Brevo reminder email setup

`send-reminder-email` provides the signed-in account's one-time test send. `dispatch-reminder-emails` is invoked once daily by Supabase Cron, reads due periods from the synced cloud snapshot, and sends only to each user's confirmed Supabase Auth email. Subscriber email addresses are never recipients. **Settings → Email reminders** is off by default; once enabled, it follows the same master switch and selected days as local notifications. An account needs an internet connection to change its email setting.

The root `.env.example` is for the Expo app. It contains only the Supabase project URL and publishable key used by the client. Edge Function settings live separately: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEYS` are injected by Supabase, while `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` configure Brevo delivery. The publishable key identifies the Supabase project/API; it is safe for a client when RLS is enabled. The Brevo API key is a private credential and must never go in the Expo environment or app bundle.

1. In Brevo, create an API key and verify a sender email or sending domain. The sender email is the address Brevo will send from; the sender name is its display name. Transactional delivery requires a registered sender.
2. For local Edge Function development, run `pnpm env:init:local` and replace the placeholders in `supabase/functions/.env`. Set a long random `RAWIT_CRON_SECRET` there. That local file is ignored by Git. With Docker Desktop and `pnpm supabase:start` running, serve both functions with `pnpm supabase:function:serve`. The local start applies both database migrations.
3. For deployment, link the CLI to the same Supabase project configured in the Expo app: `pnpm supabase:link -- --project-ref your-project-ref`.
4. Set the Brevo values as Supabase Edge Function secrets (never put the Brevo API key in the Expo app or source control):

   ```sh
   pnpm supabase:secrets:set
   ```

   `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEYS` are supplied to Edge Functions by Supabase; the function uses the default publishable key to validate the signed-in user's token. A fallback reads the older `SUPABASE_ANON_KEY` variable for older local Supabase CLIs.
5. Apply the pending SQL migration and deploy both functions:

   ```sh
   pnpm supabase:db:push
   pnpm supabase:function:deploy
   ```

6. In the Supabase Dashboard SQL Editor, create two [Vault secrets](https://supabase.com/docs/guides/database/vault): `rawit_project_url` containing the hosted URL (without a trailing slash), and `rawit_cron_secret` containing the exact `RAWIT_CRON_SECRET` value uploaded to Edge Function secrets. Then run `pnpm supabase:cron:setup` (or run [`supabase/cron/setup.sql`](../supabase/cron/setup.sql) in the SQL Editor). It installs one job named `rawit-email-reminders-daily` at **06:00 UTC**. Re-running the SQL replaces the job with the same name. Supabase Cron uses `pg_cron` and `pg_net` to invoke the Edge Function; Vault keeps the invocation secret out of job text. [Supabase's scheduling guide](https://supabase.com/docs/guides/functions/schedule-functions) describes this pattern.
7. Start the app, sign in, send a test via **Settings → Test email delivery**, then enable **Settings → Email reminders**. The test send is independent of the schedule. The dispatcher uses the current cloud snapshot, so wait for account sync before expecting a new period to generate email.

The account's saved device time zone determines which periods are 3, 2, 1, or 0 calendar days from expiration. At the scheduled 06:00 UTC run this is 09:00 in Nairobi; the hour varies elsewhere. A period is sent at most once for each selected interval. The delivery ledger blocks duplicate sends on overlapping runs. Failed Brevo requests can be retried on the same local date by invoking the dispatcher again; if the provider accepts an email but its database acknowledgement fails, a later retry could duplicate it. The daily job does one database query, then makes Auth/Brevo calls only for due, opted-in periods. It does not poll every few minutes.

For a local end-to-end check, first create a signed-in account and a subscription expiring on one of the selected days. Enable email reminders in Settings and sync. Then invoke the dispatcher manually (Cron itself is hosted):

```powershell
pnpm supabase:email:dispatch:local
```

The response gives `sent`, `failed`, and `skipped` counts. Invoking it again on the same UTC day should increase `skipped`, not send a duplicate. Supabase's local Auth confirmation inbox is at `http://127.0.0.1:54324`; reminder emails are sent through Brevo to the real account email.

The function calls Brevo's `POST https://api.brevo.com/v3/smtp/email` endpoint directly, following its transactional email API. A separate pnpm package installation is not required: Edge Functions run in Deno, and keeping the Node SDK out of the Expo dependency graph avoids shipping server-only code to devices. See [Brevo's transactional email API](https://developers.brevo.com/docs/send-a-transactional-email) for sender requirements and the API contract.

## Existing records and sync

Register or log in on the device that contains existing RAWIT records. Once it can reach Supabase, RAWIT merges those earlier records into the first account used on that device and uploads the result. The legacy database is retained. If a record ID collides with different cloud content, the import stops without replacing either copy.

After a local change, RAWIT saves the account's SQLite copy and attempts to upload it. Failed uploads remain pending on that device. When another device has advanced the cloud revision, RAWIT stops and asks which copy to keep; export the device copy before choosing if you need to preserve it. A cloud refresh also runs when the app returns to the foreground, and **Settings → Sync now** checks immediately.

The web app is intended for phone-sized browser viewports; desktop browsers are outside the supported layout. Web deployment must use HTTPS, serve the Expo SQLite worker/WASM assets, provide the cross-origin isolation headers noted in [`018-web-worker-bundling.md`](../.agents/plans/018-web-worker-bundling.md), and route nested URLs to `index.html` for Expo Router's single-page output.

## Web limitations to address before deployment

- Expiration reminders use `expo-notifications` on iOS and Android only; the web app still shows expiration status in its screens, but does not schedule browser notifications.
- Several delete, cancel, and restore confirmations still use React Native `Alert.alert`; these actions need a browser confirmation UI before relying on them on web.
- Backup restore still uses `expo-file-system`'s native file picker path. Confirm browser file selection and restore on the target host before advertising web backup import.
