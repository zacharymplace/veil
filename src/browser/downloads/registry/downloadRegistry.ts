import { invoke } from "@tauri-apps/api/core";
import type { BrowserSession } from "../../session/sessionManager";
import { canDownload } from "../downloadPolicy";
import { appendAuditEvent } from "../../../security/audit/auditLog";

export type DownloadRisk = "low" | "medium" | "high";

export type DownloadRecord = {
  id: string;
  sessionId: string;
  profile: string;
  url: string;
  filename: string;
  extension: string;
  risk: DownloadRisk;
  status: "blocked" | "prompt" | "allowed";
  reason: string;
  at: string;
};

const DANGEROUS_EXTENSIONS = new Set([
  "app",
  "bat",
  "bin",
  "cmd",
  "com",
  "dmg",
  "exe",
  "jar",
  "js",
  "msi",
  "pkg",
  "ps1",
  "scr",
  "sh",
  "vbs",
  "zip",
]);

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let memoryDownloadRecords: DownloadRecord[] = [];

function filenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const last = parts.length ? parts[parts.length - 1] : undefined;
    return last || "download";
  } catch {
    return "download";
  }
}

function extensionFromFilename(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? String(parts[parts.length - 1]).toLowerCase() : "";
}

function riskForExtension(extension: string): DownloadRisk {
  if (!extension) return "medium";
  return DANGEROUS_EXTENSIONS.has(extension) ? "high" : "low";
}

async function persistDownloadRecord(
  input: Omit<DownloadRecord, "id" | "at">
): Promise<DownloadRecord> {
  if (!hasTauriRuntime()) {
    const record: DownloadRecord = {
      ...input,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    };

    memoryDownloadRecords = [record, ...memoryDownloadRecords].slice(0, 250);
    return record;
  }

  return invoke<DownloadRecord>("download_append_record", {
    sessionId: input.sessionId,
    profile: input.profile,
    url: input.url,
    filename: input.filename,
    extension: input.extension,
    risk: input.risk,
    status: input.status,
    reason: input.reason,
  });
}

export async function evaluateDownloadForSession(
  session: BrowserSession,
  url: string
): Promise<DownloadRecord> {
  const policy = canDownload(url);
  const filename = filenameFromUrl(url);
  const extension = extensionFromFilename(filename);
  const risk = riskForExtension(extension);

  const status =
    policy.action === "allow" ? "allowed" : policy.action === "prompt" ? "prompt" : "blocked";

  const reason =
    risk === "high"
      ? `Blocked by default. .${extension} is a high-risk file type.`
      : policy.reason;

  const record = await persistDownloadRecord({
    sessionId: session.id,
    profile: session.profile,
    url,
    filename,
    extension,
    risk,
    status,
    reason,
  });

  appendAuditEvent({
    type: "download.evaluated",
    summary: `Download ${record.status}: ${record.filename}.`,
    metadata: record,
  });

  return record;
}

export async function listDownloadRecords(): Promise<DownloadRecord[]> {
  if (!hasTauriRuntime()) return memoryDownloadRecords;
  return invoke<DownloadRecord[]>("download_list_records");
}

export async function clearDownloadRecords(): Promise<void> {
  if (!hasTauriRuntime()) {
    memoryDownloadRecords = [];
    return;
  }

  await invoke("download_clear_records");
}
