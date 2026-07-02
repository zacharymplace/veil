import { useEffect, useMemo, useState } from "react";
import type { AuditEvent } from "../../security/audit/auditLog";
import {
  clearAuditConsole,
  exportAuditEvents,
  filterAuditEvents,
  loadAuditConsole,
  summarizeAuditEvents,
} from "../../security/audit/console/auditConsole";

export function AuditView() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [query, setQuery] = useState("");
  const [exportText, setExportText] = useState("");

  const filteredEvents = useMemo(() => filterAuditEvents(events, query), [events, query]);
  const summary = useMemo(() => summarizeAuditEvents(events), [events]);

  async function refresh() {
    const consoleState = await loadAuditConsole();
    setEvents(consoleState.events);
  }

  async function clear() {
    await clearAuditConsole();
    setExportText("");
    await refresh();
  }

  function exportJson() {
    setExportText(exportAuditEvents(filteredEvents));
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Audit</h1>
          <p>v0.9 console for local policy, session, permission, download, and database events.</p>
        </div>

        <div className="row-actions">
          <button className="ghost-button" onClick={refresh}>Refresh</button>
          <button className="ghost-button" onClick={exportJson}>Export</button>
          <button className="danger-button" onClick={clear}>Clear</button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Audit Summary</h2>
          <div className="mini-grid">
            <span>Total: {summary.totalEvents}</span>
            <span>High Signal: {summary.highSignalEvents}</span>
            <span>Types: {Object.keys(summary.eventTypes).length}</span>
            <span>Latest: {summary.latestEventAt ? new Date(summary.latestEventAt).toLocaleString() : "none"}</span>
          </div>
        </div>

        <div className="card">
          <h2>Event Types</h2>
          {Object.keys(summary.eventTypes).length === 0 ? (
            <p className="muted">No event types yet.</p>
          ) : (
            <div className="boundary-list">
              {Object.entries(summary.eventTypes).map(([type, count]) => (
                <span key={type}>{type}: {count}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Filters</h2>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by type, summary, or metadata"
        />
      </div>

      <div className="card">
        <h2>Event Log</h2>

        {filteredEvents.length === 0 ? (
          <p className="muted">No audit events match this view.</p>
        ) : (
          <div className="audit-list">
            {filteredEvents.map((event) => (
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

      {exportText && (
        <div className="card">
          <h2>Audit Export Preview</h2>
          <pre>{exportText}</pre>
        </div>
      )}
    </section>
  );
}
