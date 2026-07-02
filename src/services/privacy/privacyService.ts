import { buildPrivacyReport } from "../../privacy/reports/privacyReport";

export const defaultPrivacyReport = {
  trackersBlocked: 0,
  cookiesRemoved: 0,
  httpsUpgrades: 0,
  fingerprintAttempts: 0,
  cameraPermission: "blocked" as const,
  microphonePermission: "blocked" as const,
  locationPermission: "blocked" as const,
  clipboardAccess: "blocked" as const,
};

export function privacyScore(): number {
  return 100;
}

export { buildPrivacyReport };
