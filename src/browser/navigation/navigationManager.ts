import { normalizeAddress } from "../../lib/url";
import { evaluatePolicy } from "../../security/policies/policyEngine";

export function prepareNavigation(input: string) {
  const url = normalizeAddress(input);
  const decision = evaluatePolicy({ type: "navigation", url });

  return { url, decision };
}
