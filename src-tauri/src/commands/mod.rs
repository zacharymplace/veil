use chrono::Utc;
use tauri::AppHandle;
use uuid::Uuid;

use crate::storage::{read_bookmarks, write_bookmarks, VaultBookmark};

#[tauri::command]
pub fn vault_list_bookmarks(app: AppHandle) -> Result<Vec<VaultBookmark>, String> {
    read_bookmarks(&app)
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

    let mut bookmarks = read_bookmarks(&app)?;
    bookmarks.insert(0, bookmark.clone());
    write_bookmarks(&app, &bookmarks)?;

    Ok(bookmark)
}

#[tauri::command]
pub fn vault_remove_bookmark(app: AppHandle, id: String) -> Result<(), String> {
    let bookmarks = read_bookmarks(&app)?
        .into_iter()
        .filter(|bookmark| bookmark.id != id)
        .collect::<Vec<_>>();

    write_bookmarks(&app, &bookmarks)
}

#[tauri::command]
pub fn vault_wipe_bookmarks(app: AppHandle) -> Result<(), String> {
    write_bookmarks(&app, &[])
}
