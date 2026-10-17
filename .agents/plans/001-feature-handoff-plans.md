# Feature handoff plans

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Require a durable, up-to-date handoff plan for each feature or substantial task so another agent can continue after an interruption or failure.

## Completed

- Added the handoff-plan requirement to `AGENTS.md`.
- Defined the filename pattern as the next unused three-digit sequence plus a short feature slug, such as `001-implement-specs.md`.
- Required plans to record status, completed work, remaining work, blockers or stopping point, next step, and relevant files, decisions, and checks.
- Created `.agents/plans/` and used this file to record the change.

## Remaining

- None for this change.

## Blockers / stopping point

- None.

## Next step

- For the next feature or substantial task, create the next numbered plan in `.agents/plans/` when work begins and keep it updated through completion.

## Files and checks

- `AGENTS.md`
- `.agents/plans/001-feature-handoff-plans.md`
- Documentation-only change; no code checks run.
