# Direction-aware bottom navigation transitions

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Make bottom navigation replacements slide in according to the relative positions of their tabs, while keeping the current Expo Router routes, native stack architecture, navbar appearance, and route behavior.

## Completed

- [x] Inspected the root stack and custom navbar. The actual tab order is Home, Periods, WiFi, People; Settings is a separate route.
- [x] Confirmed navbar selections use `router.replace` and Expo Router's native stack supports push/pop replace animations.
- [x] Added index-derived native push/pop direction for tab replacements. Follow-up race fixes and final selection behavior are recorded in plan `015-fix-tab-transition-races.md`.
- [x] Kept startup/restored-route rendering on the existing non-transitioning initial route path.

## Remaining

None.

## Blockers / stopping point

- Existing unrelated working-tree changes are present; leave them untouched.
- Installed-build animation behavior remains unverified: this workspace has no generated `android/` or `ios/` project, no `eas.json`, and no native build script/device target.

## Next step

- If an installed native build becomes available, manually verify forward/reverse transitions and rapid tab selections on the target platforms.

## Relevant files and decisions

- `src/components/AppNavigationBar.tsx` — source of the actual tab order and route selection.
- `src/components/BottomNavbar.tsx` — existing visual/interaction component; no design changes planned.
- `src/app/_layout.tsx` — root Expo Router stack where native replace animation is configured.
- `.agents/plans/014-directional-tab-transitions.md` — task handoff and validation status.
- Decision: use native push animation when the destination index is greater and native pop animation when it is smaller. Both use the platform's normal coordinated horizontal transition; distance does not change the animation.
- Decision: use the platform's native replace push/pop mode for paired horizontal movement. The initial frame-delayed dispatch was replaced by the commit-before-navigation implementation in plan `015-fix-tab-transition-races.md`.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform all` — passed for iOS, Android, and web. Metro reported an unreadable cache and fell back to a full crawl successfully.
- Installed native build/device check — not run; no native project, EAS configuration, build script, or device target is available in this workspace.
