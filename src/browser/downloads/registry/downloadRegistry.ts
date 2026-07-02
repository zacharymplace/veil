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

let downloadRecords: DownloadRecord[] = [];

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

export function evaluateDownloadForSession(
  session: BrowserSession,
  url: string
): DownloadRecord {
  const policy = canDownload(url);
  const filename = filenameFromUrl(url);
  const extension = extensionFromFilename(filename);
  const risk = riskForExtension(extension);

  const record: DownloadRecord = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    profile: session.profile,
    url,
    filename,
    extension,
    risk,
    status:
      policy.action === "allow"
        ? "allowed"
        : policy.action === "prompt"
          ? "prompt"
          : "blocked",
    reason:
      risk === "high"
        ? `Blocked by default. .${extension} is a high-risk file type.`
        : policy.reason,
    at: new Date().toISOString(),
  };

  downloadRecords = [record, ...downloadRecords].slice(0, 250);

  appendAuditEvent({
    type: "download.evaluated",
    summary: `Download ${record.status}: ${record.filename}.`,
    metadata: record,
  });

  return record;
}

export function listDownloadRecords(): DownloadRecord[] {
  return downloadRecords;
}

export function clearDownloadRecords(): void {
  downloadRecords = [];
}
