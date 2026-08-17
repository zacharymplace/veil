use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadRecord {
    pub id: String,
    pub session_id: String,
    pub profile: String,
    pub url: String,
    pub filename: String,
    pub extension: String,
    pub risk: String,
    pub status: String,
    pub reason: String,
    pub at: String,
}
