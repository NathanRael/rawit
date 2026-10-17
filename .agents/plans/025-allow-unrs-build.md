# Allow resolver install script in deployment

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Let the deployment's strict pnpm install run the required `unrs-resolver` native-binding postinstall script without broadly allowing dependency scripts.

## Completed

- [x] Inspected the deployment error and installed package; `unrs-resolver@1.12.2` runs `napi-postinstall` to prepare its native binding.
- [x] Confirmed pnpm 11 treats ignored dependency builds as an install error by default.
- [x] Allowed only `unrs-resolver` in both pnpm 11's `allowBuilds` map and pnpm 10's legacy allowlist.
- [x] Verified the resolver postinstall, frozen installs, lint, typecheck, and all-platform export.

## Remaining

- None for implementation. The deployment workflow should be rerun after the commit is pushed.

## Blockers / stopping point

- The exact remote deployment has not been rerun yet. pnpm 11's lockfile-only validation passed locally; its full install was not run locally.

## Next step

- Commit and push only the build allowlist fix, then rerun the deployment workflow.

## Relevant files and decisions

- `pnpm-workspace.yaml` — the project build-script allowlist.
- `package.json`, `pnpm-lock.yaml`, `supabase/config.toml` — unrelated uncommitted Supabase CLI work stays out of the commit.

## Checks

- `pnpm install --frozen-lockfile` with `CI=true` — passed under pnpm 10.26.1, without ignored-build warnings.
- `pnpm rebuild unrs-resolver` — postinstall completed.
- `npx pnpm@11.28.6 config get --json allowBuilds` — showed both `@tailwindcss/oxide` and `unrs-resolver` allowed.
- `npx pnpm@11.28.6 install --frozen-lockfile --lockfile-only` with `CI=true` — passed its supply-chain and lockfile checks.
- `pnpm lint`, `pnpm typecheck`, and `pnpm exec expo export --platform all --output-dir .expo/verify-export` — passed.
