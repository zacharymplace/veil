# Scoping: SQLCipher At-Rest Encryption + OS Keychain

## Status

Research complete, both pieces empirically verified working on this
machine. Not started. Written against the two remaining evaluation
items from `docs/releases/v1.1_PLAN.md` and the `known_gaps` entry in
`metadata/systems-builder-lifecycle.json` ("SQLCipher-at-rest database
encryption and OS keychain integration remain planned, not
implemented").

Unlike the session-storage-isolation scoping
(`SESSION_STORAGE_ISOLATION_SCOPE.md`), this one found **no blocking
technical obstacle** — both dependencies were built and tested for
real in this environment, not just read about.

## What was verified, concretely

**SQLCipher**, via `rusqlite = { version = "0.40.1", features =
["bundled-sqlcipher-vendored-openssl"] }` (the exact version already
pinned in this repo's `Cargo.lock`, no bump needed):
- Compiles cleanly in ~26s (builds SQLCipher + OpenSSL from source, no
  system dependencies required — the most portable of the three
  SQLCipher feature flags rusqlite offers; `sqlcipher` and
  `bundled-sqlcipher` both require a system crypto/SQLCipher library
  to be pre-installed, which end users won't have).
- A database opened with `PRAGMA key = "x'<64 hex chars>'"` immediately
  after `Connection::open()` round-trips real data correctly.
- The resulting file has **no recognizable SQLite header** —
  confirmed with `file` (reports "data", not a SQLite database) and a
  hex dump (no `SQLite format 3` magic bytes) — and a plain `sqlite3`
  CLI genuinely cannot open it (`file is not a database`).
- Opening the same file with the wrong key fails cleanly
  (`file is not a database`), not silent corruption or garbage reads.

**OS Keychain**, via `keyring = "4"` (default features, no extra
config needed — pulls in Apple's Security Framework bindings on macOS
automatically; Windows Credential Manager and Linux Secret Service are
wired the same way for those platforms):
- `Entry::new(service, account)` → `.set_password()` →
  `.get_password()` → `.delete_credential()` all worked against the
  real macOS Keychain on this machine, including correct error
  behavior after deletion (`No matching credential found`).

## Proposed design

Not a user-facing passphrase for daily use — that would mean typing a
password every launch, which doesn't fit a local-first app with no
accounts. Instead:

1. On first database access, check the Keychain for an existing key
   under a fixed `(service, account)` pair (e.g.
   `("com.zplace.tauri-app", "database-key")`).
2. If absent, generate a random 32-byte key, store it (hex or
   base64-encoded) in the Keychain, and use it.
3. On every `Connection::open()`, retrieve the key from Keychain and
   run `PRAGMA key = "x'<hex>'"` before any other query — using the
   raw-key form (not a passphrase run through SQLCipher's own
   internal KDF) since the key is already high-entropy and random,
   avoiding a second KDF layer entirely.
4. The existing Argon2id-based "Encrypted Export" feature is
   unaffected — it stays a separate, user-chosen-passphrase mechanism
   for portable backups. This is about encrypting the *live* on-disk
   database transparently, not export files.

## The one real decision: existing unencrypted data

`veil.sqlite3` is currently a plain, unencrypted file. SQLCipher's
encrypted format is not the plain SQLite format — a build with the
`key` pragma set cannot open today's existing database file as-is
(confirmed above: wrong/no key → "file is not a database"). Three
ways to handle it:

1. **Real migration**: on first launch of the new build, detect an
   existing plain-format database, decrypt-then-reencrypt it in place
   (SQLCipher's documented pattern: `ATTACH` a new encrypted database,
   `sqlcipher_export()` or manual table copy, then swap files) so
   existing bookmarks/audit history survive. More code, more testing
   surface, but no data loss for anyone who's used the app.
2. **Clean-slate reset**: ship the encrypted build; if the existing
   file can't be opened with a key (i.e., it's the old plain format),
   rename/back it up and start a fresh encrypted database. Simple,
   but silently "loses" access to old data (recoverable manually from
   the renamed backup file, just not automatically).
3. **Explicit one-time prompt**: detect the old format and show the
   user a choice in-app ("Migrate existing data" vs. "Start fresh"),
   with the migration path from option 1 behind that explicit choice.

Given this is pre-1.0 prototype software with no real users yet, (2)
is the least engineering risk. But it does mean *this session's own
test data* (bookmarks, permission/download records created while
testing) would need to be backed up or accepted as lost on the first
encrypted build. Worth an explicit call before writing any code, since
unlike the export-format version bump earlier this cycle, this touches
the live application database rather than an opt-in export artifact.

## Sizing

Smaller and lower-risk than the session-storage-isolation work — no
architecture change, no upstream API gaps, both dependencies already
proven to work. Main effort is: wiring the key-management commands,
switching every existing `db::open()` call to apply the pragma, and
whichever migration path is chosen above. Realistic as a single
focused implementation pass once the migration question is settled.

## Recommendation

Ready to implement. The only blocker is a decision, not a technical
one: how to handle existing unencrypted data (see above).
