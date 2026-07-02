import { listAuditEvents } from "../../security/audit/auditLog";

export type PrivacyReport = {
  trackersBlocked: number;
  cookiesRemoved: number;
  httpsUpgrades: number;
  fingerprintAttempts: number;
  auditEvents: number;
};

export function buildPrivacyReport(): PrivacyReport {
  return {
    trackersBlocked: 0,
    cookiesRemoved: 0,
    httpsUpgrades: 0,
    fingerprintAttempts: 0,
    auditEvents: listAuditEvents().length,
  };
}
