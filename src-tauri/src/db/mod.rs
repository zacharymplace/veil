use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::audit::AuditEvent;
use crate::storage::download::DownloadRecord;
use crate::storage::permission::PermissionRecord;
use crate::storage::VaultBookmark;

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    std::fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir.join("veil.sqlite3"))
}

fn open(app: &AppHandle) -> Result<Connection, String> {
    let conn = Connection::open(db_path(app)?).map_err(|error| error.to_string())?;
    migrate(&conn)?;
    Ok(conn)
}

fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            tags_json TEXT NOT NULL,
            notes TEXT,
            collection_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY,
            at TEXT NOT NULL,
            event_type TEXT NOT NULL,
            summary TEXT NOT NULL,
            metadata_json TEXT
        );

        CREATE TABLE IF NOT EXISTS permission_records (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            profile TEXT NOT NULL,
            permission TEXT NOT NULL,
            status TEXT NOT NULL,
            reason TEXT NOT NULL,
            at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS download_records (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            profile TEXT NOT NULL,
            url TEXT NOT NULL,
            filename TEXT NOT NULL,
            extension TEXT NOT NULL,
            risk TEXT NOT NULL,
            status TEXT NOT NULL,
            reason TEXT NOT NULL,
            at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at
        ON bookmarks(created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_audit_events_at
        ON audit_events(at DESC);

        CREATE INDEX IF NOT EXISTS idx_permission_records_at
        ON permission_records(at DESC);

        CREATE INDEX IF NOT EXISTS idx_download_records_at
        ON download_records(at DESC);
        ",
    )
    .map_err(|error| error.to_string())
}

pub fn list_bookmarks(app: &AppHandle) -> Result<Vec<VaultBookmark>, String> {
    let conn = open(app)?;

    let mut stmt = conn
        .prepare(
            "
            SELECT id, title, url, tags_json, notes, collection_id, created_at, updated_at
            FROM bookmarks
            ORDER BY created_at DESC
            ",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let tags_json: String = row.get(3)?;
            let tags = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(VaultBookmark {
                id: row.get(0)?,
                title: row.get(1)?,
                url: row.get(2)?,
                tags,
                notes: row.get(4)?,
                collection_id: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn insert_bookmark(app: &AppHandle, bookmark: &VaultBookmark) -> Result<(), String> {
    let conn = open(app)?;

    conn.execute(
        "
        INSERT INTO bookmarks (
            id, title, url, tags_json, notes, collection_id, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        ",
        params![
            bookmark.id,
            bookmark.title,
            bookmark.url,
            serde_json::to_string(&bookmark.tags).map_err(|error| error.to_string())?,
            bookmark.notes,
            bookmark.collection_id,
            bookmark.created_at,
            bookmark.updated_at
        ],
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn delete_bookmark(app: &AppHandle, id: &str) -> Result<(), String> {
    let conn = open(app)?;
    conn.execute("DELETE FROM bookmarks WHERE id = ?1", params![id])
        .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn wipe_bookmarks(app: &AppHandle) -> Result<(), String> {
    let conn = open(app)?;
    conn.execute("DELETE FROM bookmarks", [])
        .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn list_audit_events(app: &AppHandle) -> Result<Vec<AuditEvent>, String> {
    let conn = open(app)?;

    let mut stmt = conn
        .prepare(
            "
            SELECT id, at, event_type, summary, metadata_json
            FROM audit_events
            ORDER BY at DESC
            LIMIT 500
            ",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(AuditEvent {
                id: row.get(0)?,
                at: row.get(1)?,
                event_type: row.get(2)?,
                summary: row.get(3)?,
                metadata_json: row.get(4)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn insert_audit_event(app: &AppHandle, event: &AuditEvent) -> Result<(), String> {
    let conn = open(app)?;

    conn.execute(
        "
        INSERT INTO audit_events (
            id, at, event_type, summary, metadata_json
        ) VALUES (?1, ?2, ?3, ?4, ?5)
        ",
        params![
            event.id,
            event.at,
            event.event_type,
            event.summary,
            event.metadata_json
        ],
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn clear_audit_events(app: &AppHandle) -> Result<(), String> {
    let conn = open(app)?;
    conn.execute("DELETE FROM audit_events", [])
        .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn list_permission_records(app: &AppHandle) -> Result<Vec<PermissionRecord>, String> {
    let conn = open(app)?;

    let mut stmt = conn
        .prepare(
            "
            SELECT id, session_id, profile, permission, status, reason, at
            FROM permission_records
            ORDER BY at DESC
            LIMIT 500
            ",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(PermissionRecord {
                id: row.get(0)?,
                session_id: row.get(1)?,
                profile: row.get(2)?,
                permission: row.get(3)?,
                status: row.get(4)?,
                reason: row.get(5)?,
                at: row.get(6)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn insert_permission_record(app: &AppHandle, record: &PermissionRecord) -> Result<(), String> {
    let conn = open(app)?;

    conn.execute(
        "
        INSERT INTO permission_records (
            id, session_id, profile, permission, status, reason, at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        ",
        params![
            record.id,
            record.session_id,
            record.profile,
            record.permission,
            record.status,
            record.reason,
            record.at
        ],
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn clear_permission_records(app: &AppHandle) -> Result<(), String> {
    let conn = open(app)?;
    conn.execute("DELETE FROM permission_records", [])
        .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn list_download_records(app: &AppHandle) -> Result<Vec<DownloadRecord>, String> {
    let conn = open(app)?;

    let mut stmt = conn
        .prepare(
            "
            SELECT id, session_id, profile, url, filename, extension, risk, status, reason, at
            FROM download_records
            ORDER BY at DESC
            LIMIT 500
            ",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(DownloadRecord {
                id: row.get(0)?,
                session_id: row.get(1)?,
                profile: row.get(2)?,
                url: row.get(3)?,
                filename: row.get(4)?,
                extension: row.get(5)?,
                risk: row.get(6)?,
                status: row.get(7)?,
                reason: row.get(8)?,
                at: row.get(9)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn insert_download_record(app: &AppHandle, record: &DownloadRecord) -> Result<(), String> {
    let conn = open(app)?;

    conn.execute(
        "
        INSERT INTO download_records (
            id, session_id, profile, url, filename, extension, risk, status, reason, at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        ",
        params![
            record.id,
            record.session_id,
            record.profile,
            record.url,
            record.filename,
            record.extension,
            record.risk,
            record.status,
            record.reason,
            record.at
        ],
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn clear_download_records(app: &AppHandle) -> Result<(), String> {
    let conn = open(app)?;
    conn.execute("DELETE FROM download_records", [])
        .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn database_stats(app: &AppHandle) -> Result<serde_json::Value, String> {
    let conn = open(app)?;

    let bookmarks: i64 = conn
        .query_row("SELECT COUNT(*) FROM bookmarks", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    let audit_events: i64 = conn
        .query_row("SELECT COUNT(*) FROM audit_events", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    let permission_records: i64 = conn
        .query_row("SELECT COUNT(*) FROM permission_records", [], |row| {
            row.get(0)
        })
        .map_err(|error| error.to_string())?;

    let download_records: i64 = conn
        .query_row("SELECT COUNT(*) FROM download_records", [], |row| {
            row.get(0)
        })
        .map_err(|error| error.to_string())?;

    Ok(serde_json::json!({
        "database": "veil.sqlite3",
        "bookmarks": bookmarks,
        "auditEvents": audit_events,
        "permissionRecords": permission_records,
        "downloadRecords": download_records
    }))
}

pub fn export_database(app: &AppHandle) -> Result<String, String> {
    let bookmarks = list_bookmarks(app)?;
    let audit_events = list_audit_events(app)?;
    let permission_records = list_permission_records(app)?;
    let download_records = list_download_records(app)?;

    let export = serde_json::json!({
        "exportedAt": chrono::Utc::now().to_rfc3339(),
        "database": "veil.sqlite3",
        "bookmarks": bookmarks,
        "auditEvents": audit_events,
        "permissionRecords": permission_records,
        "downloadRecords": download_records
    });

    Ok(serde_json::to_string_pretty(&export).map_err(|error| error.to_string())?)
}

pub fn export_database_to_file(app: &AppHandle) -> Result<String, String> {
    let export = export_database(app)?;

    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("exports");

    std::fs::create_dir_all(&dir).map_err(|error| error.to_string())?;

    let filename = format!(
        "veil-export-{}.json",
        chrono::Utc::now().format("%Y%m%dT%H%M%SZ")
    );
    let path = dir.join(filename);

    std::fs::write(&path, export).map_err(|error| error.to_string())?;

    Ok(path.to_string_lossy().to_string())
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct DatabaseImport {
    bookmarks: Vec<VaultBookmark>,
    audit_events: Vec<AuditEvent>,
    #[serde(default)]
    permission_records: Vec<PermissionRecord>,
    #[serde(default)]
    download_records: Vec<DownloadRecord>,
}

pub fn import_database_json(app: &AppHandle, raw: String) -> Result<serde_json::Value, String> {
    let parsed: DatabaseImport = serde_json::from_str(&raw).map_err(|error| error.to_string())?;
    let conn = open(app)?;

    let tx = conn
        .unchecked_transaction()
        .map_err(|error| error.to_string())?;

    for bookmark in &parsed.bookmarks {
        tx.execute(
            "
            INSERT OR REPLACE INTO bookmarks (
                id, title, url, tags_json, notes, collection_id, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            ",
            params![
                bookmark.id,
                bookmark.title,
                bookmark.url,
                serde_json::to_string(&bookmark.tags).map_err(|error| error.to_string())?,
                bookmark.notes,
                bookmark.collection_id,
                bookmark.created_at,
                bookmark.updated_at
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    for event in &parsed.audit_events {
        tx.execute(
            "
            INSERT OR REPLACE INTO audit_events (
                id, at, event_type, summary, metadata_json
            ) VALUES (?1, ?2, ?3, ?4, ?5)
            ",
            params![
                event.id,
                event.at,
                event.event_type,
                event.summary,
                event.metadata_json
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    for record in &parsed.permission_records {
        tx.execute(
            "
            INSERT OR REPLACE INTO permission_records (
                id, session_id, profile, permission, status, reason, at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ",
            params![
                record.id,
                record.session_id,
                record.profile,
                record.permission,
                record.status,
                record.reason,
                record.at
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    for record in &parsed.download_records {
        tx.execute(
            "
            INSERT OR REPLACE INTO download_records (
                id, session_id, profile, url, filename, extension, risk, status, reason, at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            ",
            params![
                record.id,
                record.session_id,
                record.profile,
                record.url,
                record.filename,
                record.extension,
                record.risk,
                record.status,
                record.reason,
                record.at
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    tx.commit().map_err(|error| error.to_string())?;

    Ok(serde_json::json!({
        "importedBookmarks": parsed.bookmarks.len(),
        "importedAuditEvents": parsed.audit_events.len(),
        "importedPermissionRecords": parsed.permission_records.len(),
        "importedDownloadRecords": parsed.download_records.len()
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn migrate_test(conn: &Connection) {
        migrate(conn).expect("migration should pass");
    }

    #[test]
    fn sqlite_export_import_roundtrip_contract() {
        let conn = Connection::open_in_memory().expect("in-memory sqlite should open");
        migrate_test(&conn);

        conn.execute(
            "
            INSERT INTO bookmarks (
                id, title, url, tags_json, notes, collection_id, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
            ",
            params![
                "bookmark-1",
                "Example",
                "https://example.com",
                "[\"test\"]",
                "contract bookmark",
                Option::<String>::None,
                "2026-01-01T00:00:00Z",
                "2026-01-01T00:00:00Z"
            ],
        )
        .expect("bookmark insert should pass");

        conn.execute(
            "
            INSERT INTO audit_events (
                id, at, event_type, summary, metadata_json
            ) VALUES (?1, ?2, ?3, ?4, ?5)
            ",
            params![
                "audit-1",
                "2026-01-01T00:00:00Z",
                "contract.test",
                "Contract event",
                "{\"source\":\"test\"}"
            ],
        )
        .expect("audit insert should pass");

        let bookmarks_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM bookmarks", [], |row| row.get(0))
            .expect("bookmark count should pass");

        let audit_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM audit_events", [], |row| row.get(0))
            .expect("audit count should pass");

        assert_eq!(bookmarks_count, 1);
        assert_eq!(audit_count, 1);

        conn.execute("DELETE FROM bookmarks", [])
            .expect("bookmark wipe should pass");
        conn.execute("DELETE FROM audit_events", [])
            .expect("audit wipe should pass");

        let wiped_bookmarks: i64 = conn
            .query_row("SELECT COUNT(*) FROM bookmarks", [], |row| row.get(0))
            .expect("bookmark recount should pass");

        let wiped_audit: i64 = conn
            .query_row("SELECT COUNT(*) FROM audit_events", [], |row| row.get(0))
            .expect("audit recount should pass");

        assert_eq!(wiped_bookmarks, 0);
        assert_eq!(wiped_audit, 0);
    }

    #[test]
    fn permission_and_download_records_persist_and_clear() {
        let conn = Connection::open_in_memory().expect("in-memory sqlite should open");
        migrate_test(&conn);

        conn.execute(
            "
            INSERT INTO permission_records (
                id, session_id, profile, permission, status, reason, at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
            ",
            params![
                "permission-1",
                "session-1",
                "temporary",
                "camera",
                "prompt",
                "camera requires explicit approval.",
                "2026-01-01T00:00:00Z"
            ],
        )
        .expect("permission record insert should pass");

        conn.execute(
            "
            INSERT INTO download_records (
                id, session_id, profile, url, filename, extension, risk, status, reason, at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            ",
            params![
                "download-1",
                "session-1",
                "temporary",
                "https://example.com/file.zip",
                "file.zip",
                "zip",
                "high",
                "blocked",
                "Blocked by default. .zip is a high-risk file type.",
                "2026-01-01T00:00:00Z"
            ],
        )
        .expect("download record insert should pass");

        let permission_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM permission_records", [], |row| {
                row.get(0)
            })
            .expect("permission count should pass");

        let download_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM download_records", [], |row| {
                row.get(0)
            })
            .expect("download count should pass");

        assert_eq!(permission_count, 1);
        assert_eq!(download_count, 1);

        conn.execute("DELETE FROM permission_records", [])
            .expect("permission wipe should pass");
        conn.execute("DELETE FROM download_records", [])
            .expect("download wipe should pass");

        let wiped_permissions: i64 = conn
            .query_row("SELECT COUNT(*) FROM permission_records", [], |row| {
                row.get(0)
            })
            .expect("permission recount should pass");

        let wiped_downloads: i64 = conn
            .query_row("SELECT COUNT(*) FROM download_records", [], |row| {
                row.get(0)
            })
            .expect("download recount should pass");

        assert_eq!(wiped_permissions, 0);
        assert_eq!(wiped_downloads, 0);
    }
}

pub fn encryption_readiness() -> serde_json::Value {
    serde_json::json!({
        "encryptedExport": true,
        "keyDerivation": "Argon2id",
        "sqlcipher": "planned",
        "keychain": "planned",
        "secureDelete": "planned",
        "currentDatabaseEncryption": false
    })
}
