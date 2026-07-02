import type { BrowserSession } from "../session/sessionManager";
import { runSessionCleanup } from "../../privacy/cleanup/cleanupService";
import { clearNavigationHistoryForSession } from "../history/historyManager";
import { cleanupIsolationScope } from "../isolation/sessionIsolation";

export function cleanupBrowserSession(session: BrowserSession): void {
  runSessionCleanup(session.id);
  cleanupIsolationScope(session);

  if (!session.policy.historyEnabled) {
    clearNavigationHistoryForSession(session.id);
  }
}
