import { useMemo, useState } from "react";
import { createBrowserEngineSession } from "../../browser/engine/browserEngineV05";
import {
  bindLiveWebViewNavigation,
  liveWebViewDownloadsAllowed,
} from "../../browser/webview/liveWebViewBinding";

export function LiveWebViewBindingView() {
  const session = useMemo(() => createBrowserEngineSession("temporary"), []);
  const [input, setInput] = useState("https://example.com");
  const [url, setUrl] = useState("https://example.com");

  const binding = bindLiveWebViewNavigation(session, url);

  return (
    <section className="panel">
      <h1>Live WebView Binding</h1>
      <p>v1.1 minimal binding: HTTPS-only navigation, sandboxed frame, downloads blocked.</p>

      <div className="browser-bar">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") setUrl(input);
          }}
          placeholder="https://example.com"
        />
        <button onClick={() => setUrl(input)}>Open</button>
      </div>

      <div className="status-grid">
        <span>Status: {binding.status}</span>
        <span>Downloads: {liveWebViewDownloadsAllowed(binding) ? "allowed" : "blocked"}</span>
        <span>Sandbox: active</span>
      </div>

      <p className="muted">{binding.reason}</p>

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
    </section>
  );
}
