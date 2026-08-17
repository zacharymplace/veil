pub mod encryption;
pub mod webview;

use chrono::Utc;
use tauri::AppHandle;
use uuid::Uuid;

use crate::db;
use crate::storage::{
    audit::AuditEvent, download::DownloadRecord, permission::PermissionRecord, VaultBookmark,
};

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
pub fn permission_list_records(app: AppHandle) -> Result<Vec<PermissionRecord>, String> {
    db::list_permission_records(&app)
}

#[tauri::command]
pub fn permission_append_record(
    app: AppHandle,
    session_id: String,
    profile: String,
    permission: String,
    status: String,
    reason: String,
) -> Result<PermissionRecord, String> {
    let record = PermissionRecord {
        id: Uuid::new_v4().to_string(),
        session_id,
        profile,
        permission,
        status,
        reason,
        at: Utc::now().to_rfc3339(),
    };

    db::insert_permission_record(&app, &record)?;
    Ok(record)
}

#[tauri::command]
pub fn permission_clear_records(app: AppHandle) -> Result<(), String> {
    db::clear_permission_records(&app)
}

#[tauri::command]
pub fn download_list_records(app: AppHandle) -> Result<Vec<DownloadRecord>, String> {
    db::list_download_records(&app)
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn download_append_record(
    app: AppHandle,
    session_id: String,
    profile: String,
    url: String,
    filename: String,
    extension: String,
    risk: String,
    status: String,
    reason: String,
) -> Result<DownloadRecord, String> {
    let record = DownloadRecord {
        id: Uuid::new_v4().to_string(),
        session_id,
        profile,
        url,
        filename,
        extension,
        risk,
        status,
        reason,
        at: Utc::now().to_rfc3339(),
    };

    db::insert_download_record(&app, &record)?;
    Ok(record)
}

#[tauri::command]
pub fn download_clear_records(app: AppHandle) -> Result<(), String> {
    db::clear_download_records(&app)
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
