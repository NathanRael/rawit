# Fix inconsistent bottom tab transition direction

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Make tab transition direction reliably match the current selected tab and destination during same-tab route resets, rapid selections, and native-stack replacements.

## Completed

- [x] Reproduced a stale selection case in code: pending tab state only synchronized when the active index changed, so same-tab detail-to-list navigation could leave its pending index set.
- [x] Identified a timing risk: the root scheduled `router.replace` one frame after changing stack options, without ensuring that option update had committed first.
- [x] Confirmed the installed Expo Router native-stack passes `animationTypeForReplace` through as `replaceAnimation` on each screen.
- [x] Removed cached current-index bookkeeping; direction is calculated from the current pathname and actual navbar order.
- [x] Superseded rapid pending navigation requests and made selecting the still-visible route cancel an undispatched request.
- [x] Dispatch `router.replace` from a layout effect after the direction option commits; guard against duplicate layout-effect dispatches.
- [x] Leave `animationTypeForReplace` undefined outside a directed tab transition, preserving Expo Router's native push default for unrelated replacements.
- [x] Lint, TypeScript, platform export, and focused whitespace checks pass.

## Remaining

None.

## Blockers / stopping point

- Installed native transition behavior is still unavailable for manual device validation in this workspace.

## Next step

- Manually check same-tab detail-to-list, forward/reverse tab changes, and rapid selection on an installed native build when one is available.

## Relevant files and decisions

- `src/components/AppNavigationBar.tsx` — maps actual pathname to the tab index and chooses direction.
- `src/app/_layout.tsx` — configures native replace animation and dispatches navbar navigation.
- `node_modules/expo-router/build/react-navigation/native-stack/views/NativeStackView.native.js` — installed native-stack forwards the replace animation option to each screen.
- Decision: derive direction directly from the current pathname's tab index, not a cached selection index.
- Decision: use a layout effect to dispatch after the option render commits instead of relying on an animation-frame delay.
- Decision: preserve Expo Router's default push animation when no tab direction is active; do not impose a global pop direction on unrelated route replacements.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform all` — passed for iOS, Android, and web.
- `git diff --check -- src/app/_layout.tsx src/components/AppNavigationBar.tsx` — passed.
- Installed native animation check — unavailable; no native project, EAS configuration, or device target is present.
