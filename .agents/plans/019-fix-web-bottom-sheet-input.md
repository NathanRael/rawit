# Fix web bottom sheet text input and review web support

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Fix the reported web input blur crash and inspect adjacent web-only runtime risks in RAWIT.

## Completed

- [x] Read the reported stack trace and identify `BottomSheetTextInput` as the component calling an unsupported React Native focus API on web.
- [x] Inspect shared input and bottom-sheet implementation, platform support guards, app web config, and existing web export handoff.

## Remaining

- [x] Use plain React Native `TextInput` for web fields inside bottom sheets while preserving `BottomSheetTextInput` on native.
- [x] Validate lint, TypeScript, and web export; record findings and remaining web limitations.
- [x] Audit the rest of browser execution paths, including SQLite storage requirements, reminder settings, backup flows, and destructive confirmations.

## Blockers / stopping point

- React Native Web 0.21.4 implements `Alert.alert` as an empty function. Period cancel/delete, payment removal, and network/subscriber deletion requests do nothing in the browser; restore confirmation also does nothing after a file is selected.
- The installed `expo-file-system` web entry is an unsupported stub. `File.pickFileAsync` and `new File(uri).text()` therefore prevent browser backup restore. Backup export has a separate Blob download path.
- Expo SQLite 57's web backend uses OPFS and `navigator.storage.getDirectory()`, which requires a secure context and browser OPFS support. Its synchronous worker path uses `SharedArrayBuffer`, so production hosting needs cross-origin isolation headers; details are in `.agents/plans/018-web-worker-bundling.md`.
- If OPFS or the required browser isolation is unavailable, app database initialization fails. The startup screen reports the failure but has no retry action.
- Reminder scheduling is intentionally unsupported on web, but Settings still presents reminders as enabled and lets the user toggle intervals without explaining that no browser notifications will be scheduled.
- Web database storage is origin/browser-profile local and is separate from the installed app's SQLite database. Browser storage can also be cleared or evicted, so web users need a working backup/restore path for portability and recovery.
- `web.output: "single"` requires the hosting server to route deep links back to `index.html`; otherwise refreshing a nested route may return a server 404.
- The browser backup exporter revokes its object URL immediately after clicking the download link. This is a browser-compatibility point to smoke-test because download handling can be asynchronous.

## Next step

- None.

## Relevant files and decisions

- `src/components/TextField.tsx` — shared field currently selects `BottomSheetTextInput` whenever it detects bottom-sheet context; web needs the plain input because the bottom-sheet wrapper invokes unsupported RN focus internals.
- `src/components/FormSheet.tsx` — Gorhom sheet hosting short forms; retain native keyboard-aware input behavior.
- `src/lib/notifications/service.ts` — reminders already return unsupported/no-op on web.
- `src/lib/backup/export.ts` — has a browser download path and immediate object-URL cleanup.
- `src/lib/backup/import.ts` — uses the Expo File API whose installed web entry is a stub.
- `src/app/settings/index.tsx` — exposes reminder controls and restore confirmation on web despite the unsupported underlying operations.
- `node_modules/.pnpm/react-native-web@0.21.4_*/node_modules/react-native-web/dist/exports/Alert/index.js` — confirms `Alert.alert` is empty on web.
- `node_modules/.pnpm/expo-sqlite@57.0.4_*/node_modules/expo-sqlite/web/worker.ts` and `web/wa-sqlite/AccessHandlePoolVFS.js` — confirm the worker and OPFS requirements.
- `app.json` and `.agents/plans/018-web-worker-bundling.md` — web uses single output and SQLite WebAssembly worker requirements are documented.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform web` — passed; emitted the entry bundle, SQLite worker bundle, and WASM asset.
- `pnpm exec expo export --platform all` — started and completed web bundling, but was interrupted before native exports completed; a standalone web export passed afterward.
- Source audit only for browser runtime behavior — confirmed the findings above from the installed package implementations; no browser/device interaction test was run.

**Acceptance:** Web bottom-sheet fields can blur without the `currentlyFocusedInput` crash; native bottom-sheet fields retain keyboard integration; web build exports successfully and known runtime limits are documented.
