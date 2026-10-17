# Overflow actions bottom sheet

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Replace the overflow action popup used from `AppScreenFrame` (including Period details) with the app's shared bottom-sheet design and shared `Button` component. Keep the screen header fixed while content scrolls, with a seamless surface at the top and an opaque separated surface after scrolling.

## Completed

- [x] Inspected the shared `FormSheet`, `Button`, and `OverflowMenu` components and the Period details usage.
- [x] Replaced the popup in `OverflowMenu` with `FormSheet`, reusing the shared bottom-sheet handle, header, and safe-area styling.
- [x] Rendered actions and close control with the shared `Button`; destructive items use the danger variant and disabled states remain respected.
- [x] Moved the screen header outside the scroll view so it stays visible, and added a canvas surface and subtle divider after scrolling.
- [x] `pnpm lint` and `pnpm typecheck` pass.
- [x] `pnpm exec expo export --platform all` completes for iOS, Android, and web.
- [x] `git diff --check` passes.

## Remaining

- None.

## Blockers / stopping point

- Native bottom-sheet gesture and sticky-header interaction were not manually verified in an installed build.

## Next step

- None.

## Relevant files and decisions

- `src/components/OverflowMenu.tsx` — shared three-dot trigger and action list; implement the sheet here so Period details and payment action menus share the behavior.
- `src/components/FormSheet.tsx` — established bottom-sheet chrome and gesture behavior; reuse it rather than introducing a second sheet design.
- `src/components/Button.tsx` — established button styling; use `danger` for destructive actions and `secondary` for other actions.
- `src/components/AppScreenFrame.tsx` — fixed header and scroll-dependent surface styling.
- `src/app/subscriptions/[id]/index.tsx` — Period details integration using the shared overflow menu.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform all` — passed (iOS, Android, and web bundles exported).
- `git diff --check` — passed.
