# Backup and restore

**Status:** Complete<br>
**Started:** 2026-10-17<br>
**Last updated:** 2026-10-17<br>
**Completed:** 2026-10-17

## Goal

Implement portable backup export and safe restore for all RAWIT business records: export a versioned JSON file via the system share sheet, validate backups before restoring, require user confirmation, restore atomically in a transaction, and leave existing data intact if validation or restore fails.

## Completed

- [x] Defined a versioned backup schema (`version`, `exportedAt`, `records`) with Zod validation for all business record types.
- [x] Implemented export service that reads all SQLite records, serializes them to JSON, writes to cache, and shares via `expo-sharing`; web falls back to a browser download.
- [x] Implemented import service that uses the system file picker (`expo-file-system` `File.pickFileAsync`), reads the file, validates JSON/schema/relationships/unique IDs, and returns a typed result.
- [x] Implemented transactional restore that deletes existing records in the correct order and inserts backup records; rolls back on failure and reconciles reminders on success.
- [x] Added Backup & Restore section to `/settings` with current-record summary, export button, restore button, confirmation dialog, and success/failure states.
- [x] Removed the temporary `expo-document-picker` dependency and used the already-installed `expo-file-system` picker instead.
- [x] Ran `pnpm lint`, `pnpm typecheck`, and `pnpm exec expo export --platform all`; all pass.

## Remaining

- None.

## Blockers / stopping point

- None.

## Next step

- None. Feature is complete. Actual file sharing and restore behavior still need validation on an installed build.

## Relevant files and decisions

- `src/lib/backup/schema.ts` — backup format, Zod schemas, result types.
- `src/lib/backup/export.ts` — `buildBackupData` and `exportBackup`; writes to `Paths.cache` and shares the file URI.
- `src/lib/backup/import.ts` — `pickBackupFile`, `readBackupFile`, `validateBackupContent`, and `restoreBackup`; validates relationships and unique IDs, restores in a `withDatabaseTransaction`.
- `src/lib/backup/index.ts` — public exports.
- `src/app/settings/index.tsx` — added Backup & Restore UI and flows.
- `package.json` — removed `expo-document-picker`; `expo-file-system` and `expo-sharing` were already present.

## Checks

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec expo export --platform all` — passed; bundles generated for iOS, Android, and web.
- Installed-build export/share and restore behavior were not verified on a device.
