import {
  browserEngineCheckDownload,
  browserEngineNavigate,
  browserEngineRequestPermission,
} from "../engine/browserEngineV05";
import type { BrowserSession } from "../session/sessionManager";
import type { BrowserPermission } from "../permissions/permissionManager";

export type WebViewNavigationResult = {
  ok: boolean;
  url: string;
  currentUrl: string;
  reason: string;
};

export function evaluateWebViewNavigation(
  session: BrowserSession,
  url: string
): WebViewNavigationResult {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return {
      ok: false,
      url,
      currentUrl: session.currentUrl,
      reason: "Navigation blocked because URL is invalid.",
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      url,
      currentUrl: session.currentUrl,
      reason: "Navigation blocked because WebView contract requires HTTPS.",
    };
  }

  const nextSession = browserEngineNavigate(session, url);
  const ok = nextSession.currentUrl === url;

  return {
    ok,
    url,
    currentUrl: nextSession.currentUrl,
    reason: ok ? "Navigation allowed by Browser Engine." : "Navigation blocked by Browser Engine.",
  };
}

export function evaluateWebViewDownload(session: BrowserSession, url: string) {
  return browserEngineCheckDownload(session, url);
}

export function evaluateWebViewPermission(
  session: BrowserSession,
  permission: BrowserPermission
) {
  return browserEngineRequestPermission(session, permission);
}
