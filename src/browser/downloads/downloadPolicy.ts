import { evaluatePolicy } from "../../security/policies/policyEngine";

export function canDownload(url: string) {
  return evaluatePolicy({ type: "download", url });
}
