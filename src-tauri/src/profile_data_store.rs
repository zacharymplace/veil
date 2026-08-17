use rand::RngExt;
use tauri::AppHandle;

use crate::db;

/// Profiles whose cookies/storage are meant to survive an app restart
/// (mirrors PROFILE_POLICIES[profile].cookiesPersist in
/// src/browser/profiles/profiles.ts -- currently just "shopping").
/// Everything else gets a fresh data store identifier every time it's
/// opened and that store is deleted when the webview closes.
pub fn is_persistent_profile(profile: &str) -> bool {
    profile == "shopping"
}

pub fn encode_id(id: &[u8; 16]) -> String {
    id.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn decode_id(hex: &str) -> Result<[u8; 16], String> {
    if hex.len() != 32 {
        return Err("Stored data store identifier has an unexpected length.".to_string());
    }

    let mut id = [0u8; 16];

    for (index, chunk) in hex.as_bytes().chunks(2).enumerate() {
        let byte_str = std::str::from_utf8(chunk).map_err(|error| error.to_string())?;
        id[index] = u8::from_str_radix(byte_str, 16).map_err(|error| error.to_string())?;
    }

    Ok(id)
}

fn random_id() -> [u8; 16] {
    let mut id = [0u8; 16];
    rand::rng().fill(&mut id);
    id
}

/// Returns the stored identifier for a persistent profile, generating and
/// storing one on first use. Only call for profiles where
/// is_persistent_profile is true.
pub fn get_or_create_persistent_data_store_id(
    app: &AppHandle,
    profile: &str,
) -> Result<[u8; 16], String> {
    if let Some(hex) = db::get_profile_data_store_id(app, profile)? {
        return decode_id(&hex);
    }

    let id = random_id();
    db::set_profile_data_store_id(app, profile, &encode_id(&id))?;
    Ok(id)
}

/// A fresh identifier for an ephemeral profile's session. Not persisted
/// anywhere -- the caller is responsible for deleting the underlying data
/// store (remove_data_store) when the webview using it closes.
pub fn new_ephemeral_data_store_id() -> [u8; 16] {
    random_id()
}

#[cfg(any(target_os = "macos", target_os = "ios"))]
pub fn remove_data_store_blocking(app: &AppHandle, id: [u8; 16]) -> Result<(), String> {
    use std::sync::mpsc::channel;
    use wry::WebViewExtDarwin;

    let (tx, rx) = channel();

    app.run_on_main_thread(move || {
        <wry::WebView as WebViewExtDarwin>::remove_data_store(&id, move |result| {
            let _ = tx.send(result.map_err(|error| error.to_string()));
        });
    })
    .map_err(|error| error.to_string())?;

    rx.recv().map_err(|error| error.to_string())?
}

#[cfg(not(any(target_os = "macos", target_os = "ios")))]
pub fn remove_data_store_blocking(_app: &AppHandle, _id: [u8; 16]) -> Result<(), String> {
    // data_store_identifier itself is macOS/iOS-only (see
    // docs/recommendations/SQLCIPHER_KEYCHAIN_SCOPE.md's capability
    // matrix), so there is nothing to remove on other platforms.
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{decode_id, encode_id, is_persistent_profile, random_id};

    #[test]
    fn shopping_is_persistent() {
        assert!(is_persistent_profile("shopping"));
    }

    #[test]
    fn other_profiles_are_ephemeral() {
        for profile in ["temporary", "research", "medical", "financial", "adult"] {
            assert!(!is_persistent_profile(profile));
        }
    }

    #[test]
    fn id_round_trips_through_hex() {
        let id = random_id();
        let encoded = encode_id(&id);
        assert_eq!(encoded.len(), 32);
        assert_eq!(decode_id(&encoded).unwrap(), id);
    }

    #[test]
    fn decode_rejects_wrong_length() {
        assert!(decode_id("abcd").is_err());
    }

    #[test]
    fn random_ids_are_not_all_zero() {
        let id = random_id();
        assert!(id.iter().any(|byte| *byte != 0));
    }
}
