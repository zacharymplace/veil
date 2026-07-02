import { useMemo, useState } from "react";
import {
  PROFILE_ORDER,
  profileLabel,
  type SessionProfile,
} from "../../browser/profiles/profiles";
import {
  browserEngineCleanup,
  browserEngineIsolationScopes,
  createBrowserEngineSession,
} from "../../browser/engine/browserEngineV05";

export function SessionIsolationView() {
  const [profile, setProfile] = useState<SessionProfile>("temporary");
  const [version, setVersion] = useState(0);

  const scopes = useMemo(() => {
    version;
    return browserEngineIsolationScopes();
  }, [version]);

  function createSelected() {
    createBrowserEngineSession(profile);
    setVersion((current) => current + 1);
  }

  function cleanup(scopeId: string) {
    const scope = scopes.find((item) => item.sessionId === scopeId);
    if (!scope) return;

    const session = createBrowserEngineSession(scope.profile);
    Object.assign(session, { id: scope.sessionId });

    browserEngineCleanup(session);
    setVersion((current) => current + 1);
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Session Isolation</h1>
          <p>v0.6 namespaces history, cookies, cache, and storage by profile and session.</p>
        </div>
        <button onClick={createSelected}>Create scope</button>
      </div>

      <div className="session-strip">
        {PROFILE_ORDER.map((item) => (
          <button
            key={item}
            className={profile === item ? "session-chip active" : "session-chip"}
            onClick={() => setProfile(item)}
          >
            {profileLabel(item)}
          </button>
        ))}
      </div>

      <div className="card">
        <h2>Isolation Scopes</h2>
        {scopes.length === 0 ? (
          <p className="muted">No active isolation scopes.</p>
        ) : (
          <div className="audit-list">
            {scopes.map((scope) => (
              <div className="audit-row" key={scope.sessionId}>
                <div>
                  <strong>{profileLabel(scope.profile)}</strong>
                  <p>{scope.sessionId}</p>
                  <pre>{JSON.stringify(scope, null, 2)}</pre>
                </div>
                <button className="ghost-button" onClick={() => cleanup(scope.sessionId)}>
                  Cleanup
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
