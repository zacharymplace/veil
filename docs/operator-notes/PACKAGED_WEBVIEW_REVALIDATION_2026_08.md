# Packaged WebView Revalidation — 2026-08

## Status

Passed.

## Why this ran

The previous packaged-webview validation record was from commit
`3e44139`, before the v1.1.1 hardening pass (silent-failure fixes,
isolation-scope leak fix, Argon2id crypto change, dead-code removal).
`metadata/systems-builder-lifecycle.json` flagged it as needing a
re-run before being trusted as current evidence.

## Verified (human operator, packaged `.app`, macOS)

- App launches, adult gate renders, Browser and WebView surfaces
  render.
- `https://en.wikipedia.org` reached ready state and rendered real
  page content.
- `http://example.com` was blocked with the correct policy reason
  visible.
- Downloads-blocked and sandbox-active badges both correct in both
  states.
- Decision log recorded both the allowed and the blocked entries.
- No crash.

## Findings (non-blocking, both documented in the validation record)

1. `https://www.google.com` / `https://google.com` produced a
   **blank content area** despite a "ready" status. Traced this to
   Google's own anti-framing headers (`X-Frame-Options`/CSP
   `frame-ancestors`), which block embedding in an iframe from any
   origin — not a Veil defect. Confirmed the rendering pipeline
   itself works by loading Wikipedia instead, which rendered fine.
   Worth a small in-app note so this doesn't look like a bug during
   future manual passes.
2. The decision log showed duplicate "ready" entries for repeated/
   near-duplicate URLs — the same non-blocking issue already recorded
   in the prior validation pass at `3e44139`. Still not fixed.

## Verification

- `npm run validate:packaged-webview`
- Manual click-through of the packaged `.app` per
  `docs/operator-notes/WEBVIEW_MANUAL_UI_SMOKE.md`'s checklist.

## Next

Fix the decision-log deduplication (carried over twice now). Consider
the in-app "some sites can't be framed" note from finding 1.
