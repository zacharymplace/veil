# v1.1.1 Hardening Pass

## Fixed

- Database, Vault, and Home views swallowed failed Tauri commands (bad
  passphrase, malformed import JSON) as unhandled promise rejections with
  no user feedback. All three now catch and surface the error.
- Session Isolation's "Cleanup" button created a brand-new phantom
  session and isolation scope on every click as a side effect, so
  cleanup never actually shrank the scope list. Extracted a pure
  `browserEngineCleanupScope()` and fixed the leak.
- WebView policy badges (Downloads, Sandbox) had hardcoded CSS
  classes instead of reflecting real binding state.
- The Home dashboard's bookmark count read from an entirely
  disconnected, always-empty storage key, so it permanently showed 0
  regardless of actual vault contents.

## Corrected claims

Session isolation (per-profile cookies/storage) was presented in the
UI, audit log, and threat model as implemented. It is not: there is
one shared Tauri window/WebView, so all profiles currently share the
same cookie jar and local storage. Updated `threatModel.ts`, HomeView
copy, and the cleanup audit events (which previously asserted
`cookies: "cleared"` unconditionally with no backing action) to
describe actual behavior. Tracked as a known gap, not silently
dropped.

## Security

Encrypted export's passphrase key derivation XOR-folded passphrase
bytes into a 32-byte AES-256 key with no salt, no hashing, and no work
factor — for any passphrase between the 12-character minimum and 31
characters, every key byte past the passphrase length was left at a
hardcoded zero. Replaced with salted Argon2id. Export format bumped to
version 2; old-format imports fail with a clear error rather than
silently using the weak derivation.

## Removed

Deleted `BrowserView.tsx`, `DashboardView.tsx`, and their
exclusively-dead dependencies (`features/browser/session.ts`,
`features/vault/vault.ts`, `features/security/privacyGuards.ts`,
`vault/bookmarks/bookmarkRepository.ts`) — an earlier prototype UI
cluster, unreferenced from any route, that made fabricated claims
("Tracker protection: enabled", "Auto-lock: Locks after 10 minutes")
for capabilities that don't exist.

## Added

- `test:vault` smoke test: saves a bookmark through the real save path
  and asserts the vault summary reflects it.
- Assertion in `test:session-isolation` that cleaning up a scope by id
  shrinks the scope count by exactly one.
- Rust unit tests for Argon2id key derivation and the full encrypt/
  decrypt round trip (7 Rust tests total, up from 1).

## Boundary

No new browser subsystem, capability, or scope was added. This pass
only fixed bugs, corrected claims to match actual behavior, and added
regression coverage for what was fixed.

## Verification

- `npm run check`
- `npm run build`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- Manual verification of each fix in a live browser session (Database
  error banner, Vault/Home bookmark count parity, isolation-scope
  cleanup count, WebView badges, updated threat model text).

## Not done

Packaged macOS WebView manual validation was not re-run against this
commit (see `metadata/systems-builder-lifecycle.json` next_action).
