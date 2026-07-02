import { prepareNavigation } from "../navigation/navigationManager";
import { requestPermission, type BrowserPermission } from "../permissions/permissionManager";
import { canDownload } from "../downloads/downloadPolicy";
import {
  createBrowserSession,
  navigateSession,
  type BrowserSession,
} from "../session/sessionManager";
import { profileLabel, type SessionProfile } from "../profiles/profiles";
import { appendNavigationEntry, listNavigationHistory } from "../history/historyManager";
import { createIsolationScope, getIsolationScope, listIsolationScopes } from "../isolation/sessionIsolation";
import { cleanupBrowserSession } from "../cleanup/sessionCleanup";
import { appendAuditEvent } from "../../security/audit/auditLog";

export function createBrowserEngineSession(profile: SessionProfile): BrowserSession {
  const session = createBrowserSession(profile);
  createIsolationScope(session);
  return session;
}

export function browserEngineNavigate(
  session: BrowserSession,
  input: string
): BrowserSession {
  const prepared = prepareNavigation(input);

  const scope = getIsolationScope(session.id) ?? createIsolationScope(session);

  appendNavigationEntry({
    sessionId: session.id,
    profile: session.profile,
    namespace: scope.historyNamespace,
    url: prepared.url,
    decision: prepared.decision.action,
    reason: prepared.decision.reason,
  });

  appendAuditEvent({
    type: "browser.navigation",
    summary: `${profileLabel(session.profile)} navigation ${prepared.decision.action}.`,
    metadata: {
      sessionId: session.id,
      profile: session.profile,
      url: prepared.url,
      decision: prepared.decision,
    },
  });

  if (prepared.decision.action === "block") {
    return session;
  }

  return navigateSession(session, prepared.url);
}

export function browserEngineRequestPermission(permission: BrowserPermission) {
  const decision = requestPermission(permission);

  appendAuditEvent({
    type: "browser.permission",
    summary: `${permission} permission ${decision.action}.`,
    metadata: { permission, decision },
  });

  return decision;
}

export function browserEngineCheckDownload(url: string) {
  const decision = canDownload(url);

  appendAuditEvent({
    type: "browser.download",
    summary: `Download ${decision.action}.`,
    metadata: { url, decision },
  });

  return decision;
}

export function browserEngineCleanup(session: BrowserSession): void {
  cleanupBrowserSession(session);

  appendAuditEvent({
    type: "browser.cleanup",
    summary: `${profileLabel(session.profile)} session cleanup completed.`,
    metadata: { sessionId: session.id, profile: session.profile },
  });
}

export function browserEngineHistory() {
  return listNavigationHistory();
}


export function browserEngineIsolationScopes() {
  return listIsolationScopes();
}
