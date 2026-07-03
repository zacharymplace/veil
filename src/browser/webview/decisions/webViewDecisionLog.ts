import type { LiveWebViewBinding } from "../liveWebViewBinding";

export type WebViewDecisionLogEntry = {
  id: string;
  requestedUrl: string;
  targetUrl: string | null;
  status: LiveWebViewBinding["status"];
  reason: string;
  downloadsAllowed: boolean;
  sandboxActive: boolean;
  decidedAt: string;
};

export function createWebViewDecisionEntry(
  binding: LiveWebViewBinding,
  decidedAt = new Date().toISOString()
): WebViewDecisionLogEntry {
  return {
    id: `${decidedAt}:${binding.requestedUrl}`,
    requestedUrl: binding.requestedUrl,
    targetUrl: binding.targetUrl,
    status: binding.status,
    reason: binding.reason,
    downloadsAllowed: binding.sandbox.includes("allow-downloads"),
    sandboxActive: binding.sandbox.length > 0,
    decidedAt,
  };
}

export function appendWebViewDecision(
  entries: WebViewDecisionLogEntry[],
  binding: LiveWebViewBinding,
  decidedAt?: string
): WebViewDecisionLogEntry[] {
  return [createWebViewDecisionEntry(binding, decidedAt), ...entries].slice(0, 12);
}

export function webViewStatusLabel(entry: WebViewDecisionLogEntry): string {
  return entry.status === "ready" ? "Ready" : "Blocked";
}
