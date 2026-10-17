# Fix frozen pnpm install in deployment

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Make the deployment's frozen pnpm install read the same override recorded in the lockfile, without losing the approved dependency build setting or unrelated work.

## Completed

- [x] Identified that newer pnpm ignores `package.json#pnpm`, so it sees no override while the lockfile records `lightningcss: 1.30.1`.
- [x] Identified separate uncommitted Supabase CLI package, lockfile, and config changes to preserve.
- [x] Moved the override and build permission to `pnpm-workspace.yaml` and removed the ignored `package.json#pnpm` field.
- [x] Confirmed a full frozen install and all-platform export.

## Remaining

- None for implementation.

## Blockers / stopping point

- The local Windows install initially hit a locked generated `lightningcss` file; removing that generated file allowed the frozen install to complete. The deployment host's exact pnpm version has not been run locally.

## Next step

- Commit and push only the deployment config fix. Then rerun the deployment to confirm the host uses the new workspace config.

## Relevant files and decisions

- `package.json` — legacy pnpm field is ignored by newer pnpm; separate Supabase CLI dependency is not part of this fix.
- `pnpm-lock.yaml` — already records the intended lightningcss override; separate Supabase CLI additions should stay unstaged.
- `pnpm-workspace.yaml` — new shared home for the override and allowed build.

## Checks

- `pnpm install --frozen-lockfile --offline` with `CI=true` — passed using pnpm 10.26.1; lockfile was up to date and all 843 packages linked.
- `pnpm install --frozen-lockfile --lockfile-only --offline` with `CI=true` on copies of the exact staged manifest, committed lockfile, and staged workspace config — passed.
- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform all --output-dir .expo/verify-export` — passed for web, iOS, and Android.
