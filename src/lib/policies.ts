export const VEIL_BOUNDARIES = {
  hostsContent: false,
  scrapesContent: false,
  downloadsMedia: false,
  bypassesPaywalls: false,
  bypassesAgeGates: false,
  engagementOptimization: false,
  analytics: false,
  cloudSyncByDefault: false,
} as const;

export const SAFETY_DEFAULTS = {
  adultGateRequired: true,
  sessionTimerEnabled: true,
  panicCloseEnabled: true,
  autoClearCookies: true,
  autoLockMinutes: 10,
} as const;
