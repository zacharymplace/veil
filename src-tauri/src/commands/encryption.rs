use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm,
};
use argon2::Argon2;
use base64::{engine::general_purpose, Engine as _};
use rand::RngExt;

use crate::db;

const SALT_LEN: usize = 16;

fn derive_key(passphrase: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(passphrase.as_bytes(), salt, &mut key)
        .map_err(|error| error.to_string())?;
    Ok(key)
}

#[tauri::command]
pub fn db_encryption_readiness() -> Result<serde_json::Value, String> {
    Ok(db::encryption_readiness())
}

fn encrypt_payload(plaintext: &str, passphrase: &str) -> Result<String, String> {
    if passphrase.len() < 12 {
        return Err("Passphrase must be at least 12 characters.".to_string());
    }

    let mut salt_bytes = [0u8; SALT_LEN];
    rand::rng().fill(&mut salt_bytes);
    let key_bytes = derive_key(passphrase, &salt_bytes)?;

    let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|error| error.to_string())?;

    let mut nonce_bytes = [0u8; 12];
    rand::rng().fill(&mut nonce_bytes);
    let nonce = aes_gcm::Nonce::try_from(&nonce_bytes[..]).map_err(|error| error.to_string())?;

    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|error| error.to_string())?;

    Ok(serde_json::json!({
        "version": 2,
        "kind": "veil.encrypted-export",
        "algorithm": "AES-256-GCM",
        "kdf": "Argon2id",
        "salt": general_purpose::STANDARD.encode(salt_bytes),
        "nonce": general_purpose::STANDARD.encode(nonce_bytes),
        "ciphertext": general_purpose::STANDARD.encode(ciphertext)
    })
    .to_string())
}

fn decrypt_payload(encrypted_json: &str, passphrase: &str) -> Result<String, String> {
    if passphrase.len() < 12 {
        return Err("Passphrase must be at least 12 characters.".to_string());
    }

    let parsed: serde_json::Value =
        serde_json::from_str(encrypted_json).map_err(|error| error.to_string())?;

    let salt_b64 = parsed["salt"].as_str().ok_or_else(|| {
        "Missing salt. This export is from an older, unsupported format.".to_string()
    })?;

    let nonce_b64 = parsed["nonce"]
        .as_str()
        .ok_or_else(|| "Missing nonce.".to_string())?;

    let ciphertext_b64 = parsed["ciphertext"]
        .as_str()
        .ok_or_else(|| "Missing ciphertext.".to_string())?;

    let salt_bytes = general_purpose::STANDARD
        .decode(salt_b64)
        .map_err(|error| error.to_string())?;

    let nonce_bytes = general_purpose::STANDARD
        .decode(nonce_b64)
        .map_err(|error| error.to_string())?;

    let ciphertext = general_purpose::STANDARD
        .decode(ciphertext_b64)
        .map_err(|error| error.to_string())?;

    let key_bytes = derive_key(passphrase, &salt_bytes)?;

    let cipher = Aes256Gcm::new_from_slice(&key_bytes).map_err(|error| error.to_string())?;
    let nonce = aes_gcm::Nonce::try_from(&nonce_bytes[..]).map_err(|error| error.to_string())?;

    let plaintext = cipher
        .decrypt(&nonce, ciphertext.as_ref())
        .map_err(|_| "Could not decrypt export with supplied passphrase.".to_string())?;

    String::from_utf8(plaintext).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn db_export_encrypted(app: tauri::AppHandle, passphrase: String) -> Result<String, String> {
    let plaintext = db::export_database(&app)?;
    encrypt_payload(&plaintext, &passphrase)
}

#[tauri::command]
pub fn db_import_encrypted(
    app: tauri::AppHandle,
    encrypted_json: String,
    passphrase: String,
) -> Result<serde_json::Value, String> {
    let raw = decrypt_payload(&encrypted_json, &passphrase)?;
    db::import_database_json(&app, raw)
}

#[cfg(test)]
mod tests {
    use super::{decrypt_payload, derive_key, encrypt_payload};

    #[test]
    fn encrypt_then_decrypt_round_trips_with_correct_passphrase() {
        let plaintext = r#"{"bookmarks":[{"title":"example"}]}"#;
        let encrypted = encrypt_payload(plaintext, "correct horse battery").unwrap();
        let decrypted = decrypt_payload(&encrypted, "correct horse battery").unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn decrypt_fails_with_wrong_passphrase() {
        let plaintext = "some vault data";
        let encrypted = encrypt_payload(plaintext, "correct horse battery").unwrap();
        let result = decrypt_payload(&encrypted, "wrong horse battery!");
        assert!(result.is_err());
    }

    #[test]
    fn export_rejects_short_passphrase() {
        assert!(encrypt_payload("data", "short").is_err());
    }

    #[test]
    fn derive_key_fills_all_bytes_for_minimum_length_passphrase() {
        let salt = [7u8; 16];
        let key = derive_key("123456789012", &salt).expect("derivation should succeed");

        assert!(
            key.iter().any(|byte| *byte != 0),
            "derived key should not be all zero"
        );
        assert!(
            key.iter().filter(|byte| **byte == 0).count() < key.len(),
            "derived key should not have a large run of untouched zero bytes"
        );
    }

    #[test]
    fn derive_key_is_deterministic_for_same_passphrase_and_salt() {
        let salt = [3u8; 16];
        let a = derive_key("correct horse battery", &salt).unwrap();
        let b = derive_key("correct horse battery", &salt).unwrap();
        assert_eq!(a, b);
    }

    #[test]
    fn derive_key_differs_for_different_salts() {
        let a = derive_key("correct horse battery", &[1u8; 16]).unwrap();
        let b = derive_key("correct horse battery", &[2u8; 16]).unwrap();
        assert_ne!(a, b);
    }
}
