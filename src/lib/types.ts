export type Bookmark = {
  id: string;
  url: string;
  title: string;
  tags: string[];
  notes?: string;
  collectionId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PrivacyStats = {
  trackersBlocked: number;
  thirdPartyRequestsBlocked: number;
  cookiesCleared: number;
  sessionMinutes: number;
  lastCleanupAt?: string;
};

export type SafetySettings = {
  adultGateAccepted: boolean;
  sessionTimerEnabled: boolean;
  breakReminderMinutes: number;
  autoLockMinutes: number;
  panicCloseEnabled: boolean;
};
