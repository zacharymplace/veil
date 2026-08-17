pub mod audit;
pub mod download;
pub mod permission;

use serde::{Deserialize, Serialize};

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
