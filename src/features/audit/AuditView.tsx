import { useMemo, useState } from "react";
import { clearAuditEvents, listAuditEvents } from "../../security/audit/auditLog";

export function AuditView() {
  const [version, setVersion] = useState(0);

  const events = useMemo(() => {
    version;
    return listAuditEvents();
  }, [version]);

  function refresh() {
    setVersion((current) => current + 1);
  }

  function clear() {
    clearAuditEvents();
    refresh();
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Audit</h1>
          <p>Local policy, session, and navigation events.</p>
        </div>

        <div className="row-actions">
          <button className="ghost-button" onClick={refresh}>Refresh</button>
          <button className="danger-button" onClick={clear}>Clear</button>
        </div>
      </div>

      <div className="card">
        <h2>Event Log</h2>

        {events.length === 0 ? (
          <p className="muted">No audit events recorded yet.</p>
        ) : (
          <div className="audit-list">
            {events.map((event) => (
              <div className="audit-row" key={event.id}>
                <div>
                  <strong>{event.type}</strong>
                  <p>{event.summary}</p>
                  {event.metadata && (
                    <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                  )}
                </div>
                <span className="muted">{new Date(event.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
