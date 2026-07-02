use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEvent {
    pub id: String,
    pub at: String,
    pub event_type: String,
    pub summary: String,
    pub metadata_json: Option<String>,
}

fn audit_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("audit");

    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;

    Ok(dir.join("events.json"))
}

pub fn read_audit_events(app: &AppHandle) -> Result<Vec<AuditEvent>, String> {
    let path = audit_path(app)?;

    if !path.exists() {
        return Ok(vec![]);
    }

    let raw = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&raw).map_err(|error| error.to_string())
}

pub fn write_audit_events(app: &AppHandle, events: &[AuditEvent]) -> Result<(), String> {
    let path = audit_path(app)?;
    let raw = serde_json::to_string_pretty(events).map_err(|error| error.to_string())?;
    fs::write(path, raw).map_err(|error| error.to_string())
}
