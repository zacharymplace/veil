import { invoke } from "@tauri-apps/api/core";
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

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let memoryPermissionRecords: PermissionRecord[] = [];

async function persistPermissionRecord(
  input: Omit<PermissionRecord, "id" | "at">
): Promise<PermissionRecord> {
  if (!hasTauriRuntime()) {
    const record: PermissionRecord = {
      ...input,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    };

    memoryPermissionRecords = [record, ...memoryPermissionRecords].slice(0, 250);
    return record;
  }

  return invoke<PermissionRecord>("permission_append_record", {
    sessionId: input.sessionId,
    profile: input.profile,
    permission: input.permission,
    status: input.status,
    reason: input.reason,
  });
}

export async function evaluatePermissionForSession(
  session: BrowserSession,
  permission: BrowserPermission
): Promise<PermissionRecord> {
  const decision = requestPermission(permission);

  const status: PermissionStatus =
    decision.action === "allow" ? "allowed" : decision.action === "block" ? "blocked" : "prompt";

  const record = await persistPermissionRecord({
    sessionId: session.id,
    profile: session.profile,
    permission,
    status,
    reason: decision.reason,
  });

  appendAuditEvent({
    type: "permission.evaluated",
    summary: `${permission} permission evaluated as ${record.status}.`,
    metadata: record,
  });

  return record;
}

export async function listPermissionRecords(): Promise<PermissionRecord[]> {
  if (!hasTauriRuntime()) return memoryPermissionRecords;
  return invoke<PermissionRecord[]>("permission_list_records");
}

export async function listPermissionRecordsForSession(
  sessionId: string
): Promise<PermissionRecord[]> {
  const records = await listPermissionRecords();
  return records.filter((record) => record.sessionId === sessionId);
}

export async function clearPermissionRecords(): Promise<void> {
  if (!hasTauriRuntime()) {
    memoryPermissionRecords = [];
    return;
  }

  await invoke("permission_clear_records");
}
