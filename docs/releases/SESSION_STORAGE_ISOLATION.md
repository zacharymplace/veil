# Real Per-Profile Session Storage Isolation

## Included

Implements the "full isolation, all profiles" scope agreed with the
user, going beyond `docs/recommendations/SESSION_STORAGE_ISOLATION_SCOPE.md`'s
original persistent-profiles-only recommendation once it turned out
the delete API (thought to be stuck on Tauri's unreleased `dev`
branch) is actually already available directly through `wry` 0.55.1 --
the exact version already pinned, no dependency bump needed.

- Every profile (Temporary, Research, Shopping, Medical, Financial,
  Adult) gets its own `WKWebsiteDataStore` via
  `WebviewBuilder::data_store_identifier` (macOS/iOS only -- see the
  scope doc's capability matrix for why).
- Persistent profiles (currently just Shopping, mirroring
  `PROFILE_POLICIES[profile].cookiesPersist` in
  `profiles.ts`) get a stored, reused identifier -- a new
  `profile_data_stores` SQLite table, same pattern as every other
  persisted entity.
- Ephemeral profiles get a fresh random identifier each time and have
  their data store **actually deleted** (`wry::WebViewExtDarwin::remove_data_store`,
  added as a direct platform-gated dependency) when the webview
  closes -- true wipe-on-close, not just "not persisted."
- A new `LiveWebViewBindingView` profile switcher (matching the
  existing pattern from other views) makes this reachable; a "Storage"
  badge and inline copy show which regime is active.
- `threatModel.ts` updated: cross-profile storage sharing moved from
  `doesNotProtectAgainst` to `protectsAgainst`, scoped precisely to
  the packaged macOS app (still listed as not protected against
  elsewhere -- dev preview, other platforms).

## Real bugs found and fixed during verification

None of these were visible from `cargo check`/`cargo test` -- all
found by actually running the packaged app and pushing on the
profile-switching flow:

1. **Data store removal raced webview teardown.** `close()` on the old
   webview only *starts* WKWebView deallocation; calling
   `remove_data_store` immediately after (even after an explicit
   `drop()`) failed with "data store is currently opened" for any page
   heavier than a blank one -- confirmed live switching away from a
   loaded ESPN page took Tauri's internal cleanup over a second in
   some cases. Fixed by moving removal to a background thread with a
   generous, widely-spaced retry schedule (1.5s initial delay, then
   2s/3s/5s/5s/10s/10s) rather than blocking the profile switch or
   failing outright. Tight, frequent retries were tried first and
   caused a secondary problem (see #2).
2. **Reusing a fixed webview label across instances.** Every new
   child webview used the same constant label
   (`"veil-live-webview"`). Confirmed live that this caused the
   previous profile's content to keep showing after switching (an
   entire ESPN page stayed visible after selecting Financial) --
   almost certainly Tauri's internal webview registry treating the
   new same-labeled webview as still resolving to the old one, or the
   old one not being cleanly superseded. Fixed by generating a unique
   label (`veil-live-webview-{uuid}`) per instance.
3. **Scroll desync.** The native webview was only repositioned on
   `ResizeObserver` events (size changes), never on scroll (position
   changes without a size change) -- confirmed live that scrolling
   the surrounding page left the native content stuck in its old
   screen position while the placeholder div moved. Added a
   `window.addEventListener("scroll", ..., { capture: true })`
   alongside the existing ResizeObserver, both routed through a single
   `requestAnimationFrame`-throttled sync function.

Diagnosed primarily through direct `eprintln!` instrumentation in a
debug build run outside the packaged `.app` (stderr captured to a
file), plus extracting frames from a screen recording the user
provided (no `ffmpeg` available; used a small Swift/AVFoundation
script instead) when a static screenshot wasn't enough to see the
switching sequence. All debug logging removed before this landed.

## Verified live, not just compiled

- Direct evidence of real isolation, not just distinct identifiers:
  switching from Medical (searched "test" on Google, real results
  visible) to Financial showed a completely fresh, unauthenticated
  Google homepage -- no search history, no session state carried
  over.
- Confirmed via the encrypted SQLite database directly (a throwaway
  Rust probe using the same `bundled-sqlcipher-vendored-openssl`
  feature, since the file can't be read with plain `sqlite3` once
  encrypted) that `profile_data_stores` correctly stored and reused
  Shopping's identifier, and that `webview.data_store.opened` /
  `webview.data_store.removed` audit events recorded the right
  identifiers for each switch.
- After the three fixes above, background cleanup succeeded on the
  *first* attempt (no retries needed) for both a blank page and a
  loaded ESPN page, confirmed via the audit trail.
- 5 new Rust unit tests (`profile_data_store.rs`): persistent/ephemeral
  classification, hex round-trip, and randomness of generated
  identifiers. Plus 1 new DB test for the `profile_data_stores`
  upsert. 28 Rust tests total, up from 22 before this feature.

## Not done / explicitly deferred

- Windows/Linux use `data_directory` instead of
  `data_store_identifier`, with different mechanics -- out of scope
  here, not implemented.
- Per-profile content filtering/customization (the user's own framing:
  "filterable/customizable by profile so it only displays if it's
  allowed due to the parameters set") -- a real idea for later, not
  scoped or started. Switching profiles currently carries over
  whatever URL was active and reloads it fresh in the new profile's
  isolated storage, by explicit choice over resetting to a blank
  state each switch.

## Boundary

User-directed architecture expansion, scope agreed in advance (see
`docs/recommendations/SESSION_STORAGE_ISOLATION_SCOPE.md` and the
follow-up decision to go beyond it once the delete API turned out to
already be available). Not proactive.
