import {
  createSession,
  navigateSession,
  sessionLabel,
  type BrowserSession,
  type SessionProfile,
} from "../../services/browser/browserService";
import { prepareNavigation } from "../../browser/navigation/navigationManager";

export function createCoreBrowserSession(profile: SessionProfile): BrowserSession {
  return createSession(profile);
}

export function prepareCoreNavigation(session: BrowserSession, input: string) {
  const prepared = prepareNavigation(input);

  return {
    decision: prepared.decision,
    nextSession:
      prepared.decision.action === "block"
        ? session
        : navigateSession(session, prepared.url),
  };
}

export function describeCoreSession(session: BrowserSession): string {
  return `${sessionLabel(session.profile)} session · downloads disabled · cookies isolated`;
}
