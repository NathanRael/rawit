# Email confirmation for account creation

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Support Supabase email confirmation within RAWIT registration, including code verification, resend, recovery after interrupted signup, and safe failure behavior before account data is imported.

## Completed

- [x] Reviewed registration, login, session preparation, and Supabase confirmation APIs.
- [x] Added a confirmation screen for code verification and resend, with recovery from an unconfirmed login.
- [x] Updated setup, README, product description, and agent guidance for required confirmation.
- [x] Lint, typecheck, and all-platform export succeeded.

## Remaining

- None for implementation. Live email delivery and confirmation still need validation after the Supabase project template is configured.

## Blockers / stopping point

- End-to-end email delivery and account confirmation could not be validated without a configured Supabase confirmation template and reachable mailbox. No live signup was attempted.

## Next step

- Configure the project email template with `{{ .Token }}`, then verify signup, resend, expired-code recovery, login after restart, and legacy import with a real inbox.

## Relevant files and decisions

- `src/app/register.tsx` — route to confirmation when signup returns no session.
- `src/app/auth.tsx` — recover an unconfirmed login through the confirmation screen.
- `src/app/_layout.tsx` — account preparation already waits for an authenticated session.
- `docs/supabase-setup.md` — instruct project owner to enable Confirm Email and include `{{ .Token }}` in the email template.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform all --output-dir .expo/verify-export` — passed after sandbox filesystem permissions blocked temp and asset writes on earlier attempts.
