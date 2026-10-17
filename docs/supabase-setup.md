# Supabase setup for RAWIT accounts

RAWIT uses Supabase Auth for email/password accounts and one revisioned cloud snapshot per user. Supabase connectivity is required to register, sign in, and synchronize across devices. The app keeps a local SQLite copy for each signed-in account so previously loaded records can remain available during temporary disconnections. Passwords are handled by Supabase Auth and are never stored in RAWIT's SQLite database.

## Configure the project

1. Create a Supabase project.
2. In its SQL editor, run [`supabase/migrations/20261017_user_snapshots.sql`](../supabase/migrations/20261017_user_snapshots.sql). This creates the per-user snapshot table, row-level security policies, and an atomic save function.
3. In **Authentication → Providers → Email**, enable email/password signups and keep **Confirm Email** on.
4. In **Authentication → Email Templates → Confirm sign up**, include `{{ .Token }}` in the message so the recipient can enter the code in RAWIT. You may keep `{{ .ConfirmationURL }}` as an additional email link, but the in-app code flow requires the token. Supabase's default link-only template does not show a code. Send a test confirmation email after saving the template. For production delivery to addresses outside your Supabase organization, configure a custom SMTP provider.
5. Copy `.env.example` to `.env.local` and add the project's URL and **publishable** key. Never use a service-role or secret key in an Expo app. `.env.local` is ignored by Git.
6. Restart Expo after changing environment variables. Set the same public values in the web and installed-build deployment environments.

After registration, RAWIT asks for the email code and offers **Resend code**. If the app closes before confirmation, sign in with the same email and password; Supabase's unconfirmed-email response returns you to the code screen. If sending or verifying fails, retry or resend and use the latest code received. Supabase owns the pending Auth user, so the public app cannot safely delete it as a rollback. RAWIT does not open an account database, import legacy records, or upload a snapshot until Supabase issues a confirmed session.

The app checks account ownership using the authenticated user's immutable Supabase ID. Email addresses can change; passwords are never used as record keys. Supabase row-level security limits reads and writes to the signed-in user's snapshot.

## Existing records and sync

Register or log in on the device that contains existing RAWIT records. Once it can reach Supabase, RAWIT merges those earlier records into the first account used on that device and uploads the result. The legacy database is retained. If a record ID collides with different cloud content, the import stops without replacing either copy.

After a local change, RAWIT saves the account's SQLite copy and attempts to upload it. Failed uploads remain pending on that device. When another device has advanced the cloud revision, RAWIT stops and asks which copy to keep; export the device copy before choosing if you need to preserve it. A cloud refresh also runs when the app returns to the foreground, and **Settings → Sync now** checks immediately.

The web app is intended for phone-sized browser viewports; desktop browsers are outside the supported layout. Web deployment must use HTTPS, serve the Expo SQLite worker/WASM assets, provide the cross-origin isolation headers noted in [`018-web-worker-bundling.md`](../.agents/plans/018-web-worker-bundling.md), and route nested URLs to `index.html` for Expo Router's single-page output.

## Web limitations to address before deployment

- Expiration reminders use `expo-notifications` on iOS and Android only; the web app still shows expiration status in its screens, but does not schedule browser notifications.
- Several delete, cancel, and restore confirmations still use React Native `Alert.alert`; these actions need a browser confirmation UI before relying on them on web.
- Backup restore still uses `expo-file-system`'s native file picker path. Confirm browser file selection and restore on the target host before advertising web backup import.
