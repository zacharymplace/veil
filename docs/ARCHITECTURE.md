# Architecture

## Stack

- Tauri
- Rust
- React
- TypeScript
- SQLite
- SQLCipher
- OS keychain

## Local Data

Stored locally only, in a SQLCipher-encrypted SQLite database (key in
the OS keychain, not a user-facing passphrase):
- bookmarks
- tags
- notes
- collections
- audit events
- permission and download decision records
- privacy settings
- safety settings

## Live Browsing Surface

The WebView screen is a real Tauri child webview (`Window::add_child`),
not an iframe. Rust enforces HTTPS-only navigation and download
blocking directly via `on_navigation`/`on_download`/`on_new_window`
handlers on the webview itself -- not just at the address bar.

Each profile (Temporary/Research/Shopping/Medical/Financial/Adult)
gets its own `WKWebsiteDataStore` on macOS/iOS, so cookies and storage
don't leak between profiles. Shopping (the one profile whose cookies
are meant to persist) keeps a stored, reused identifier; every other
profile gets a fresh identifier each time and has its data store
genuinely deleted when the webview closes. This mechanism doesn't
exist on Windows/Linux; those platforms currently share one storage
context (see `docs/recommendations/UPSTREAM_GAPS_AND_CROSS_PLATFORM_ISOLATION.md`).

## Default Privacy Model

- no accounts
- no cloud sync
- no telemetry
- no third-party analytics
- no remote AI
