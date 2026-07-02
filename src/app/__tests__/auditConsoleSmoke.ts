import {
  exportAuditEvents,
  filterAuditEvents,
  summarizeAuditEvents,
} from "../../security/audit/console/auditConsole";
import type { AuditEvent } from "../../security/audit/auditLog";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const events: AuditEvent[] = [
  {
    id: "1",
    at: "2026-01-01T00:00:00Z",
    type: "download.evaluated",
    summary: "Download blocked.",
    metadata: { risk: "high" },
  },
  {
    id: "2",
    at: "2026-01-01T00:01:00Z",
    type: "permission.evaluated",
    summary: "Camera prompted.",
    metadata: { permission: "camera" },
  },
  {
    id: "3",
    at: "2026-01-01T00:02:00Z",
    type: "session.created",
    summary: "Created session.",
  },
];

const summary = summarizeAuditEvents(events);
assert(summary.totalEvents === 3, "summary should count all events");
assert(summary.eventTypes["download.evaluated"] === 1, "summary should count download events");
assert(summary.highSignalEvents === 2, "summary should count high signal events");

const filtered = filterAuditEvents(events, "camera");
assert(filtered.length === 1, "filter should find camera event");

const exported = exportAuditEvents(events);
assert(exported.includes("veil.audit-export"), "export should include kind");
assert(exported.includes("download.evaluated"), "export should include events");

console.log("PASS audit console smoke");
