import type { BrowserSession } from "../session/sessionManager";
import { evaluateWebViewNavigation } from "./webViewContract";

export type LiveWebViewBinding = {
  status: "ready" | "blocked";
  requestedUrl: string;
  targetUrl: string | null;
  sandbox: string;
  reason: string;
};

export const LIVE_WEBVIEW_SANDBOX =
  "allow-forms allow-scripts allow-same-origin allow-popups";

export function bindLiveWebViewNavigation(
  session: BrowserSession,
  requestedUrl: string
): LiveWebViewBinding {
  const navigation = evaluateWebViewNavigation(session, requestedUrl);

  if (!navigation.ok) {
    return {
      status: "blocked",
      requestedUrl,
      targetUrl: null,
      sandbox: LIVE_WEBVIEW_SANDBOX,
      reason: navigation.reason,
    };
  }

  return {
    status: "ready",
    requestedUrl,
    targetUrl: navigation.url,
    sandbox: LIVE_WEBVIEW_SANDBOX,
    reason: "Live WebView binding accepted HTTPS navigation.",
  };
}

export function liveWebViewDownloadsAllowed(binding: LiveWebViewBinding): boolean {
  return binding.sandbox.includes("allow-downloads");
}
