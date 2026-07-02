# Veil Case Study

## One-line Summary

Veil is a local-first private browsing vault prototype that explores how to make sensitive web browsing safer through session isolation, strict permissions, download blocking, SQLite persistence, and local audit visibility.

## Problem

Private browsing modes are usually shallow. They hide some local history, but they do not give users a durable operating model for:

- separating browsing contexts
- controlling permissions
- blocking risky downloads
- auditing privacy decisions
- backing up local data
- understanding what the browser did on their behalf

Veil treats private browsing as a system design problem rather than a cosmetic browser mode.

## Product Boundary

Veil does not host, scrape, download, recommend, or distribute content.

The product is a privacy and safety utility, not a content platform.

## What Was Built

### Veil Core v1

- Tauri desktop shell
- React/TypeScript UI
- Rust command layer
- SQLite persistence
- JSON import/export
- encrypted export/import prototype
- audit console
- release documentation
- smoke and contract tests

### Browser Engine v0.5

- safe URL normalization
- policy-gated navigation
- navigation history
- permission decision flow
- download decision flow
- session cleanup hooks

### Session Isolation v0.6

- per-session isolation scopes
- profile-based namespace model
- history, cookie, cache, and storage namespace separation
- cleanup behavior by profile

### Permission Manager v0.7

- per-session permission registry
- camera, microphone, location, and clipboard decisions
- prompt-first default posture
- audit-backed permission records

### Download Guard v0.8

- block-by-default download policy
- dangerous extension detection
- file risk classification
- per-session download records
- audit trail

### Audit Console v0.9

- event filtering
- event counts by type
- high-signal event summaries
- local export preview
- clear and refresh actions

## Architecture

Veil is organized around engines rather than pages:

- Browser Engine
- Vault Engine
- Policy Engine
- Backup Engine
- Security Engine
- Audit Console

The UI renders state. The engines own behavior.

## Technical Stack

- Tauri
- Rust
- React
- TypeScript
- SQLite
- AES-GCM prototype export encryption
- Local JSON backup format

## Verification

The release includes:

- TypeScript checks
- Rust tests
- policy smoke test
- core diagnostics test
- browser engine smoke test
- session isolation smoke test
- permission manager smoke test
- download guard smoke test
- audit console smoke test
- SQLite import/export contract test

## Release State

- `veil-core-v1`
- `veil-v1.0.0`

All checks pass at release freeze.

## Key Design Decisions

### Local-first by default

No accounts, analytics, cloud sync, or remote telemetry.

### Block before allow

Permissions and downloads are modeled as explicit decisions instead of passive browser defaults.

### Auditability

Every meaningful browser safety decision should be visible to the user.

### Isolation before WebView

The system models session isolation, permission decisions, and download blocking before binding to a live browser runtime.

## What This Demonstrates

This project demonstrates:

- desktop app architecture
- privacy-first product design
- Rust/TypeScript integration
- local persistence with SQLite
- safety-oriented browser controls
- testable systems thinking
- disciplined release management

## Next Work

The next release should focus on one narrow goal:

Bind the existing Browser Engine to a live WebView while preserving the existing policies:

- HTTPS-only navigation
- download blocking
- permission prompts
- audit logging
- session isolation boundaries

