import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserEngineSession } from "../../browser/engine/browserEngineV05";
import {
  bindLiveWebViewNavigation,
  liveWebViewDownloadsAllowed,
} from "../../browser/webview/liveWebViewBinding";
import {
  appendWebViewDecision,
  type WebViewDecisionLogEntry,
} from "../../browser/webview/decisions/webViewDecisionLog";
import {
  hasNativeWebViewSupport,
  hideNativeWebView,
  setNativeWebViewBounds,
  showNativeWebView,
  type WebViewBounds,
} from "../../browser/webview/nativeWebViewBridge";

function rectFromElement(element: HTMLElement): WebViewBounds {
  const rect = element.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

export function LiveWebViewBindingView() {
  const session = useMemo(() => createBrowserEngineSession("temporary"), []);
  const native = useMemo(() => hasNativeWebViewSupport(), []);
  const [input, setInput] = useState("https://example.com");
  const [url, setUrl] = useState("https://example.com");
  const [decisions, setDecisions] = useState<WebViewDecisionLogEntry[]>([]);
  const [error, setError] = useState("");
  const frameRef = useRef<HTMLDivElement | null>(null);

  const binding = useMemo(() => bindLiveWebViewNavigation(session, url), [session, url]);

  useEffect(() => {
    setDecisions((current) =>
      current.length === 0 ? appendWebViewDecision(current, binding) : current
    );
  }, []);

  useEffect(() => {
    if (!native) return;

    if (!binding.targetUrl) {
      hideNativeWebView().catch(() => {});
      return;
    }

    if (!frameRef.current) return;

    showNativeWebView({
      sessionId: session.id,
      profile: session.profile,
      url: binding.targetUrl,
      bounds: rectFromElement(frameRef.current),
    })
      .then(() => setError(""))
      .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
  }, [native, binding.targetUrl, session.id, session.profile]);

  useEffect(() => {
    if (!native || !frameRef.current) return;

    const element = frameRef.current;
    const observer = new ResizeObserver(() => {
      setNativeWebViewBounds(rectFromElement(element)).catch(() => {});
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [native, binding.targetUrl]);

  useEffect(() => {
    if (!native) return;
    return () => {
      hideNativeWebView().catch(() => {});
    };
  }, [native]);

  function openRequestedUrl() {
    const nextBinding = bindLiveWebViewNavigation(session, input);
    setUrl(input);
    setDecisions((current) => appendWebViewDecision(current, nextBinding));
  }

  return (
    <section className="panel">
      <h1>Live WebView Binding</h1>
      <p>
        {native
          ? "Native WebView: HTTPS-only navigation and downloads are enforced natively by Rust for every navigation, not just the address you type."
          : "Preview mode (no Tauri runtime detected): shows the policy decision only. Real enforcement requires the packaged app."}
      </p>

      <div className="browser-bar">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") openRequestedUrl();
          }}
          placeholder="https://example.com"
        />
        <button onClick={openRequestedUrl}>Open</button>
      </div>

      <div className="policy-badges">
        <span className={binding.status === "ready" ? "policy-badge ready" : "policy-badge blocked"}>
          Status: {binding.status}
        </span>
        <span className={liveWebViewDownloadsAllowed(binding) ? "policy-badge ready" : "policy-badge blocked"}>
          Downloads: {liveWebViewDownloadsAllowed(binding) ? "allowed" : "blocked"}
        </span>
        <span className={native ? "policy-badge ready" : "policy-badge blocked"}>
          Enforcement: {native ? "native (Rust)" : "preview only"}
        </span>
      </div>

      <p className="policy-reason">{binding.reason}</p>
      {error && <p className="error-banner">{error}</p>}

      {binding.targetUrl ? (
        <>
          {native ? (
            <div ref={frameRef} className="webview-frame" />
          ) : (
            <iframe
              title="Veil live WebView preview"
              src={binding.targetUrl}
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              referrerPolicy="no-referrer"
              className="webview-frame"
            />
          )}
          {native ? (
            <p className="muted">
              Downloads are blocked when the server forces a file save (e.g. clicking a link to a
              .zip or .exe). Content a site renders inline instead of downloading -- like a PDF
              export -- may still display here, since that's a normal page view, not a download.
            </p>
          ) : (
            <p className="muted">
              Some sites refuse to be displayed inside any frame (their own X-Frame-Options or
              Content-Security-Policy setting, not a Veil restriction). If the area above stays
              blank after navigation succeeds, that's likely why.
            </p>
          )}
        </>
      ) : (
        <div className="empty-state">Navigation blocked by Veil policy.</div>
      )}

      <section className="decision-log">
        <h2>WebView Decision Log</h2>
        {decisions.length === 0 ? (
          <p className="muted">No WebView decisions recorded yet.</p>
        ) : (
          <div className="audit-list">
            {decisions.map((decision) => (
              <div className="audit-row" key={decision.id}>
                <strong>{decision.status} · {decision.requestedUrl}</strong>
                <span>{decision.reason}</span>
                <pre>
                  {JSON.stringify(
                    {
                      targetUrl: decision.targetUrl,
                      downloadsAllowed: decision.downloadsAllowed,
                      sandboxActive: decision.sandboxActive,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
