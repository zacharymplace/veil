# Upstream Gap Re-Check + Windows/Linux Isolation Scoping

## Status

Research only. Written 2026-08-17, same day as the macOS session
storage isolation work, to (a) re-verify the two gaps closed out as
"blocked upstream" in that work still hold, and (b) scope what
cross-platform isolation would actually require, since everything
shipped so far is macOS/iOS-only.

## Part 1: Re-verifying the two upstream-blocked gaps

Nothing has changed. `docs.rs/tauri/latest` still resolves to 2.11.5
-- the same version already pinned, not a newer release.

**Permission-callback integration (camera/mic/geolocation).** Grepped
the actual `tauri` 2.11.5 source for `WebviewBuilder`: no permission
handling of any kind (the only hit for "permission" is an unrelated
Tauri ACL string, not a WebKit/WebView2 content permission). Checked
whether raising `wry` as a direct dependency to 0.56.0 (which does
have the permission API, per the earlier research) could route around
this the same way it did for `remove_data_store` -- it can't:
`tauri-runtime-wry` 2.11.4 (pulled in by the pinned `tauri`) requires
`wry ~0.55.1`; requesting `wry 0.56` directly would either fail to
resolve or produce a second, incompatible `wry::WebView` type that
Tauri's own `WebviewBuilder` doesn't produce -- unlike the data-store
case, there's no way to use a newer wry capability against a webview
Tauri itself constructed. Genuinely blocked on a `tauri` release, not
just a `wry` version bump.

**Inline-content-type download detection.** Re-confirmed
`on_web_resource_request`'s doc comment is unchanged ("Currently only
implemented for the `tauri` URI protocol... not executed when using
external URLs"). Also checked `on_page_load` as a second candidate
this time (fires on page-load start/finish) -- its `PageLoadPayload`
exposes only `url()` and `event()` (Started/Finished), no headers, no
response inspection. No path to this with the current public API,
full stop.

Both remain accurately described as "blocked," not just "not done
yet."

## Part 2: What Windows/Linux isolation would actually look like

Scoped by reading wry 0.55.1's own platform backends directly (not
just docs), since the mechanism differs meaningfully by platform in
ways worth knowing before committing to build either.

### Windows (WebView2)

wry's `data_directory` maps to
`CreateCoreWebView2EnvironmentWithOptions` with the directory as the
environment's `UserDataFolder` (confirmed in
`wry/src/webview2/mod.rs`). This is real isolation -- but it's the
**older, heavier** WebView2 mechanism: a full separate
`CoreWebView2Environment` (in effect, a separate browser engine
instance) per data directory. Microsoft's own newer **Multiple
Profiles API** (`CoreWebView2Profile`, `ProfileName` on
`CreateCoreWebView2ControllerOptions`) lets multiple isolated profiles
share a single environment far more cheaply -- but wry doesn't expose
it at all. Six profiles on Windows via wry's current API would mean
six separate environments, not six lightweight profiles under one --
a real resource cost (memory, startup time per profile) with no
smaller-footprint option available through wry today.

### Linux (WebKitGTK)

wry's `data_directory` maps to a `WebsiteDataManager` with distinct
`base_cache_directory`/`base_data_directory` and an explicit cookie
storage path (confirmed in `wry/src/webkitgtk/web_context.rs`) --
closer in spirit and cost to macOS's `WKWebsiteDataStore` approach
than to Windows' per-environment one. Genuinely lighter-weight.

One thing surfaced worth a real look before building on it: the same
file falls back to `WebContext::new_ephemeral()` when no
`data_directory` is given at all. Whether that's what Veil's *current*
shared/default webview already gets on Linux (meaning today's
"unisolated" behavior might already be non-persistent there, unlike
macOS/Windows) wasn't fully traced through wry's builder-to-context
wiring -- would need confirming on actual Linux hardware, which isn't
available here.

## Recommendation

Don't build either upstream-blocked gap -- there's nothing to build,
only upstream releases to wait for.

For Windows/Linux isolation: worth scoping further only if
Windows/Linux support is an actual near-term target for this project
(nothing in the repo currently suggests it is -- every manual
validation to date has been macOS-only). If it becomes one, Linux is
the cheaper, more direct port of the existing macOS approach; Windows
would need a real decision about accepting the heavier
separate-environment cost, since wry doesn't offer the lighter
profile-based alternative Microsoft itself recommends.
