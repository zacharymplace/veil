# Veil Core v1.0

Veil Core defines the stable internal architecture for the app.

## Engines

### Browser Engine
Owns session profiles, navigation preparation, permission decisions, download policy, and future WebView isolation.

### Vault Engine
Owns bookmarks, collections, search, SQLite persistence, and future encrypted storage.

### Policy Engine
Owns allow/block/prompt decisions, audit events, and privacy reports.

### Backup Engine
Owns JSON export, file export, import, and future encrypted restore.

### Security Engine
Owns encryption readiness, SQLCipher gate, keychain planning, and threat model boundaries.

## Rule

UI renders state. Engines own behavior.
