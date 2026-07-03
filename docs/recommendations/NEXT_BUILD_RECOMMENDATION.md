# Next Build Recommendation

## Recommendation

Wire the live WebView binding into the visible app navigation.

## Why

Veil now has:

- browser shell
- policy engine
- session isolation
- permission registry
- download guard
- audit console
- local vault/database
- WebView contract
- minimal live WebView binding

The remaining gap is that the live WebView binding is not user-visible.

## Do Next

1. Add a sidebar item for `WebView`.
2. Render `LiveWebViewBindingView`.
3. Smoke test HTTPS navigation.
4. Smoke test HTTP blocking.
5. Confirm downloads remain blocked.
6. Confirm permission policy remains prompt-based.
7. Document the result.

## Do Not Do Yet

- Do not add recommendation feeds.
- Do not add media downloading.
- Do not add scraping.
- Do not add cloud sync.
- Do not expand adult-content features.
- Do not claim production-grade browser security.

## Success Criteria

- App launches.
- WebView screen is reachable.
- HTTPS input produces `ready`.
- HTTP input produces `blocked`.
- Download sandbox remains disabled.
- `npm run check` passes.
- `cargo check --manifest-path src-tauri/Cargo.toml` passes.
