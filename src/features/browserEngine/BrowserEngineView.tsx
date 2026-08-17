import { useMemo, useState } from "react";
import {
  PROFILE_ORDER,
  profileLabel,
  type SessionProfile,
} from "../../browser/profiles/profiles";
import {
  browserEngineCheckDownload,
  browserEngineCleanup,
  browserEngineHistory,
  browserEngineNavigate,
  browserEngineRequestPermission,
  createBrowserEngineSession,
} from "../../browser/engine/browserEngineV05";
import type { BrowserPermission } from "../../browser/permissions/permissionManager";

const PERMISSIONS: BrowserPermission[] = ["camera", "microphone", "location", "clipboard"];

export function BrowserEngineView() {
  const [profile, setProfile] = useState<SessionProfile>("temporary");
  const [session, setSession] = useState(() => createBrowserEngineSession("temporary"));
  const [address, setAddress] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");

  const history = useMemo(() => {
    version;
    return browserEngineHistory();
  }, [version]);

  function newSession(nextProfile: SessionProfile) {
    setProfile(nextProfile);
    setSession(createBrowserEngineSession(nextProfile));
    setAddress("");
    setVersion((current) => current + 1);
  }

  function navigate() {
    setSession((current) => browserEngineNavigate(current, address));
    setVersion((current) => current + 1);
  }

  function cleanup() {
    browserEngineCleanup(session);
    setVersion((current) => current + 1);
  }

  async function request(permission: BrowserPermission) {
    try {
      setError("");
      await browserEngineRequestPermission(session, permission);
      setVersion((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function checkDownload() {
    try {
      setError("");
      await browserEngineCheckDownload(session, downloadUrl || "https://example.com/file.zip");
      setVersion((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Browser Engine</h1>
          <p>v0.5 safe shell: history, cleanup, permissions, downloads, and audit decisions.</p>
        </div>
        <button className="ghost-button" onClick={cleanup}>Cleanup session</button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="session-strip">
        {PROFILE_ORDER.map((item) => (
          <button
            key={item}
            className={profile === item ? "session-chip active" : "session-chip"}
            onClick={() => newSession(item)}
          >
            {profileLabel(item)}
          </button>
        ))}
      </div>

      <div className="card">
        <h2>Navigation</h2>
        <div className="browser-toolbar">
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") navigate();
            }}
            placeholder="Search or enter address"
          />
          <button onClick={navigate} disabled={!address.trim()}>Evaluate</button>
        </div>

        <div className="mini-grid">
          <span>Session: {session.id.slice(0, 8)}</span>
          <span>Profile: {profileLabel(session.profile)}</span>
          <span>Current URL: {session.currentUrl || "none"}</span>
          <span>History: {session.policy.historyEnabled ? "enabled" : "ephemeral"}</span>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Permissions</h2>
          <div className="boundary-list">
            {PERMISSIONS.map((permission) => (
              <button
                className="ghost-button"
                key={permission}
                onClick={() => request(permission)}
              >
                Request {permission}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Downloads</h2>
          <input
            value={downloadUrl}
            onChange={(event) => setDownloadUrl(event.target.value)}
            placeholder="Download URL"
          />
          <button onClick={checkDownload}>Check download policy</button>
        </div>
      </div>

      <div className="card">
        <h2>Navigation History</h2>
        {history.length === 0 ? (
          <p className="muted">No navigation decisions yet.</p>
        ) : (
          <div className="audit-list">
            {history.map((entry) => (
              <div className="audit-row" key={entry.id}>
                <div>
                  <strong>{entry.decision.toUpperCase()}</strong>
                  <p>{entry.url}</p>
                  <p>{entry.reason}</p>
                </div>
                <span className="muted">{new Date(entry.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
