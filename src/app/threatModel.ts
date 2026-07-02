export const THREAT_MODEL = {
  protectsAgainst: [
    "casual local history exposure",
    "cross-session cookie persistence",
    "unwanted download behavior",
    "unexpected permission grants",
    "unbounded local audit growth",
  ],
  doesNotProtectAgainst: [
    "malware on the host machine",
    "compromised operating system",
    "ISP-level observation without VPN or encrypted DNS",
    "tracking inside websites after login",
  ],
} as const;
