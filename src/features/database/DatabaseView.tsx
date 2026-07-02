import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

type DatabaseStats = {
  database: string;
  bookmarks: number;
  auditEvents: number;
};

export function DatabaseView() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [exportText, setExportText] = useState("");

  async function refreshStats() {
    setStats(await invoke<DatabaseStats>("db_stats"));
  }

  async function exportJson() {
    setExportText(await invoke<string>("db_export_json"));
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Database</h1>
          <p>SQLite verification and local JSON export.</p>
        </div>

        <div className="row-actions">
          <button className="ghost-button" onClick={refreshStats}>Refresh</button>
          <button onClick={exportJson}>Export JSON</button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>SQLite Stats</h2>
          {stats ? (
            <div className="mini-grid">
              <span>Database: {stats.database}</span>
              <span>Bookmarks: {stats.bookmarks}</span>
              <span>Audit Events: {stats.auditEvents}</span>
              <span>Status: connected</span>
            </div>
          ) : (
            <p className="muted">Click Refresh to verify SQLite.</p>
          )}
        </div>

        <div className="card">
          <h2>Persistence Contract</h2>
          <div className="boundary-list">
            <span>SQLite backend</span>
            <span>Rust commands</span>
            <span>Local only</span>
            <span>JSON export</span>
          </div>
        </div>
      </div>

      {exportText && (
        <div className="card">
          <h2>Export Preview</h2>
          <pre>{exportText}</pre>
        </div>
      )}
    </section>
  );
}
