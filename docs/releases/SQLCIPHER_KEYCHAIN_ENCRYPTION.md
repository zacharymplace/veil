# At-Rest Database Encryption (SQLCipher + OS Keychain)

## Included

- `veil.sqlite3` is now SQLCipher-encrypted at rest via
  `rusqlite`'s `bundled-sqlcipher-vendored-openssl` feature (compiles
  SQLCipher + OpenSSL from source, no system dependencies required on
  the end user's machine).
- The encryption key is a random 32 bytes generated on first launch
  and stored in the OS keychain (`keyring` crate, default features:
  macOS Keychain / Windows Credential Manager / Linux Secret Service)
  under `("com.zplace.tauri-app", "database-key")`. Not a user-facing
  passphrase — no daily-use friction, consistent with the app's
  no-accounts model. The existing Argon2id-based "Encrypted Export"
  feature is separate and unaffected: that's still an explicit,
  user-chosen passphrase for portable backups.
- Every `db::open()` call applies the key via `PRAGMA key` before any
  other query, mirroring the existing connection-per-command pattern.
- `docs/releases/v1.1_PLAN.md`'s "SQLCipher evaluation" and "OS
  keychain evaluation" candidate-scope items are now done, not just
  evaluated.

## Existing unencrypted data: clean-slate reset

Decided against a real in-place migration (see
`docs/recommendations/SQLCIPHER_KEYCHAIN_SCOPE.md` for the full
tradeoff) given this is pre-1.0 prototype data. On first open, if the
existing `veil.sqlite3` can't be read with the new key (i.e., it's the
old plain-SQLite format), it's renamed to
`veil.sqlite3.pre-encryption.bak` and a fresh encrypted database is
created at the original path. Old data isn't deleted, just not
automatically carried forward.

## Verified for real, not just compiled

- Two throwaway Cargo probes (outside the project, deleted after)
  confirmed both dependencies actually work on this machine before any
  project code was written: a SQLCipher-encrypted file has no SQLite
  header and a plain `sqlite3` CLI can't open it; a wrong key fails
  cleanly; the `keyring` crate's set/get/delete round-tripped against
  the real macOS Keychain.
- 5 new Rust unit tests in the project itself (14 total, up from 8):
  encrypted round-trip across reopen, wrong-key rejection, the
  clean-slate reset actually moving an old-format file aside, and the
  reset correctly leaving an already-encrypted file alone. These use
  an explicit test key rather than the real keychain, so `cargo test`
  doesn't touch or depend on OS keychain state.
- Full manual verification against the packaged `.app` with real
  existing data: confirmed the old (192KB, plain-format, 357 audit
  events) `veil.sqlite3` was renamed aside on first launch of the new
  build, the new file has no recognizable SQLite header, a bookmark
  added after the reset persisted through a real quit and relaunch,
  and the old backup file remains intact and independently readable
  as plain SQLite for manual recovery if ever needed.
- Updated the claims that referenced this as future work: `Encrypted
  local data` in Privacy view, the `Encryption:` field in Home and
  Vault views (now conditional on whether a real Tauri/keychain-backed
  connection is available, since outside the packaged app there's no
  encryption to claim), `ARCHITECTURE.md`'s "SQLCipher later" / "OS
  keychain later", and the dead-but-visible `cryptoPlan.ts` constants.

## Boundary

No new browser subsystem. This only changes how the existing SQLite
file is stored on disk and where its key lives — same tables, same
commands, same UI screens.
