import { evaluatePolicy } from "../../security/policies/policyEngine";

export type BrowserPermission = "camera" | "microphone" | "location" | "clipboard";

export function requestPermission(permission: BrowserPermission) {
  return evaluatePolicy({ type: "permission", permission });
}
