# Auth screen design

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Match the supplied bold mobile auth reference while retaining RAWIT's TextField and Button components. Make login and registration distinct routes, remove the top RAWIT wordmark, use the existing yellow brand color, and add a restrained dot motif.

## Completed

- [x] Inspected current auth route, navigation gate, theme, input and button components, and supplied reference.
- [x] Built separate login and registration routes with a shared open-page layout, yellow headline highlight, large display type, and geometric WiFi motif.
- [x] Kept the existing `TextField`, `Button`, and `IconButton` components and removed the top RAWIT wordmark from the auth flow.
- [x] Updated protected navigation to include registration and connected the two pages with explicit links.
- [x] Added a keyboard-avoiding scroll area and focus-based scrolling for login and registration inputs. Android uses resize mode.

## Remaining

- None.

## Blockers / stopping point

- Browser visual review was attempted against the local Expo server, but this chat's in-app browser could not reach `localhost`. No installed device or Android SDK tools were available to verify live keyboard movement; Android's resize setting requires a new installed build. Build checks passed.

## Next step

- None.

## Relevant files and decisions

- `src/app/auth.tsx` — login route.
- `src/app/register.tsx` — separate registration route.
- `src/components/AuthPageLayout.tsx` — shared headline, motif, spacing, and footer layout.
- `src/hooks/useAuthKeyboardFocus.ts` — scrolls the focused field above the keyboard.
- `app.json` — sets Android's software keyboard layout to resize.
- `src/components/TextField.tsx`, `src/components/Button.tsx` — reuse unchanged.
- `src/theme/typography.ts`, `src/global.css` — existing typography and brand yellow.
- `src/app/_layout.tsx` — protected route registration.

## Checks

- `pnpm lint` — passed 2026-10-17.
- `pnpm typecheck` — passed 2026-10-17.
- `pnpm exec expo export --platform all` — passed 2026-10-17 for web, Android, and iOS.
- `pnpm exec expo config --type public` — passed; confirmed Android resize configuration.
- `adb devices` — unavailable (`adb` is not installed on this host).
- Browser visual review — attempted; local Expo server was unreachable from the in-app browser.
