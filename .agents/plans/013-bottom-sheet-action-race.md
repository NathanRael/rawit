# Fix unresponsive bottom-sheet action buttons

**Status:** In progress<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** N/A

## Goal

Buttons inside the shared bottom sheets (overflow-menu actions on detail pages, and Save/Cancel/fields in every form sheet) do not respond to taps. Make them respond reliably on installed iOS and Android builds, without changing action behavior, validation, or persistence.

## Completed

- [x] First attempt (kept): `OverflowMenu` runs the chosen action from the sheet's `onClose` instead of immediately after closing. This removes one race (starting a sheet or `Alert` while the previous sheet is still dismissing), but the user reported buttons still unresponsive, so it is not sufficient alone.
- [x] Switched `FormSheet` from `@expo/ui/community/bottom-sheet` (native SwiftUI/Compose modal, RN content hosted through `RNHostView` touch bridging) to `BottomSheetModal` from `@gorhom/bottom-sheet` (already installed, not previously used). Content is plain RN views in the app tree, so presses use the normal React Native touch pipeline. Present/dismiss is driven by `visible`; `onDismiss` calls `onClose` after the animation; backdrop tap and swipe-down close the sheet; handle is hidden (existing custom handle kept); `keyboardBehavior="interactive"`.
- [x] Added `GestureHandlerRootView` and `BottomSheetModalProvider` to `src/app/_layout.tsx` (required by gorhom).
- [x] `TextField` uses `BottomSheetTextInput` when rendered inside a sheet (keyboard moves the sheet), and a plain `TextInput` on full pages. Detection via `useBottomSheetInternal(true)`.
- [x] Sheet top corners use the card radius (16px, `cardRadius` in `src/theme/radius.ts`, same as `--radius-card`).
- [x] Sheet height is content-based: `enableDynamicSizing` with `maxDynamicContentSize` = window height x `maxHeightRatio` (default 0.9; Period sheet 0.95). Callers' fixed `snapPoints` removed. The whole body (handle, title, description, children) sits inside the scroll view so dynamic sizing measures all of it; long forms scroll.

## Remaining

- [ ] Manually verify on an installed iOS and Android build: every overflow action on period and payment details (Edit/Cancel/Delete period, Edit/Remove payment) and Close; the Save and Cancel buttons and text fields in Wi-Fi, subscriber, period, renewal, and payment forms; repeated open/close.
- [ ] Verify on device: short sheets open at content height; long forms cap at the max height and scroll to the last field and buttons; top corners look right on iOS and Android.
- [ ] Verify keyboard behavior in sheet forms on device (inputs stay visible when the keyboard opens; Android `softwareKeyboardLayoutMode` may need adjusting if not).
- [ ] Verify the sheet-to-sheet hand-off (Edit period from the overflow sheet opens the period form after the first sheet closes).
- [ ] Remove the unused `@expo/ui` community bottom-sheet usage only if nothing else needs it (currently no other import; the package is still a dependency for other components).

## Blockers / stopping point

- No device or emulator is available in this environment, so touch behavior is not verified; typecheck, lint, and bundling only.
- Changing the sheet implementation touches shared UI and root layout; confirm the visual result (background, backdrop, snap heights 50%/60%/90%) on device.

## Next step

- Install the build and test the overflow actions and one form sheet on iOS and Android.

## Relevant files and decisions

- `src/components/FormSheet.tsx` - now `@gorhom/bottom-sheet` `BottomSheetModal`; same props for callers, so no caller changes.
- `src/app/_layout.tsx` - `GestureHandlerRootView` + `BottomSheetModalProvider` wrap the app.
- `src/components/TextField.tsx` - sheet-aware input (`BottomSheetTextInput` inside sheets).
- `src/components/OverflowMenu.tsx` - action runs from `onClose` after dismissal.
- Decision: use gorhom instead of fixing the native path. The native sheet's touch delivery goes through `RNHostView`'s native touch handler and has had several fixes in this library line; gorhom avoids that path. Not a new dependency (already in `package.json`), but it is a change of sheet implementation; flagged for review.

## Checks

- `pnpm typecheck` - passed.
- `pnpm lint` - passed.
- `pnpm exec expo export --platform all` - passed.
- Installed-build interaction test - not run (no device available).
