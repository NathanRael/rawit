# Domain, dates, and local storage

**Status:** In progress<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** N/A

## Goal

Establish typed RAWIT business records, local-calendar date rules, versioned SQLite storage and typed access, and foreground refresh of date-sensitive lifecycle consumers.

## Completed

- [x] Reviewed product rules, installed SQLite APIs, existing app structure, available scripts, and repository conventions.
- [x] Confirmed the app has no existing domain or persistence implementation and the next handoff sequence is 003.
- [x] Added domain record/input types with explicit duration, lifecycle, and payment unions.
- [x] Added local-calendar expiration/status helpers and edge-case tests for month ends, leap years, future periods, expiration today, and payment-state independence.
- [x] Added a transactional version-1 SQLite schema, typed parameterized repositories, foreign-key protections, and the root startup/foreground date refresh.
- [x] Added Metro handling for Expo SQLite's WebAssembly asset and verified Android, iOS, and web platform exports.

## Remaining

- [ ] Verify SQLite migration/startup and persistence across an app restart on an installed build.

## Blockers / stopping point

- Native SQLite behavior could not be exercised with repository-only checks. `adb`, `eas`, and `gradle` are unavailable, and no Android project/device is present; an installed-build smoke test is still required for the acceptance criteria.

## Next step

- Install/run a development or preview build, confirm schema initialization and create a network/subscriber/period, force-close and reopen, then verify the records and FK protections.

## Relevant files and decisions

- `docs/project-description.md` — defines the product domain and local-calendar behavior.
- `docs/implementation-plan.md` — feature scope and acceptance criteria.
- `src/app/_layout.tsx` — app startup and foreground lifecycle integration point.
- `src/types/` — shared typed records and explicit status/duration unions.
- `src/lib/dates/` — local-date arithmetic and lifecycle derivation; month durations clamp to the target month's final day.
- `src/lib/database/` — Expo SQLite initialization, migrations, and parameterized repositories.
- `metro.config.js` — includes `.wasm` assets required by Expo SQLite's web worker.
- Lifecycle is calculated from period dates plus cancellation; payment status is calculated independently from due amount and recorded payment totals.
- Future periods remain unexpired; if their derived expiration falls within three days, they are `expiring_soon` according to the shared expiration-window rule.
- Reminder preferences remain a later settings feature; this schema will persist reminder identifiers to support notification reconciliation.

## Checks

- `pnpm typecheck` — passed.
- `pnpm lint` — passed without warnings.
- `node --experimental-strip-types --test src/lib/dates/index.test.mjs` — 4 date/status tests passed (Node emitted its module-type warning for direct TypeScript stripping).
- `pnpm exec expo export --platform all --output-dir .expo/domain-storage-export-check` — passed for Android, iOS, and web after adding `.wasm` to Metro asset extensions; the initial export identified this missing configuration.
- `git diff --check` — passed; Git printed line-ending conversion warnings for modified files, with no whitespace errors.
- `adb devices -l` — unavailable (`adb` is not installed); installed-build SQLite initialization/restart test remains unverified.
