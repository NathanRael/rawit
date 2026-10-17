# RAWIT app UX and code conventions skill

**Status:** Complete
**Started:** 2026-10-17
**Last updated:** 2026-10-17
**Completed:** 2026-10-17

## Goal

Create a discoverable repository skill that guides future AI work toward consistent form flows, UX-aware screen states, and readable reusable component/data-access boundaries.

## Completed

- [x] Read the skill-creator instructions and reviewed current screen, sheet, shared component, database, and repository conventions.
- [x] Write a scoped `SKILL.md` in `.agents/skills/` covering the requested app layout, UX consistency, and maintainable architecture conventions.
- [x] Validate its metadata and instructions; inspect the final diff.

## Remaining

- [x] Finish the skill and validation.

## Blockers / stopping point

- None.

## Next step

- None.

## Relevant files and decisions

- `.agents/skills/rawit-app-conventions/SKILL.md` — repository-level skill for RAWIT screen UX and architecture conventions.
- `src/components/SubscriberSheet.tsx` and `src/components/WifiNetworkSheet.tsx` — current native bottom-sheet form patterns.
- `src/app/subscribers/index.tsx` — example of duplicated add actions and a search field on an empty dataset to prevent repeating.
- `src/lib/database/` — typed SQLite access boundary and repository organization.

## Checks

- `python C:\Users\Rael\.codex\skills\.system\skill-creator\scripts\quick_validate.py .agents/skills/rawit-app-conventions` — passed (`Skill is valid!`).
- `git diff --check -- .agents/skills/rawit-app-conventions/SKILL.md .agents/plans/008-app-ux-conventions-skill.md` — passed; Git reported only its existing global ignore-file permission and line-ending warnings.
