import { useEffect, useState } from "react";
import {
  clearAuditEventsAsync,
  listAuditEventsAsync,
  type AuditEvent,
} from "../../security/audit/auditLog";

export function AuditView() {
  const [events, setEvents] = useState<AuditEvent[]>([]);

  async function refresh() {
    setEvents(await listAuditEventsAsync());
  }

  async function clear() {
    await clearAuditEventsAsync();
    await refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Audit</h1>
          <p>Rust-backed local policy, session, and navigation events.</p>
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
