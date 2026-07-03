# WebView Next Recommendations

## Current State

Live WebView binding is visible and working.

Verified manually:

- WebView nav item is visible.
- HTTPS navigation reaches ready state.
- Example page renders in sandboxed frame.
- Downloads remain blocked.
- Sandbox remains active.

## Recommendation

Do not expand browsing capabilities yet.

Next build should improve clarity and observability around the WebView decision path.

## Priority 1 — Status Clarity

Improve the status row so policy outcomes are readable at a glance.

Current issue:

- Status, downloads, and sandbox text can run together.

Target:

- Ready / Blocked state is visually distinct.
- Downloads blocked is visually distinct.
- Sandbox active is visually distinct.
- Contract reason remains visible.

## Priority 2 — Policy Reason Visibility

Expose the exact contract reason near the WebView.

Target:

- HTTPS shows why navigation was allowed.
- HTTP shows why navigation was blocked.
- User can understand that policy decided the outcome, not the iframe.

## Priority 3 — WebView Observability

Add a lightweight decision log next to or below the WebView.

Target entries:

- requested URL
- normalized target URL
- allowed or blocked
- reason
- downloads allowed: false
- sandbox active: true

## Do Not Do Yet

- Do not add scraping.
- Do not add media downloading.
- Do not add cloud sync.
- Do not add recommendation feeds.
- Do not claim production-grade browser security.
- Do not widen permissions beyond prompt policy.

## Next Build

Add WebView policy decision badges and a local decision log.
