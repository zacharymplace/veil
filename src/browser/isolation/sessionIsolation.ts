import type { BrowserSession } from "../session/sessionManager";
import type { SessionProfile } from "../profiles/profiles";
import { appendAuditEvent } from "../../security/audit/auditLog";

export type IsolationScope = {
  sessionId: string;
  profile: SessionProfile;
  storageNamespace: string;
  historyNamespace: string;
  cacheNamespace: string;
  cookieNamespace: string;
  persistsHistory: boolean;
  persistsCookies: boolean;
  persistsCache: boolean;
};

const scopes = new Map<string, IsolationScope>();

export function createIsolationScope(session: BrowserSession): IsolationScope {
  const scope: IsolationScope = {
    sessionId: session.id,
    profile: session.profile,
    storageNamespace: `veil:${session.profile}:${session.id}:storage`,
    historyNamespace: `veil:${session.profile}:${session.id}:history`,
    cacheNamespace: `veil:${session.profile}:${session.id}:cache`,
    cookieNamespace: `veil:${session.profile}:${session.id}:cookies`,
    persistsHistory: session.policy.historyEnabled,
    persistsCookies: session.policy.cookiesPersist,
    persistsCache: session.policy.cachePersist,
  };

  scopes.set(session.id, scope);

  appendAuditEvent({
    type: "session.isolation.created",
    summary: `${session.profile} isolation scope created.`,
    metadata: scope,
  });

  return scope;
}

export function getIsolationScope(sessionId: string): IsolationScope | undefined {
  return scopes.get(sessionId);
}

export function listIsolationScopes(): IsolationScope[] {
  return Array.from(scopes.values());
}

export function cleanupIsolationScope(session: BrowserSession): IsolationScope | undefined {
  const scope = scopes.get(session.id);

  if (!scope) return undefined;

  const cleanup = {
    sessionId: session.id,
    profile: session.profile,
    historyPolicy: scope.persistsHistory ? "retained" : "ephemeral",
    cookiePolicy: scope.persistsCookies ? "retained" : "ephemeral",
    cachePolicy: scope.persistsCache ? "retained" : "ephemeral",
    note: "Local isolation-scope bookkeeping removed. Browser-level cookie and cache storage is not yet partitioned per session.",
  };

  scopes.delete(session.id);

  appendAuditEvent({
    type: "session.isolation.cleaned",
    summary: `${session.profile} isolation scope cleaned.`,
    metadata: cleanup,
  });

  return scope;
}
