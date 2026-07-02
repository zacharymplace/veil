use rusqlite::{params, Connection};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::storage::audit::AuditEvent;
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

        CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at
        ON bookmarks(created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_audit_events_at
        ON audit_events(at DESC);
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

pub fn database_stats(app: &AppHandle) -> Result<serde_json::Value, String> {
    let conn = open(app)?;

    let bookmarks: i64 = conn
        .query_row("SELECT COUNT(*) FROM bookmarks", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    let audit_events: i64 = conn
        .query_row("SELECT COUNT(*) FROM audit_events", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    Ok(serde_json::json!({
        "database": "veil.sqlite3",
        "bookmarks": bookmarks,
        "auditEvents": audit_events
    }))
}

pub fn export_database(app: &AppHandle) -> Result<String, String> {
    let conn = open(app)?;

    let bookmarks = list_bookmarks(app)?;
    let audit_events = list_audit_events(app)?;

    let export = serde_json::json!({
        "exportedAt": chrono::Utc::now().to_rfc3339(),
        "database": "veil.sqlite3",
        "bookmarks": bookmarks,
        "auditEvents": audit_events
    });

    Ok(serde_json::to_string_pretty(&export).map_err(|error| error.to_string())?)
}
