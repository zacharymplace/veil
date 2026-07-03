# WebView Policy Badges UI Smoke

## Status

Passed.

## Verified

- WebView screen renders from sidebar.
- Policy badges are visible and separated.
- HTTPS navigation shows ready status.
- Downloads remain blocked.
- Sandbox remains active.
- Policy reason is visible.
- Decision log records WebView decisions.

## Note

Initial HTTPS decision logging is active. Duplicate ready entries may occur during dev refresh/re-render and can be refined later.

## Verification

- `npm run check`
- `cargo check --manifest-path src-tauri/Cargo.toml`

## Next

Update Sentra with WebView observability completion.
