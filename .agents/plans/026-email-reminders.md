# Email reminders with Brevo

**Status:** In progress<br>
**Started:** 2026-10-18<br>
**Last updated:** 2026-10-18<br>
**Completed:** N/A

## Goal

Add account-owner email reminders using Brevo transactional email from Supabase Edge Functions, with secrets kept server-side and an eventual scheduled delivery path that follows the local reminder preferences.

## Completed

- [x] Fixed pnpm's global `store-dir` to `C:/Users/Rael/AppData/Local/pnpm/store`, which resolves to the existing `C:\Users\Rael\AppData\Local\pnpm\store\v10` store.
- [x] Added an authenticated Edge Function that verifies the Supabase user and sends validated reminder data only to the connected user's confirmed Supabase email via Brevo's transactional REST API; request and subscriber email addresses are not recipients.
- [x] Added a Settings action that sends a clearly labeled one-time test email to the connected user's email and reports success or setup failures.
- [x] Documented required Brevo sender setup, Edge Function secrets, deployment, and current setup boundary.
- [x] Made Expo environment selection explicit: local commands read only `.env.local`, while production commands read only `.env`.
- [x] Added local and hosted setup instructions covering Supabase, local confirmation mail, the Edge Function, Brevo secrets, Expo, and production deployment.
- [x] Enabled local email confirmation with a token-based template compatible with RAWIT's in-app code screen.
- [x] Added package scripts for environment initialization, local Supabase lifecycle, migrations, hosted linking, Brevo secrets, and Edge Function serving/deployment.

## Remaining

- [ ] Validate function type-checking and local invocation against a configured Supabase project and Brevo sender.
- [ ] Add an email reminder opt-in preference to the app and persist/sync it appropriately.
- [ ] Add a scheduled server-side reminder job with idempotency and rules for reading cloud subscription records and each account's local-time preference.
- [ ] Deploy to the user's Supabase project and verify a real email after credentials and sender are configured.

## Blockers / stopping point

- The Supabase project and Brevo sender credentials are not available in this workspace, so live delivery and scheduled deployment cannot be validated here.
- The current cloud snapshot stores business records only; a scheduled job needs a deliberate account timezone and email preference storage design before it can safely send daily reminders.

## Next step

- Validate the Edge Function locally, then design preference/timezone storage and idempotent scheduled delivery before adding the email opt-in control.

## Relevant files and decisions

- `supabase/functions/send-reminder-email/index.ts` — authenticated Edge Function; uses Brevo REST directly so no Node SDK is bundled into Expo or installed into the Edge Function.
- `supabase/functions/.env.example` — local-only template for the Brevo sender values; the actual `.env` stays ignored.
- `docs/supabase-setup.md` — explains app versus function environment variables and where to configure each value.
- `.vscode/settings.json` and `.vscode/extensions.json` — enable the Deno language server only for Supabase functions and recommend its editor extension.
- `docs/supabase-setup.md` — operator configuration and deployment steps.
- `scripts/run-expo-env.mjs` — loads exactly one Expo environment file and disables Expo's automatic dotenv loading.
- `scripts/init-env.mjs` — creates missing local or hosted environment files without overwriting credentials.
- `.env.local.example` and `.env.example` — templates for local and hosted Supabase client values.
- `README.md` — complete first-time and daily local-development workflow.
- `supabase/templates/confirmation.html` — local signup message containing the confirmation token expected by the app.
- Global pnpm config — use the existing machine store; no machine-specific store path is committed to the repository.

## Checks

- `node scripts/run-expo-env.mjs local config --type public` — passed and selected `.env.local`.
- `node scripts/run-expo-env.mjs production config --type public` — passed and selected `.env`.
- `pnpm config get store-dir` — resolves to `C:/Users/Rael/AppData/Local/pnpm/store`.
- `pnpm store path` — resolves to `C:\Users\Rael\AppData\Local\pnpm\store\v10` after the fix.
- `pnpm lint` — passed through the explicit local environment selector.
- `pnpm typecheck` — passed.
- `pnpm env:init:local` — passed and preserved the existing `.env.local` and `supabase/functions/.env` files.
- `pnpm env:init:prod` — passed and preserved the existing `.env` file.
- `pnpm check` — passed; runs lint followed by TypeScript checking.
- `pnpm install --frozen-lockfile --offline` — passed; the committed lockfile is complete and matches `package.json`.
- `pnpm exec expo install --check` — passed with current online Expo SDK compatibility data; dependencies are up to date.
- `pnpm verify` — passed; lint, typecheck, all seven repository tests, and the production web/Android/iOS export completed successfully.
- `pnpm export:prod -- --output-dir .expo/environment-selection-export` — passed for web, Android, and iOS through the explicit production environment selector after retry with Windows temporary-directory access; the sandboxed attempt could not write Hermes bytecode.
- `pnpm exec expo export --platform all --output-dir .expo/email-reminder-test-export` — passed after retry with access to the temporary Hermes output; the first sandboxed attempt was blocked by a Windows temp-file permission error.
- Supabase CLI Edge Function validation — unavailable in the sandbox because the CLI could not write telemetry under the user profile; live/local invocation remains pending.
