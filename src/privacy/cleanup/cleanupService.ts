import { appendAuditEvent } from "../../security/audit/auditLog";

export function runSessionCleanup(sessionId: string): void {
  appendAuditEvent({
    type: "cleanup.session",
    summary: "Session bookkeeping cleanup completed.",
    metadata: {
      sessionId,
      note: "Local session bookkeeping cleared. Cookie and cache storage are shared across sessions and are not touched by this action.",
    },
  });
}
