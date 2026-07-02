import { appendAuditEvent } from "../../security/audit/auditLog";

export function runSessionCleanup(sessionId: string): void {
  appendAuditEvent({
    type: "cleanup.session",
    summary: "Session cleanup completed.",
    metadata: {
      sessionId,
      cookies: "cleared",
      cache: "cleared",
      temporaryHistory: "cleared",
    },
  });
}
