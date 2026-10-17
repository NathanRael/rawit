# Dynamic page header

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Extract the RAWIT brand header into a reusable, non-floating component and show the current page name in its badge across all routes.

## Completed

- [x] Reviewed the Expo design-system guidance, package scripts, route structure, shared screen frame, and existing brand header.
- [x] Create a reusable header component and use it on the home screen and every screen built with `AppScreenFrame`.
- [x] Run lint, typecheck, and all-platform Expo export; inspect the final diff.

## Remaining

- [x] Implement and validate the shared header on all routes.

## Blockers / stopping point

- None.

## Next step

- None.

## Relevant files and decisions

- `src/app/index.tsx` — home page currently contains the sample static RAWIT header.
- `src/components/AppScreenFrame.tsx` — shared scrollable screen wrapper used by list, create, detail, and edit pages; place the header in its scroll content so it does not float.
- `src/components/Badge.tsx` — reuse for the page-name badge.
- `src/components/index.ts` — export the reusable component.

## Checks

- `corepack pnpm lint`, `corepack pnpm typecheck`, and `corepack pnpm exec expo export --platform all` — Corepack could not start because `pnpm` is not available on PATH.
- `node_modules/.bin/expo.CMD lint` — exited successfully; Expo printed the same `pnpm` availability warning.
- `node_modules/.bin/eslint.CMD src/app/index.tsx src/components/AppPageHeader.tsx src/components/AppScreenFrame.tsx src/components/index.ts` — passed.
- `node_modules/.bin/tsc.CMD --noEmit` — passed.
- `node_modules/.bin/expo.CMD export --platform all` — passed for iOS, Android, and web.
- `pnpm lint`, `pnpm typecheck`, and `pnpm exec expo export --platform all` — passed on the final worktree.
- `git diff --check` — passed; Git reported existing line-ending conversion warnings.
