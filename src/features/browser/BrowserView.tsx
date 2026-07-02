import { useMemo, useState } from "react";
import { normalizeAddress } from "../../lib/url";
import { inspectUrl } from "../security/privacyGuards";
import { createBrowserSession } from "./session";
import { saveBookmark } from "../vault/vault";

export function BrowserView() {
  const [address, setAddress] = useState("");
  const [session, setSession] = useState(createBrowserSession());
  const [lastSaved, setLastSaved] = useState("");

  const findings = useMemo(
    () => (session.currentUrl ? inspectUrl(session.currentUrl) : []),
    [session.currentUrl]
  );

  function openAddress() {
    const nextUrl = normalizeAddress(address);
    if (!nextUrl) return;

    setSession((current) => ({
      ...current,
      currentUrl: nextUrl,
      httpsUpgrades:
        !/^https?:\/\//i.test(address.trim()) && nextUrl.startsWith("https://")
          ? current.httpsUpgrades + 1
          : current.httpsUpgrades,
    }));
  }

  function saveCurrentBookmark() {
    if (!session.currentUrl) return;

    saveBookmark({
      title: session.currentUrl.replace(/^https?:\/\//, ""),
      url: session.currentUrl,
      tags: ["browser"],
      notes: "Saved from private browser shell.",
    });

    setLastSaved(new Date().toLocaleTimeString());
  }

  function resetSession() {
    setAddress("");
    setLastSaved("");
    setSession(createBrowserSession());
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Browser</h1>
          <p>Private browser shell with safe URL normalization and session controls.</p>
        </div>
        <button className="ghost-button" onClick={resetSession}>New session</button>
      </div>

      <div className="browser-shell">
        <div className="browser-toolbar">
          <button className="circle-button" disabled>←</button>
          <button className="circle-button" disabled>→</button>
          <button className="circle-button" onClick={resetSession}>↻</button>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") openAddress();
            }}
            placeholder="Search or enter address"
          />
          <button onClick={openAddress}>Open</button>
          <button onClick={saveCurrentBookmark} disabled={!session.currentUrl}>
            Save
          </button>
        </div>

        <div className="browser-canvas">
          {session.currentUrl ? (
            <div className="browser-preview">
              <span className="muted">Current private address</span>
              <h2>{session.currentUrl}</h2>
              <p>
                Real WebView loading is intentionally deferred until the privacy model,
                domain controls, and storage isolation are locked.
              </p>
              {lastSaved && <p className="muted">Saved at {lastSaved}</p>}
            </div>
          ) : (
            <div>
              <h2>Private Session</h2>
              <p>Enter a search or URL. Veil normalizes searches through DuckDuckGo and prefers HTTPS URLs.</p>
            </div>
          )}
        </div>

        <div className="browser-footer">
          <span>Session: {session.id.slice(0, 8)}</span>
          <span>HTTPS upgrades: {session.httpsUpgrades}</span>
          <span>Cookies isolated</span>
        </div>
      </div>

      {findings.length > 0 && (
        <div className="card">
          <h2>Address inspection</h2>
          {findings.map((finding) => (
            <div className="protection-row" key={finding.title}>
              <div>
                <strong>{finding.title}</strong>
                <p>{finding.description}</p>
              </div>
              <span className={`badge ${finding.level === "safe" ? "on" : "off"}`}>
                {finding.level}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
