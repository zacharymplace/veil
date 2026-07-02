use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngExt;
use base64::{engine::general_purpose, Engine as _};

use crate::db;

#[tauri::command]
pub fn db_encryption_readiness() -> Result<serde_json::Value, String> {
    Ok(db::encryption_readiness())
}

#[tauri::command]
pub fn db_export_encrypted(app: tauri::AppHandle, passphrase: String) -> Result<String, String> {
    if passphrase.len() < 12 {
        return Err("Passphrase must be at least 12 characters.".to_string());
    }

    let plaintext = db::export_database(&app)?;

    let mut key_bytes = [0u8; 32];
    let passphrase_bytes = passphrase.as_bytes();

    for (index, byte) in passphrase_bytes.iter().enumerate() {
        key_bytes[index % 32] ^= *byte;
    }

    let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|error| error.to_string())?;

    let mut nonce_bytes = [0u8; 12];
    rand::rng().fill(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|error| error.to_string())?;

    Ok(serde_json::json!({
        "version": 1,
        "kind": "veil.encrypted-export",
        "algorithm": "AES-256-GCM",
        "note": "Prototype passphrase-derived key. Replace with Argon2 before production.",
        "nonce": general_purpose::STANDARD.encode(nonce_bytes),
        "ciphertext": general_purpose::STANDARD.encode(ciphertext)
    })
    .to_string())
}

#[tauri::command]
pub fn db_import_encrypted(
    app: tauri::AppHandle,
    encrypted_json: String,
    passphrase: String,
) -> Result<serde_json::Value, String> {
    if passphrase.len() < 12 {
        return Err("Passphrase must be at least 12 characters.".to_string());
    }

    let parsed: serde_json::Value =
        serde_json::from_str(&encrypted_json).map_err(|error| error.to_string())?;

    let nonce_b64 = parsed["nonce"]
        .as_str()
        .ok_or_else(|| "Missing nonce.".to_string())?;

    let ciphertext_b64 = parsed["ciphertext"]
        .as_str()
        .ok_or_else(|| "Missing ciphertext.".to_string())?;

    let nonce_bytes = general_purpose::STANDARD
        .decode(nonce_b64)
        .map_err(|error| error.to_string())?;

    let ciphertext = general_purpose::STANDARD
        .decode(ciphertext_b64)
        .map_err(|error| error.to_string())?;

    let mut key_bytes = [0u8; 32];
    let passphrase_bytes = passphrase.as_bytes();

    for (index, byte) in passphrase_bytes.iter().enumerate() {
        key_bytes[index % 32] ^= *byte;
    }

    let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|error| error.to_string())?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "Could not decrypt export with supplied passphrase.".to_string())?;

    let raw = String::from_utf8(plaintext).map_err(|error| error.to_string())?;
    db::import_database_json(&app, raw)
}
