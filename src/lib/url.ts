export function normalizeAddress(input: string): string {
  const value = input.trim();

  if (!value) return "";

  const hasProtocol = /^https?:\/\//i.test(value);
  const looksLikeDomain = /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(value);

  if (hasProtocol) return value;
  if (looksLikeDomain) return `https://${value}`;

  return `https://duckduckgo.com/?q=${encodeURIComponent(value)}`;
}

export function isHttpsUrl(url: string): boolean {
  return /^https:\/\//i.test(url);
}
