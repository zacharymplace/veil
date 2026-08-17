export const THREAT_MODEL = {
  protectsAgainst: [
    "casual local history exposure",
    "unwanted download behavior",
    "unexpected permission grants",
    "unbounded local audit growth",
  ],
  doesNotProtectAgainst: [
    "malware on the host machine",
    "compromised operating system",
    "ISP-level observation without VPN or encrypted DNS",
    "tracking inside websites after login",
    "cross-session cookie or storage sharing (all profiles currently share one WebView storage context)",
  ],
} as const;
