import type { BrowserPermission } from "../permissionManager";
import type { BrowserSession } from "../../session/sessionManager";
import { requestPermission } from "../permissionManager";
import { appendAuditEvent } from "../../../security/audit/auditLog";

export type PermissionStatus = "allowed" | "blocked" | "prompt";

export type PermissionRecord = {
  id: string;
  sessionId: string;
  profile: string;
  permission: BrowserPermission;
  status: PermissionStatus;
  reason: string;
  at: string;
};

let permissionRecords: PermissionRecord[] = [];

export function evaluatePermissionForSession(
  session: BrowserSession,
  permission: BrowserPermission
): PermissionRecord {
  const decision = requestPermission(permission);

  const record: PermissionRecord = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    profile: session.profile,
    permission,
    status:
      decision.action === "allow"
        ? "allowed"
        : decision.action === "block"
          ? "blocked"
          : "prompt",
    reason: decision.reason,
    at: new Date().toISOString(),
  };

  permissionRecords = [record, ...permissionRecords].slice(0, 250);

  appendAuditEvent({
    type: "permission.evaluated",
    summary: `${permission} permission evaluated as ${record.status}.`,
    metadata: record,
  });

  return record;
}

export function listPermissionRecords(): PermissionRecord[] {
  return permissionRecords;
}

export function listPermissionRecordsForSession(sessionId: string): PermissionRecord[] {
  return permissionRecords.filter((record) => record.sessionId === sessionId);
}

export function clearPermissionRecords(): void {
  permissionRecords = [];
}
