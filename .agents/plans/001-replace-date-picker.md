# Replace the date picker

## Goal and current status

Replace Expo UI's community date picker with `@react-native-community/datetimepicker` for native date selection while preserving the web text-input fallback and local-calendar date handling.

Status: Implementation and repository checks complete; native device interaction remains unverified.

## Completed

- Confirmed the app currently imports `DateTimePicker` from `@expo/ui/community/datetime-picker` in `src/components/DateField.tsx`.
- Confirmed `@react-native-community/datetimepicker` 9.1.0 and its Expo config plugin are already present in the working changes; preserve those existing edits.
- Reviewed the installed picker API. Use `DateTimePickerAndroid.open` for Android and the inline `DateTimePicker` component for iOS.
- Updated `src/components/DateField.tsx` to use the community picker, retaining the web input fallback and `LocalDate` conversion.
- Verified the installed package version with `pnpm exec expo install --check`.
- `pnpm lint`, `pnpm typecheck`, and `pnpm exec expo export --platform all` all passed.

## Remaining

- [ ] Smoke-test Android dialog selection/dismissal and iOS inline date selection on devices when available.

## Blockers or stop point

- The referenced `.agents/plans/IMPLEMENTATION-PLAN.TEMPLATE.md` was not present in the workspace; this handoff follows the headings required by `AGENTS.md`.
- Device validation was unavailable: this workspace has no Android SDK/`adb`, native Android/iOS project folders, or iOS build environment.

## Next concrete step

When a supported device is available, open a subscription create/edit form and verify Android selection/dismissal and iOS inline selection.

## Relevant files, decisions, and checks

- `src/components/DateField.tsx`: shared date field and platform picker UI.
- `package.json`, `pnpm-lock.yaml`, `app.json`: pre-existing dependency and config-plugin changes for the requested picker; do not replace or revert.
- Keep the native UI: Android system dialog, iOS inline calendar, and web `YYYY-MM-DD` text input.
- Preserve `LocalDate` values and convert picker dates through `getLocalDate`.
- Checks passed: `pnpm lint`, `pnpm typecheck`, `pnpm exec expo install --check`, and `pnpm exec expo export --platform all`.
- Native UI behavior remains unverified on devices.
