import { PROFILE_POLICIES, type SessionProfile } from "../profiles/profiles";
import { appendAuditEvent } from "../../security/audit/auditLog";

export type BrowserSession = {
  id: string;
  profile: SessionProfile;
  startedAt: string;
  currentUrl: string;
  policy: typeof PROFILE_POLICIES[SessionProfile];
};

export function createBrowserSession(profile: SessionProfile = "temporary"): BrowserSession {
  const session = {
    id: crypto.randomUUID(),
    profile,
    startedAt: new Date().toISOString(),
    currentUrl: "",
    policy: PROFILE_POLICIES[profile],
  };

  appendAuditEvent({
    type: "session.created",
    summary: `Created ${PROFILE_POLICIES[profile].label} session.`,
    metadata: { sessionId: session.id, profile },
  });

  return session;
}

export function navigateSession(session: BrowserSession, url: string): BrowserSession {
  appendAuditEvent({
    type: "navigation.requested",
    summary: `Navigation requested.`,
    metadata: { sessionId: session.id, profile: session.profile, url },
  });

  return {
    ...session,
    currentUrl: url,
  };
}
