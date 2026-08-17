export const THREAT_MODEL = {
  protectsAgainst: [
    "casual local history exposure",
    "unwanted download behavior",
    "unexpected permission grants",
    "unbounded local audit growth",
    "cross-profile cookie and storage sharing in the packaged macOS app (each profile gets its own WKWebsiteDataStore; ephemeral profiles are wiped on close)",
  ],
  doesNotProtectAgainst: [
    "malware on the host machine",
    "compromised operating system",
    "ISP-level observation without VPN or encrypted DNS",
    "tracking inside websites after login",
    "cross-profile storage isolation outside the packaged macOS app -- the dev preview and other platforms (Windows/Linux) still share one WebView storage context",
  ],
} as const;
