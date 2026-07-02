export type PrivacyFinding = {
  level: "safe" | "warning" | "blocked";
  title: string;
  description: string;
};

export function inspectUrl(url: string): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];

  if (!url.startsWith("https://")) {
    findings.push({
      level: "warning",
      title: "HTTPS not confirmed",
      description: "Prefer HTTPS addresses for private browsing sessions.",
    });
  }

  if (url.includes("utm_")) {
    findings.push({
      level: "warning",
      title: "Tracking parameters detected",
      description: "This address appears to include campaign tracking parameters.",
    });
  }

  if (findings.length === 0) {
    findings.push({
      level: "safe",
      title: "Address looks clean",
      description: "No obvious tracking parameters detected.",
    });
  }

  return findings;
}
