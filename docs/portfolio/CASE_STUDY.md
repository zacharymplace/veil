# Veil Case Study

## One-line Summary

Veil is a local-first private browsing vault prototype that explores how to make sensitive web browsing safer through session isolation, strict permissions, download blocking, SQLite persistence, and local audit visibility.

## Problem

Private browsing modes are usually shallow. They hide some local history, but they do not give users a durable operating model for:

- separating browsing contexts
- controlling permissions
- blocking risky downloads
- auditing privacy decisions
- backing up local data
- understanding what the browser did on their behalf

Veil treats private browsing as a system design problem rather than a cosmetic browser mode.

## Product Boundary

Veil does not host, scrape, download, recommend, or distribute content.

The product is a privacy and safety utility, not a content platform.

## What Was Built

### Veil Core v1

- Tauri desktop shell
- React/TypeScript UI
- Rust command layer
- SQLite persistence
- JSON import/export
- encrypted export/import prototype
- audit console
- release documentation
- smoke and contract tests

### Browser Engine v0.5

- safe URL normalization
- policy-gated navigation
- navigation history
- permission decision flow
- download decision flow
- session cleanup hooks

### Session Isolation v0.6

- per-session isolation scopes
- profile-based namespace model
- history, cookie, cache, and storage namespace separation
- cleanup behavior by profile

### Permission Manager v0.7

- per-session permission registry
- camera, microphone, location, and clipboard decisions
- prompt-first default posture
- audit-backed permission records

### Download Guard v0.8

- block-by-default download policy
- dangerous extension detection
- file risk classification
- per-session download records
- audit trail

### Audit Console v0.9

- event filtering
- event counts by type
- high-signal event summaries
- local export preview
- clear and refresh actions

### Live WebView Binding v1.1

- HTTPS-only navigation bound to a real browsing surface
- decision log and policy badges surfaced in the UI

### Persisted Permission & Download Registries

- moved from in-memory-only to SQLite persistence, matching the
  existing bookmarks/audit_events pattern
- verified surviving a real quit/relaunch of the packaged app

### SQLCipher + OS Keychain Encryption

- the local database is encrypted at rest (SQLCipher), with the key
  generated once and held in the OS keychain, not a user-facing
  passphrase
- existing unencrypted databases get a clean-slate reset (documented
  tradeoff, not a silent migration)

### Native WebView Migration

- replaced the iframe-based WebView with a real Tauri child webview
- HTTPS-only navigation and download blocking enforced in Rust for
  every navigation, not just the address typed in -- verified against
  a real forced download (a GitHub release asset)
- new-window/popup requests explicitly denied (found live that they
  otherwise bypass both navigation and download policy)

### Real Per-Profile Session Storage Isolation

- every profile gets its own WKWebsiteDataStore (macOS/iOS); Shopping
  (the one profile marked to persist cookies) keeps a stored,
  reused identifier, every other profile gets a fresh one that is
  genuinely deleted when its webview closes
- verified live: switching from a profile with an active Google search
  to another profile showed a completely fresh, logged-out Google --
  not just distinct identifiers, actual isolated storage

## Architecture

Veil is organized around engines rather than pages:

- Browser Engine
- Vault Engine
- Policy Engine
- Backup Engine
- Security Engine
- Audit Console

The UI renders state. The engines own behavior.

## Technical Stack

- Tauri (native child webview, not an iframe)
- Rust
- React
- TypeScript
- SQLite, encrypted at rest with SQLCipher
- OS keychain for the at-rest encryption key
- Argon2id-derived, passphrase-based encrypted export (separate from
  at-rest encryption, for portable backups)
- Local JSON backup format
- WKWebsiteDataStore per profile (macOS/iOS) for real cross-profile
  storage isolation

## Verification

The release includes:

- TypeScript checks
- Rust tests
- policy smoke test
- core diagnostics test
- browser engine smoke test
- session isolation smoke test
- permission manager smoke test
- download guard smoke test
- audit console smoke test
- SQLite import/export contract test

## Release State

- `veil-core-v1`
- `veil-v1.0.0`

All checks pass at release freeze.

## Key Design Decisions

### Local-first by default

No accounts, analytics, cloud sync, or remote telemetry.

### Block before allow

Permissions and downloads are modeled as explicit decisions instead of passive browser defaults.

### Auditability

Every meaningful browser safety decision should be visible to the user.

### Isolation before WebView

The system models session isolation, permission decisions, and download blocking before binding to a live browser runtime.

## What This Demonstrates

This project demonstrates:

- desktop app architecture
- privacy-first product design
- Rust/TypeScript integration
- local persistence with SQLite
- safety-oriented browser controls
- testable systems thinking
- disciplined release management

## Next Work

The live-WebView binding, real download/navigation enforcement, and
real per-profile storage isolation described above are done, not
planned -- this section previously described them as upcoming and was
stale.

What's actually still open:

- **Permission-callback integration** (camera/mic/geolocation prompts
  from real page content) is blocked upstream: the underlying `wry`
  crate added the needed API in a version newer than what `tauri`
  currently depends on, and there's no way to use it against a
  webview Tauri itself constructs without a `tauri` release.
- **Detecting downloads a site renders inline** instead of forcing a
  save (e.g. a PDF export handled by the browser's built-in viewer)
  isn't possible with Tauri's current public API for external URLs --
  confirmed, not just unattempted.
- **Windows/Linux storage isolation.** The macOS/iOS mechanism used
  here (`WKWebsiteDataStore`) doesn't exist on other platforms. Scoped
  what each platform's equivalent would cost (Linux is a reasonably
  direct, similarly-cheap port; Windows' available mechanism is
  meaningfully heavier, a full separate browser environment per
  profile) but not built -- no Windows/Linux target exists for this
  project yet.
- **Per-profile content filtering**, restricting what's
  allowed/displayed based on each profile's own policy parameters --
  a real idea, not yet scoped.

