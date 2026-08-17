use keyring::Entry;
use rand::RngExt;

const SERVICE: &str = "com.zplace.tauri-app";
const ACCOUNT: &str = "database-key";

/// Returns the database encryption key, generating and storing a new
/// random one in the OS keychain on first use.
pub fn get_or_create_database_key() -> Result<[u8; 32], String> {
    let entry = Entry::new(SERVICE, ACCOUNT).map_err(|error| error.to_string())?;

    match entry.get_password() {
        Ok(hex_key) => decode_hex_key(&hex_key),
        Err(keyring::Error::NoEntry) => {
            let mut key = [0u8; 32];
            rand::rng().fill(&mut key);

            entry
                .set_password(&encode_hex_key(&key))
                .map_err(|error| error.to_string())?;

            Ok(key)
        }
        Err(error) => Err(error.to_string()),
    }
}

pub fn encode_hex_key(key: &[u8; 32]) -> String {
    key.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn decode_hex_key(hex: &str) -> Result<[u8; 32], String> {
    if hex.len() != 64 {
        return Err("Stored database key has an unexpected length.".to_string());
    }

    let mut key = [0u8; 32];

    for (index, chunk) in hex.as_bytes().chunks(2).enumerate() {
        let byte_str = std::str::from_utf8(chunk).map_err(|error| error.to_string())?;
        key[index] = u8::from_str_radix(byte_str, 16).map_err(|error| error.to_string())?;
    }

    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::{decode_hex_key, encode_hex_key};

    #[test]
    fn hex_round_trips() {
        let key = [7u8; 32];
        let encoded = encode_hex_key(&key);
        assert_eq!(encoded.len(), 64);
        assert_eq!(decode_hex_key(&encoded).unwrap(), key);
    }

    #[test]
    fn decode_rejects_wrong_length() {
        assert!(decode_hex_key("abcd").is_err());
    }
}
