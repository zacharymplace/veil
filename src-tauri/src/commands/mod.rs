pub mod encryption;

use chrono::Utc;
use tauri::AppHandle;
use uuid::Uuid;

use crate::db;
use crate::storage::{audit::AuditEvent, VaultBookmark};

#[tauri::command]
pub fn vault_list_bookmarks(app: AppHandle) -> Result<Vec<VaultBookmark>, String> {
    db::list_bookmarks(&app)
}

#[tauri::command]
pub fn vault_save_bookmark(
    app: AppHandle,
    title: String,
    url: String,
    tags: Vec<String>,
    notes: Option<String>,
    collection_id: Option<String>,
) -> Result<VaultBookmark, String> {
    let now = Utc::now().to_rfc3339();

    let bookmark = VaultBookmark {
        id: Uuid::new_v4().to_string(),
        title,
        url,
        tags,
        notes,
        collection_id,
        created_at: now.clone(),
        updated_at: now,
    };

    db::insert_bookmark(&app, &bookmark)?;
    Ok(bookmark)
}

#[tauri::command]
pub fn vault_remove_bookmark(app: AppHandle, id: String) -> Result<(), String> {
    db::delete_bookmark(&app, &id)
}

#[tauri::command]
pub fn vault_wipe_bookmarks(app: AppHandle) -> Result<(), String> {
    db::wipe_bookmarks(&app)
}

#[tauri::command]
pub fn audit_list_events(app: AppHandle) -> Result<Vec<AuditEvent>, String> {
    db::list_audit_events(&app)
}

#[tauri::command]
pub fn audit_append_event(
    app: AppHandle,
    event_type: String,
    summary: String,
    metadata_json: Option<String>,
) -> Result<AuditEvent, String> {
    let event = AuditEvent {
        id: Uuid::new_v4().to_string(),
        at: Utc::now().to_rfc3339(),
        event_type,
        summary,
        metadata_json,
    };

    db::insert_audit_event(&app, &event)?;
    Ok(event)
}

#[tauri::command]
pub fn audit_clear_events(app: AppHandle) -> Result<(), String> {
    db::clear_audit_events(&app)
}

#[tauri::command]
pub fn db_stats(app: AppHandle) -> Result<serde_json::Value, String> {
    db::database_stats(&app)
}

#[tauri::command]
pub fn db_export_json(app: AppHandle) -> Result<String, String> {
    db::export_database(&app)
}


#[tauri::command]
pub fn db_export_file(app: AppHandle) -> Result<String, String> {
    db::export_database_to_file(&app)
}


#[tauri::command]
pub fn db_import_json(app: AppHandle, raw: String) -> Result<serde_json::Value, String> {
    db::import_database_json(&app, raw)
}
