export type BrowserSession = {
  id: string;
  startedAt: string;
  currentUrl: string;
  trackersBlocked: number;
  cookiesCleared: number;
  httpsUpgrades: number;
};

export function createBrowserSession(): BrowserSession {
  return {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    currentUrl: "",
    trackersBlocked: 0,
    cookiesCleared: 0,
    httpsUpgrades: 0,
  };
}
