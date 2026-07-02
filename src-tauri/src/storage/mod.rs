pub mod audit;

use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultBookmark {
    pub id: String,
    pub title: String,
    pub url: String,
    pub tags: Vec<String>,
    pub notes: Option<String>,
    pub collection_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

fn vault_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("vault");

    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;

    Ok(dir.join("bookmarks.json"))
}

pub fn read_bookmarks(app: &AppHandle) -> Result<Vec<VaultBookmark>, String> {
    let path = vault_path(app)?;

    if !path.exists() {
        return Ok(vec![]);
    }

    let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&raw).map_err(|error| error.to_string())
}

pub fn write_bookmarks(app: &AppHandle, bookmarks: &[VaultBookmark]) -> Result<(), String> {
    let path = vault_path(app)?;
    let raw = serde_json::to_string_pretty(bookmarks).map_err(|error| error.to_string())?;
    fs::write(path, raw).map_err(|error| error.to_string())
}
