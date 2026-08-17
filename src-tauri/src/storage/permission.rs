use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionRecord {
    pub id: String,
    pub session_id: String,
    pub profile: String,
    pub permission: String,
    pub status: String,
    pub reason: String,
    pub at: String,
}
