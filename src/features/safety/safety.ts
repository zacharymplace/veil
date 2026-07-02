import { SAFETY_DEFAULTS } from "../../lib/policies";

export function shouldAutoLock(lastActiveAt: number, now = Date.now()): boolean {
  const idleMs = now - lastActiveAt;
  return idleMs >= SAFETY_DEFAULTS.autoLockMinutes * 60 * 1000;
}

export function adultGateCopy(): string {
  return "Veil is for adults only. It does not host, distribute, scrape, or download content.";
}
