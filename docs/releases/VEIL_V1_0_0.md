# Veil v1.0.0 Release Freeze

## Status

Frozen locally.

## Release Scope

Veil v1.0.0 is a local-first private browsing vault prototype with safety-first browser controls, SQLite persistence, import/export, audit visibility, and structured core engines.

## Included Releases

- Veil Core v1
- Browser Engine v0.5
- Session Isolation v0.6
- Permission Manager v0.7
- Download Guard v0.8
- Audit Console v0.9

## Capabilities

- Tauri desktop shell
- React/TypeScript UI
- Rust command layer
- SQLite-backed vault and audit persistence
- JSON backup import/export
- Backup export to local file
- Encrypted export/import prototype
- Browser engine safe shell
- Per-session isolation model
- Per-session permission registry
- Download guard with risk classification
- Audit console with filters, summaries, export, and clear actions
- Core diagnostics
- Smoke and contract tests

## Hard Boundaries

Veil does not:

- host content
- distribute content
- scrape content
- download media
- bypass paywalls
- bypass age gates
- collect analytics
- require accounts
- sync to cloud by default
- claim production-grade cryptography yet

## Verification

Release freeze requires:

- TypeScript check
- Policy smoke test
- Rust tests
- Core smoke test
- Browser engine smoke test
- Session isolation smoke test
- Permission manager smoke test
- Download guard smoke test
- Audit console smoke test

## Next After Freeze

Feature work should stop until a v1.1 plan is written.

Recommended v1.1 candidates:

- live WebView binding
- Argon2id passphrase derivation
- OS keychain integration
- SQLCipher evaluation
- persisted permission registry
- persisted download registry
