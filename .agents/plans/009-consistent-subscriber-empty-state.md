# Consistent subscriber list states

**Status:** Complete
**Started:** 2026-10-17
**Last updated:** 2026-10-17
**Completed:** 2026-10-17

## Goal

Apply the RAWIT app conventions skill to currently fixable list-screen inconsistencies, especially duplicate subscriber creation actions and search controls when no subscribers exist.

## Completed

- [x] Read the new RAWIT app conventions skill and inspected subscriber and WiFi list states.
- [x] Update subscriber controls so the first-record empty state has one add action and no unusable search field; retain search for populated data and no-match results.
- [x] Review other existing collection screens for the same issue and run applicable checks.

## Remaining

- [x] Implement and validate the subscriber list state changes.

## Blockers / stopping point

- None.

## Next step

- None.

## Relevant files and decisions

- `.agents/skills/rawit-app-conventions/SKILL.md` — UX conventions being applied.
- `src/app/subscribers/index.tsx` — currently shows page-level add and empty-state add simultaneously and always shows search.
- `src/app/wifi/index.tsx` — comparison pattern: one add action in the first-record empty state and page action otherwise; no search for an empty collection.

## Checks

- `node_modules/.bin/eslint.CMD src/app/subscribers/index.tsx` — passed.
- `node_modules/.bin/tsc.CMD --noEmit` — passed.
- `node_modules/.bin/expo.CMD export --platform all` — passed for iOS, Android, and web.
- `git diff --check` — passed; Git printed existing global ignore-file access and line-ending warnings.
