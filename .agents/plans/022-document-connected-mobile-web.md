# Document connected accounts and mobile web

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Update README and related product/setup guidance to describe Supabase accounts, cross-device sync, and phone-sized web support without calling RAWIT an offline-first, backend-free app.

## Completed

- [x] Reviewed README, product description, Supabase setup, agent guide, package scripts, and current auth/sync behavior.
- [x] Rewrote README with Supabase setup, connected account behavior, local cache behavior, mobile web scope, and development checks.
- [x] Aligned the product description, Supabase setup, and agent guide with the mobile-only web and cloud-backed model.

## Remaining

- None.

## Blockers / stopping point

- None.

## Next step

- None.

## Relevant files and decisions

- `README.md` — main entry point and setup instructions.
- `docs/project-description.md` — product/platform scope.
- `docs/supabase-setup.md` — cloud setup and web deployment details.
- `AGENTS.md` — short repository-wide product summary.
- Current implementation still stores account-specific SQLite copies; initial sign-in and cross-device sync require Supabase connectivity.

## Checks

- `git diff --check` — passed (only line-ending warnings).
- Checked local Markdown links in README, project description, and Supabase setup — all targets exist.
- Searched updated docs and agent guide for stale offline-first/backend-free claims — none remain in the current product guidance.
- No code checks run; documentation-only change.
