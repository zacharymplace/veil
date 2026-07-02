import { invoke } from "@tauri-apps/api/core";
import { THREAT_MODEL } from "../../app/threatModel";

export type EncryptionReadiness = {
  encryptedExport: boolean;
  sqlcipher: string;
  keychain: string;
  secureDelete: string;
  currentDatabaseEncryption: boolean;
};

export async function getEncryptionReadiness(): Promise<EncryptionReadiness> {
  return invoke<EncryptionReadiness>("db_encryption_readiness");
}

export function getThreatModel() {
  return THREAT_MODEL;
}
