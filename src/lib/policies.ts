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
  // sessionTimerEnabled and panicCloseEnabled: not implemented anywhere
  // (no UI, no keyboard handler). autoLockMinutes has a correct check
  // function (shouldAutoLock in safety.ts) but nothing calls it. Keep
  // these false/present as a documented target, not a live claim --
  // see SettingsView.tsx.
  sessionTimerEnabled: false,
  panicCloseEnabled: false,
  autoClearCookies: false,
  autoLockMinutes: 10,
} as const;
