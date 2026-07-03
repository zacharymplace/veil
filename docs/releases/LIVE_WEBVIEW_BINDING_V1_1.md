# Live WebView Binding v1.1

## Status

Released to `main`.

## Scope

Minimal live WebView binding that obeys the v1.1 WebView contract.

## Included

- HTTPS-only binding
- HTTP blocking
- Sandboxed frame
- Download-disabled sandbox
- Focused smoke test

## Verification

- `npm run test:live-webview-binding`
- `npm run check`
- `cargo check --manifest-path src-tauri/Cargo.toml`

## Next

Manual UI smoke, then app navigation wiring.
