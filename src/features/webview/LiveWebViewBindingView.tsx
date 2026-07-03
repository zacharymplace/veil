import { useEffect, useMemo, useState } from "react";
import { createBrowserEngineSession } from "../../browser/engine/browserEngineV05";
import {
  bindLiveWebViewNavigation,
  liveWebViewDownloadsAllowed,
} from "../../browser/webview/liveWebViewBinding";
import {
  appendWebViewDecision,
  type WebViewDecisionLogEntry,
} from "../../browser/webview/decisions/webViewDecisionLog";

export function LiveWebViewBindingView() {
  const session = useMemo(() => createBrowserEngineSession("temporary"), []);
  const [input, setInput] = useState("https://example.com");
  const [url, setUrl] = useState("https://example.com");
  const [decisions, setDecisions] = useState<WebViewDecisionLogEntry[]>([]);

  const binding = bindLiveWebViewNavigation(session, url);

  useEffect(() => {
    setDecisions((current) =>
      current.length === 0 ? appendWebViewDecision(current, binding) : current
    );
  }, []);

  function openRequestedUrl() {
    const nextBinding = bindLiveWebViewNavigation(session, input);
    setUrl(input);
    setDecisions((current) => appendWebViewDecision(current, nextBinding));
  }

  return (
    <section className="panel">
      <h1>Live WebView Binding</h1>
      <p>v1.1 minimal binding: HTTPS-only navigation, sandboxed frame, downloads blocked.</p>

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
        <span className="policy-badge blocked">
          Downloads: {liveWebViewDownloadsAllowed(binding) ? "allowed" : "blocked"}
        </span>
        <span className="policy-badge ready">Sandbox: active</span>
      </div>

      <p className="policy-reason">{binding.reason}</p>

      {binding.targetUrl ? (
        <iframe
          title="Veil live WebView binding"
          src={binding.targetUrl}
          sandbox={binding.sandbox}
          referrerPolicy="no-referrer"
          className="webview-frame"
        />
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
