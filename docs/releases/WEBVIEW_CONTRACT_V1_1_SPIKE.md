# WebView Contract v1.1 Spike

## Status

Spike only. No live WebView binding yet.

## Goal

Create the contract layer that a live WebView must obey before any runtime binding begins.

## Contract

- HTTPS navigation allowed
- HTTP navigation blocked
- Downloads blocked
- Permissions prompt
- Existing Browser Engine remains the source of policy truth

## Boundary

This does not add content features, scraping, media downloading, hosting, recommendation feeds, or cloud sync.

## Next

Bind this contract to a minimal Tauri WebView surface.
