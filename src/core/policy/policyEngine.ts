import {
  evaluatePolicy,
  type PolicyDecision,
  type PolicyRequest,
} from "../../security/policies/policyEngine";
import {
  appendAuditEventAsync,
  listAuditEventsAsync,
} from "../../security/audit/auditLog";

export async function evaluateCorePolicy(request: PolicyRequest): Promise<PolicyDecision> {
  const decision = evaluatePolicy(request);

  await appendAuditEventAsync({
    type: "policy.evaluated",
    summary: `${request.type} policy evaluated as ${decision.action}.`,
    metadata: { request, decision },
  });

  return decision;
}

export async function listCoreAuditEvents() {
  return listAuditEventsAsync();
}
