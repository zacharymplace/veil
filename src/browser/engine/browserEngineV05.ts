import { prepareNavigation } from "../navigation/navigationManager";
import { type BrowserPermission } from "../permissions/permissionManager";
import { evaluatePermissionForSession, listPermissionRecords } from "../permissions/registry/permissionRegistry";
import { evaluateDownloadForSession, listDownloadRecords } from "../downloads/registry/downloadRegistry";
import {
  createBrowserSession,
  navigateSession,
  type BrowserSession,
} from "../session/sessionManager";
import { PROFILE_POLICIES, profileLabel, type SessionProfile } from "../profiles/profiles";
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

export function browserEngineRequestPermission(
  session: BrowserSession,
  permission: BrowserPermission
) {
  return evaluatePermissionForSession(session, permission);
}

export function browserEngineCheckDownload(session: BrowserSession, url: string) {
  return evaluateDownloadForSession(session, url);
}

export function browserEngineCleanup(session: BrowserSession): void {
  cleanupBrowserSession(session);

  appendAuditEvent({
    type: "browser.cleanup",
    summary: `${profileLabel(session.profile)} session cleanup completed.`,
    metadata: { sessionId: session.id, profile: session.profile },
  });
}

export function browserEngineCleanupScope(scopeId: string): void {
  const scope = listIsolationScopes().find((item) => item.sessionId === scopeId);
  if (!scope) return;

  browserEngineCleanup({
    id: scope.sessionId,
    profile: scope.profile,
    startedAt: new Date().toISOString(),
    currentUrl: "",
    policy: PROFILE_POLICIES[scope.profile],
  });
}

export function browserEngineHistory() {
  return listNavigationHistory();
}


export function browserEngineIsolationScopes() {
  return listIsolationScopes();
}


export function browserEnginePermissionRecords() {
  return listPermissionRecords();
}


export function browserEngineDownloadRecords() {
  return listDownloadRecords();
}
