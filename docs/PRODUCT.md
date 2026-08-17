# Veil

Veil is a local-first privacy browser and encrypted personal vault for adults.

## Mission

Give users control over private browsing, bookmarks, and sensitive web research without hosting, scraping, downloading, recommending, or distributing content.

## Hard Boundaries

Veil does not:
- host content
- scrape sites
- download media
- mirror websites
- bypass paywalls
- bypass age gates
- optimize for engagement
- include social features
- collect analytics

## MVP

- Private browser shell, with real per-profile cookie/storage isolation (macOS/iOS)
- Encrypted bookmark vault (SQLCipher, at rest)
- Privacy dashboard
- Session/profile controls
- Per-category local data wipe (vault, audit trail, permission/download records)

Not yet built, despite being listed here in earlier drafts of this
doc: panic close, a visible session timer, and auto-lock-on-idle (the
idle check exists in code but nothing calls it). Tracked honestly in
`src/features/settings/SettingsView.tsx` rather than silently dropped
from this list.
