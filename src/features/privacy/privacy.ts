import type { PrivacyStats } from "../../lib/types";

export const initialPrivacyStats: PrivacyStats = {
  trackersBlocked: 0,
  thirdPartyRequestsBlocked: 0,
  cookiesCleared: 0,
  sessionMinutes: 0,
};

export function summarizePrivacy(stats: PrivacyStats): string {
  return [
    `${stats.trackersBlocked} trackers blocked`,
    `${stats.thirdPartyRequestsBlocked} third-party requests blocked`,
    `${stats.cookiesCleared} cookies cleared`,
    `${stats.sessionMinutes} session minutes`,
  ].join(" · ");
}
