# Subtle fade-and-scale bottom tab transition

**Status:** Complete (installed native check pending)<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Replace the directional bottom-tab slide with a subtle fade-and-scale entrance for the content area: the destination page fades from opacity 0 to 1 while scaling from 0.98 to 1.0 over about 240 ms with ease-out. The navbar stays outside the animated view, no horizontal or vertical movement is used, and non-tab navigation keeps the native stack default.

## Completed

- [x] Removed direction calculation and `animationTypeForReplace` from the navbar and root layout (previous session, uncommitted).
- [x] Wrapped the Stack content (not the navbar) in a Reanimated `Animated.View`.
- [x] Scale-only (0.97 to 1) attempt from a previous session; superseded by this revision.
- [x] Added opacity (0 to 1) to the animated style alongside scale (0.98 to 1).
- [x] Set initial opacity and scale immediately before animating, so the settled page does not paint before the entrance starts.
- [x] Moved timing values into `src/theme/motion.ts` (`motion.tabPage`: 240 ms, initial opacity 0, initial scale 0.98, ease-out cubic).
- [x] Removed the redundant same-route branch in `AppNavigationBar` `handleChange`; the root still cancels same-route requests.
- [x] Lint, typecheck, and all-platform export pass.
- [x] Softened the entrance per user feedback: 340 ms (was 240), initial scale 0.985 (was 0.98), CSS "ease" bezier (0.25, 0.1, 0.25, 1) instead of ease-out cubic. Lint, typecheck, and export pass.
- [x] Fixed intermittent left/right slides: tab roots now have a static per-route `animation: "none"`; the timed pending toggle and its `requestAnimationFrame` reset were removed from the Stack `screenOptions`.

## Remaining

- [ ] Manual check on an installed native build: smoothness, no flicker or blank frame, rapid tab switching, and no slide from any tab (including after detail/form pages).
- [ ] Decide whether in-page links that push a tab root (Home "View all", "Go to subscribers/WiFi" buttons) should keep the slide; they now use the instant transition.

## Blockers / stopping point

- Installed native visual behavior cannot be validated in this workspace; there is no native project, EAS configuration, or device target.
- Root cause of the leftover slides (from installed sources): the native stack animates a replacement using the entering screen's `stackAnimation`. The earlier code set `animation: "none"` only while `pendingTabTransition` was set, then cleared it in `requestAnimationFrame` after the pathname committed. If the native transition ran after that reset, the default slide played (intermittent). Android: `ScreenStack.kt` ~201-205. iOS: `RNSScreenStackAnimator.mm` ~60 and `RNSScreenStack.mm` ~627-636.
- Trade-off: tab roots are now always `animation: "none"`, so in-page links that push a tab root (Home "View all" to subscriptions, "Go to subscribers/WiFi" in the period form) also lose the native slide, and an iOS swipe-back from such a pushed tab root may no longer animate. Not verified on device.

## Next step

- On an installed build, switch tabs repeatedly from tab roots and from detail/form pages and confirm there is no native slide. Then decide on the in-page tab-root push behavior above.

## Relevant files and decisions

- `src/app/_layout.tsx` - `stackScreenOptions` sets `animation: "none"` on tab roots (`index`, `subscriptions`, `wifi`, `subscribers`, matched after stripping `/index`); the Stack no longer toggles animation per tap; the Reanimated wrapper animates the Stack content only.
- `src/components/AppNavigationBar.tsx` - maps the pressed tab to the root navigation request; no direction logic.
- `src/theme/motion.ts` - tab page transition timing tokens (`motion.tabPage`).
- Decision: static per-route `none` for tab roots instead of a timed toggle, because the replacement's transition reads the entering screen's option, and a timed reset can race the native transition.
- Decision: animate the wrapped Stack content only; the navbar and app shell are not animated.
- Decision: no separate fade-out for the previous page. The native swap is instant, so a fade-out would add delay without visible benefit.
- Decision: no new dependency; uses the installed `react-native-reanimated` 4.5.1.

## Checks

- `pnpm lint` - passed (after the static-option fix).
- `pnpm typecheck` - passed (after the static-option fix).
- `pnpm exec expo export --platform all` - passed for iOS, Android, and web (after the static-option fix).
- Route-name check: `dist` route names are `index` for the root and `<name>/index` for the others; `stackScreenOptions` normalizes both.
- Installed native visual check - not run; no native build target is available in this workspace.
