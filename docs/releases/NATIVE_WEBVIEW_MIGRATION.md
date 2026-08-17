# Native WebView Migration

## Included

Replaced the `<iframe>`-based live WebView with a real Tauri child
webview (`Window::add_child`), unblocking real download and
navigation policy enforcement -- the two items from
`v1.1_PLAN.md`'s "WebView permission/download callback integration"
that don't depend on the still-missing upstream permission-request API
(see below).

- `webview_show`/`webview_hide`/`webview_set_bounds` Tauri commands
  manage a single persistent child webview, positioned/sized to match
  a placeholder `<div>` in the React layout via `getBoundingClientRect()`
  and a `ResizeObserver`.
- `on_navigation`: HTTPS-only enforced in Rust for **every** navigation
  inside the webview, including in-page link clicks -- not just the
  address the user types (the iframe `sandbox` trick only gated the
  initial `src`).
- `on_download`: real file downloads are blocked and logged to the
  persisted `download_records` table, using the same
  filename/extension/risk classification previously only simulated in
  TypeScript.
- `on_new_window`: denies every `window.open()`/`target="_blank"`
  request. Added after finding, live, that without it such requests
  bypass `on_navigation` and `on_download` entirely and are allowed by
  wry's default behavior.
- Dual-mode: outside a Tauri runtime (dev server in a plain browser
  tab), falls back to the previous iframe-based preview so the
  surrounding UI (badges, decision log, address bar) stays
  dev-testable. The "Enforcement" badge now honestly distinguishes
  `native (Rust)` from `preview only`.
- 8 new Rust unit tests for the pure decision logic
  (`webview_policy.rs`: HTTPS/non-HTTPS/unparseable navigation,
  extension-based download risk classification), independent of any
  real webview.
- Requires the `unstable` Tauri Cargo feature (needed for `add_child`
  and webview state lookup).

## Verified live, in the packaged app, not just compiled

- Native content genuinely renders (confirmed with Wikipedia, not the
  same DOM iframe as before).
- A real download attempt (a GitHub release `.zip`/`.tar.gz` asset,
  which always sends `Content-Disposition: attachment`) was correctly
  blocked with no file saved, and the block was recorded in the Audit
  tab.
- Positioning was correct both at the default window size and after
  maximizing/resizing (checked via a temporary debug probe printing
  the requested bounds and window geometry, removed before commit).

## Known limitation: content rendered inline, not downloaded

A response like Wikipedia's "Download as PDF" export is not
necessarily a **download** in the technical sense a webview engine
cares about -- if the server doesn't send
`Content-Disposition: attachment`, WebKit's built-in PDF viewer just
renders it inline as an ordinary HTTPS navigation. `on_navigation`
only checks the URL scheme, not the response's content type, so this
passes through. Researched a fix via `on_web_resource_request`
(inspect/modify response headers before rendering) and hit a real
wall: Tauri's own doc comment on that method states plainly
**"Currently only implemented for the `tauri` URI protocol... not
executed when using external URLs."** There is currently no public
Tauri API to inspect a real external HTTPS response before the
webview renders it. Not fixed; tracked as a known gap rather than
silently left unclaimed.

## Explicitly still blocked

Permission-callback integration (camera/mic/geolocation) remains
blocked on the same upstream gap identified in the earlier scoping
work: the underlying `wry` crate added a permission-request API in
v0.56.0, but `tauri` (currently pinned and latest-published at 2.11.5)
hasn't wrapped it in its own `WebviewBuilder` yet.

## Boundary

This is exactly the "expand architecture" work the project's lifecycle
manifest normally holds off on absent a validated need -- done here
because the user explicitly asked to resolve the blocked
`v1.1_PLAN.md` item, with scope agreed in advance (webview + downloads
+ navigation, not session-storage isolation, not permission
integration).
