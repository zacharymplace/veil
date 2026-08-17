export const CRYPTO_PLAN = {
  vaultEncryption: "SQLCipher enabled",
  keyStorage: "OS keychain enabled",
  secureDelete: "Rust command planned",
  backups: "Argon2id-encrypted export enabled",
} as const;
