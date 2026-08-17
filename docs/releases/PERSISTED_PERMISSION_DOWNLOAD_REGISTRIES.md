# Persisted Permission & Download Decision Registries

## Included

- `permission_records` and `download_records` SQLite tables, mirroring
  the existing `bookmarks`/`audit_events` pattern (same migration
  style, same `Result<T, String>` command shape).
- New Tauri commands: `permission_list_records`, `permission_append_record`,
  `permission_clear_records`, `download_list_records`,
  `download_append_record`, `download_clear_records`.
- `db_stats`, `db_export_json`/`db_export_file`, and
  `db_import_json` extended to include both new tables (import is
  lenient via `#[serde(default)]` so older exports without these
  fields still import cleanly).
- `permissionRegistry.ts`/`downloadRegistry.ts` now persist through
  Tauri (falling back to an in-memory list outside Tauri, matching
  `auditLog.ts`'s dev fallback — not localStorage, since these are
  audit-trail-like data, not user content).
- `PermissionsView`, `DownloadGuardView`, `BrowserEngineView`, and
  `DatabaseView` updated for the resulting async API and to surface
  errors instead of failing silently (same pattern established
  earlier this cycle for Database/Vault/Home).
- Rust unit tests for the new tables' insert/list/clear round trip.
- `test:vault`-style new coverage isn't needed here since the existing
  `permissionManagerSmoke.ts`/`downloadGuardSmoke.ts` already exercise
  the persisted path end-to-end (now `await`ed).

## Fixed a bug found while verifying this

The initial manual test of "does this survive an app restart" reported
a false negative: decisions appeared to vanish after quitting and
reopening the packaged app. Root cause turned out to be a stale
`/Applications/tauri-app.app` build from three weeks earlier (predating
this feature entirely — confirmed it had no `permission_append_record`
command in its binary at all). Reopening the app through normal macOS
means (not an explicit path) let Launch Services resolve to that old
installed copy instead of the current dev build at
`src-tauri/target/release/bundle/macos/`. Removed the stale copy;
verified persistence for real afterward with a clean quit/relaunch
cycle of the correct build — permission, download, camera, and zip
decisions all survived.

**Operator note:** when manually testing a locally-built `.app` on
macOS, launch it by its exact path (`open <path>`) rather than through
Spotlight/Dock/Finder if there's any chance an older build was ever
installed to `/Applications` — Launch Services can silently resolve to
the wrong one.

## Verification

- `npm run check`
- `npm run build`
- `cargo check` / `cargo fmt --check` / `cargo test`
  (`src-tauri`) — 8 Rust tests passing, including the new
  `permission_and_download_records_persist_and_clear`.
- Manual: packaged `.app`, evaluated a permission and a download,
  quit, relaunched the correct build, confirmed both decisions were
  still present.

## Boundary

No new browser subsystem or capability — this persists data two
existing, already-shipped decision registries were already producing
in memory. Same SQLite file, same command shape, same UI screens.
