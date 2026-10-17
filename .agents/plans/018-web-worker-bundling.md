# Web support and mobile-width web layout

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Make RAWIT bundle on web with Expo SDK 57 and keep its web interface at a centered mobile-sized width on desktop browsers.

## Completed

- [x] Confirmed the failing worker is Expo SQLite's own web worker and that the app already enables `.wasm` in Metro.
- [x] Matched the failure to Expo SDK 57's lazy worker-chunk serialization issue; `web.output: "single"` avoids the failing development serializer path and still emits the standalone worker in production export.
- [x] Changed web output from `static` to `single`.
- [x] Constrained the web app shell to a centered 430 px maximum width while preserving full available width on smaller screens and native devices.
- [x] Applied the same width cap to the startup/loading state.
- [x] Web-only export passes and emits the SQLite worker bundle.
- [x] Lint and TypeScript checks pass.

## Remaining

- None for bundling and layout. Web hosting must serve `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` (or an equivalent COEP policy) for SQLite's SharedArrayBuffer-based worker runtime.

## Blockers / stopping point

- The sandboxed all-platform export failed when Hermes could not write temporary bytecode. A later all-platform export with normal temporary-file access passed for web, iOS, and Android. An installed native build was not validated.
- Browser preview was unavailable because the sandbox denied localhost socket access to the Expo web server.

## Next step

- None.

## Relevant files and decisions

- `app.json` — selects single-page web output to avoid SDK 57's affected static/server lazy worker serialization path.
- `src/app/_layout.tsx` — caps and centers web content at 430 px, including startup state; native layouts remain full-width.
- `metro.config.js` — already retains Expo's Metro config and registers `.wasm` assets, as required for SQLite WebAssembly.
- `src/lib/database/index.ts` — initializes the existing SQLite database API across platforms.
- `src/lib/notifications/service.ts` — already guards notification scheduling and permissions on web. The reported push-token warning is an Expo module warning, unrelated to the bundling failure; this app does not register a push-token listener.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform web` — passed; emitted `index.html`, the web entry bundle, the SQLite worker bundle, and the SQLite WASM asset.
- `pnpm exec expo export --platform all` — passed for web, iOS, and Android when rerun with normal temporary-file access; the earlier sandboxed attempt failed on Hermes temp-file permissions.
- Desktop browser preview — not run; localhost socket access was denied by the sandbox.
