import { useEffect, useState } from "react";
import {
  PROFILE_ORDER,
  profileLabel,
  type SessionProfile,
} from "../../browser/profiles/profiles";
import type { BrowserPermission } from "../../browser/permissions/permissionManager";
import type { PermissionRecord } from "../../browser/permissions/registry/permissionRegistry";
import {
  browserEnginePermissionRecords,
  browserEngineRequestPermission,
  createBrowserEngineSession,
} from "../../browser/engine/browserEngineV05";

const PERMISSIONS: BrowserPermission[] = ["camera", "microphone", "location", "clipboard"];

export function PermissionsView() {
  const [profile, setProfile] = useState<SessionProfile>("temporary");
  const [session, setSession] = useState(() => createBrowserEngineSession("temporary"));
  const [records, setRecords] = useState<PermissionRecord[]>([]);
  const [error, setError] = useState("");

  async function refreshRecords() {
    try {
      setError("");
      setRecords(await browserEnginePermissionRecords());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  useEffect(() => {
    refreshRecords();
  }, []);

  function newSession(nextProfile: SessionProfile) {
    setProfile(nextProfile);
    setSession(createBrowserEngineSession(nextProfile));
  }

  async function request(permission: BrowserPermission) {
    try {
      setError("");
      await browserEngineRequestPermission(session, permission);
      await refreshRecords();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Permissions</h1>
          <p>v0.7 per-session permission registry with audit-backed decisions.</p>
        </div>
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

      <div className="grid">
        <div className="card">
          <h2>Current Session</h2>
          <div className="mini-grid">
            <span>Session: {session.id.slice(0, 8)}</span>
            <span>Profile: {profileLabel(session.profile)}</span>
            <span>Default: {session.policy.permissionDefault}</span>
            <span>Downloads: disabled</span>
          </div>
        </div>

        <div className="card">
          <h2>Request Permission</h2>
          <div className="boundary-list">
            {PERMISSIONS.map((permission) => (
              <button
                className="ghost-button"
                key={permission}
                onClick={() => request(permission)}
              >
                {permission}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Permission Decisions</h2>
        {records.length === 0 ? (
          <p className="muted">No permission decisions yet.</p>
        ) : (
          <div className="audit-list">
            {records.map((record) => (
              <div className="audit-row" key={record.id}>
                <div>
                  <strong>{record.permission} · {record.status}</strong>
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
