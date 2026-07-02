import { CORE_COLLECTIONS, coreVaultSummary } from "../vault/vaultEngine";
import { getThreatModel } from "../security/securityEngine";

export type CoreDiagnostic = {
  name: string;
  passed: boolean;
  detail: string;
};

export function runCoreDiagnostics(): CoreDiagnostic[] {
  const vault = coreVaultSummary();
  const threatModel = getThreatModel();

  return [
    {
      name: "collections.present",
      passed: CORE_COLLECTIONS.length >= 5,
      detail: `${CORE_COLLECTIONS.length} default collections registered.`,
    },
    {
      name: "vault.sqlite",
      passed: vault.storageMode === "SQLite",
      detail: `Vault storage mode: ${vault.storageMode}.`,
    },
    {
      name: "threat_model.present",
      passed:
        threatModel.protectsAgainst.length > 0 &&
        threatModel.doesNotProtectAgainst.length > 0,
      detail: "Threat model boundaries are defined.",
    },
  ];
}
