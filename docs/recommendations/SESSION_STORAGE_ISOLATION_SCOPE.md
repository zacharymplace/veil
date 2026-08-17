# Scoping: Real Per-Profile Session Storage Isolation

## Status

Research only. Not planned, not started. Written in response to the
gap documented in `threatModel.ts`'s `doesNotProtectAgainst` and
`metadata/systems-builder-lifecycle.json`'s `known_gaps`: session
profiles (Temporary/Research/Shopping/Medical/Financial/Adult)
currently share one WebView's cookies, localStorage, and IndexedDB.
This document scopes what it would actually take to fix that for
real, so a future decision to build it (or not) is informed rather
than assumed.

Findings below are verified against the exact dependency versions
this repo has locked (`tauri 2.11.5`, `wry 0.55.1`) as of 2026-08-17,
not general Tauri knowledge — API availability in this space is
recent and still moving.

## Why the current architecture can't be patched into isolation

The live WebView (`src/browser/webview/liveWebViewBinding.ts`,
rendered by `LiveWebViewBindingView.tsx`) is an HTML `<iframe>` living
inside the single Tauri window's own webview content. Tauri's storage
isolation APIs (`data_directory`, `data_store_identifier`) are
constructor options on `WebviewBuilder`/`WebviewWindowBuilder` — they
configure a *native, Tauri-managed webview* at creation time. They do
not and cannot apply to an `<iframe>` nested inside an existing
webview's DOM; an iframe's storage partitioning is governed entirely
by the parent webview's own data store.

**This means isolation cannot be added without first replacing the
iframe with real, Tauri-managed child webviews** — one per active
session, created/destroyed/positioned via new Rust commands rather
than a `src` attribute. Tauri v2 does support multiple child webviews
positioned by rect within one window (tauri-apps/tauri#2975, shipped),
so the mechanism exists, but it's a different rendering model than
what Veil uses today: the frontend would drive webview lifecycle over
`invoke` instead of just setting an iframe `src`.

## Platform capability matrix (verified against locked versions)

| Platform | Mechanism | Status in `tauri 2.11.5` (currently locked) |
|---|---|---|
| macOS ≥ 14 / iOS ≥ 17 | `WebviewBuilder::data_store_identifier([u8; 16])` — real `WKWebsiteDataStore` per identifier | **Available now**, no dependency bump needed |
| macOS / iOS — delete a data store | `AppHandle::remove_data_store` / `fetch_data_store_identifiers` | **Not in any stable release.** Merged to Tauri's `dev` branch (PR #12900, tauri-apps/tauri#12843) but not yet cut into a published version as of this writing. `docs.rs/tauri/latest` still resolves to 2.11.5 without these methods. |
| Windows (WebView2) | `WebviewBuilder::data_directory(PathBuf)` — distinct profile directory | Available now, no gap. WebView2 also has richer native multi-profile support Tauri hasn't wrapped, but the directory approach alone is real isolation. |
| Linux (WebKitGTK) | No native per-identifier API in Tauri; community-proposed polyfill is the same `data_directory()` subdirectory approach as Windows | Available now via `data_directory`, same caveats as Windows |
| Android | Unsupported for either mechanism | Not available |

The practical read: **macOS — Veil's primary validated platform — can
create genuinely separated storage today, but cannot cleanly delete it
through a supported API yet.** That's a direct problem for the
"Temporary" and "Adult" profiles, whose entire value proposition is
leaving no trace. Persistent profiles (Research/Shopping/Medical/
Financial) aren't blocked by this, since they're not meant to be wiped
on close.

There is also an open, unresolved feature request for a first-class
cross-platform "browser profiles" API (tauri-apps/tauri#9285, still
open) — nothing here is a stable, intended-for-this-purpose Tauri
feature yet. We'd be composing lower-level primitives ourselves.

## What building this would actually require

1. **New Rust IPC surface**: commands to open/close/navigate a
   per-session native child webview, replacing the iframe `src`
   binding in `liveWebViewBinding.ts` with real invoke calls and
   lifecycle management (a webview must exist before navigation, must
   be closed before its data store can be removed, needs resize
   handling to stay aligned with the React layout's content area).
2. **Identity model**: a stable identifier per *persistent* profile
   (generated once, stored on disk, reused across app restarts so
   "Research" keeps its cookies tomorrow) vs. a fresh identifier per
   *ephemeral* session (Temporary/Adult) — which, per the gap above,
   currently has no clean way to actually be deleted on macOS.
3. **A decision on the ephemeral-wipe gap**: either (a) ship
   persistent-profile isolation now and explicitly hold ephemeral
   profiles at today's shared-storage behavior until Tauri ships the
   delete API, (b) accept an unsupported workaround (raw filesystem
   deletion of the WebKit data store directory, or vendoring the
   not-yet-released Tauri patch's approach via direct objc2/WebKit
   bindings) with the maintenance and stability risk that implies, or
   (c) wait for the upstream API to ship before doing any of this.
4. **A cross-platform story**, even if macOS ships first — Windows and
   Linux use a different mechanism (`data_directory`) with different
   constraints (e.g. WebView2 requires webviews sharing a data
   directory to have matching browser-arg settings).
5. **Updated claims once (and only once) it's real**: the corrections
   made in the last hardening pass (`threatModel.ts`,
   `sessionIsolation.ts` audit events, HomeView copy) would need to
   flip back to affirmative claims — precisely scoped to what's
   actually implemented per platform, not restated wholesale.

## Sizing

This is new-subsystem work, not a bug fix — it changes how the
browsing surface is rendered (iframe → managed native webviews) and
adds a persistent identity/lifecycle model that doesn't exist today.
It's a multi-day effort for a macOS-only, persistent-profile-only
first slice; the ephemeral-wipe gap and Windows/Linux parity are
follow-on work with their own open questions above. It directly
conflicts with this repo's current stated posture ("preserve the
validated boundary without expanding architecture" —
`metadata/systems-builder-lifecycle.json`), which is why this is
written as a scoping document rather than a plan to execute.

## Recommendation

Don't start this yet. If/when it's prioritized, the honest smallest
useful slice is: macOS-only, persistent profiles only (Research/
Shopping/Medical/Financial), using `data_store_identifier` with a
stored-per-profile UUID, explicitly *not* claiming ephemeral-profile
isolation until the upstream delete API ships or a deliberate decision
is made to work around its absence. That slice is real, verifiable,
and doesn't require betting on unreleased upstream code.
