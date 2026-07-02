import { useMemo, useState } from "react";
import {
  PROFILE_ORDER,
  profileLabel,
  type SessionProfile,
} from "../../browser/profiles/profiles";
import {
  browserEngineCheckDownload,
  browserEngineDownloadRecords,
  createBrowserEngineSession,
} from "../../browser/engine/browserEngineV05";

export function DownloadGuardView() {
  const [profile, setProfile] = useState<SessionProfile>("temporary");
  const [session, setSession] = useState(() => createBrowserEngineSession("temporary"));
  const [url, setUrl] = useState("https://example.com/file.zip");
  const [version, setVersion] = useState(0);

  const records = useMemo(() => {
    version;
    return browserEngineDownloadRecords();
  }, [version]);

  function newSession(nextProfile: SessionProfile) {
    setProfile(nextProfile);
    setSession(createBrowserEngineSession(nextProfile));
    setVersion((current) => current + 1);
  }

  function evaluate() {
    browserEngineCheckDownload(session, url);
    setVersion((current) => current + 1);
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Download Guard</h1>
          <p>v0.8 blocks downloads by default and records file-risk decisions.</p>
        </div>
      </div>

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

      <div className="grid">
        <div className="card">
          <h2>Current Session</h2>
          <div className="mini-grid">
            <span>Session: {session.id.slice(0, 8)}</span>
            <span>Profile: {profileLabel(session.profile)}</span>
            <span>Downloads: disabled</span>
            <span>Policy: block by default</span>
          </div>
        </div>

        <div className="card">
          <h2>Evaluate Download</h2>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Download URL"
          />
          <button onClick={evaluate} disabled={!url.trim()}>
            Evaluate
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Download Decisions</h2>
        {records.length === 0 ? (
          <p className="muted">No download decisions yet.</p>
        ) : (
          <div className="audit-list">
            {records.map((record) => (
              <div className="audit-row" key={record.id}>
                <div>
                  <strong>{record.filename} · {record.status} · {record.risk}</strong>
                  <p>{record.url}</p>
                  <p>{record.reason}</p>
                  <pre>{JSON.stringify(record, null, 2)}</pre>
                </div>
                <span className="muted">{new Date(record.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
