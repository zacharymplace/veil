import type { BrowserSession } from "../session/sessionManager";
import { runSessionCleanup } from "../../privacy/cleanup/cleanupService";
import { clearNavigationHistory } from "../history/historyManager";

export function cleanupBrowserSession(session: BrowserSession): void {
  runSessionCleanup(session.id);

  if (!session.policy.historyEnabled) {
    clearNavigationHistory();
  }
}
