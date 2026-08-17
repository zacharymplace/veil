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
  const [exportPath, setExportPath] = useState("");
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [encryptedExport, setEncryptedExport] = useState("");
  const [readiness, setReadiness] = useState("");
  const [error, setError] = useState("");

  async function withErrorHandling(action: () => Promise<void>) {
    try {
      setError("");
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function refreshStats() {
    await withErrorHandling(async () => {
      setStats(await invoke<DatabaseStats>("db_stats"));
    });
  }

  async function exportJson() {
    await withErrorHandling(async () => {
      setExportText(await invoke<string>("db_export_json"));
    });
  }

  async function exportFile() {
    await withErrorHandling(async () => {
      setExportPath(await invoke<string>("db_export_file"));
    });
  }

  async function importJson() {
    await withErrorHandling(async () => {
      const result = await invoke<Record<string, number>>("db_import_json", {
        raw: importText,
      });

      setImportResult(JSON.stringify(result, null, 2));
      await refreshStats();
    });
  }

  async function checkEncryptionReadiness() {
    await withErrorHandling(async () => {
      const result = await invoke<Record<string, unknown>>("db_encryption_readiness");
      setReadiness(JSON.stringify(result, null, 2));
    });
  }

  async function exportEncrypted() {
    await withErrorHandling(async () => {
      setEncryptedExport(await invoke<string>("db_export_encrypted", { passphrase }));
    });
  }

  async function importEncrypted() {
    await withErrorHandling(async () => {
      const result = await invoke<Record<string, number>>("db_import_encrypted", {
        encryptedJson: importText,
        passphrase,
      });

      setImportResult(JSON.stringify(result, null, 2));
      await refreshStats();
    });
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
          <button className="ghost-button" onClick={exportJson}>Preview JSON</button>
          <button onClick={exportFile}>Export File</button>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

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

      <div className="card">
        <h2>Encrypted Export / Import</h2>
        <input
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="Passphrase, minimum 12 characters"
          type="password"
        />
        <div className="row-actions">
          <button className="ghost-button" onClick={checkEncryptionReadiness}>
            SQLCipher Gate
          </button>
          <button onClick={exportEncrypted} disabled={passphrase.length < 12}>
            Encrypted Export
          </button>
          <button onClick={importEncrypted} disabled={!importText.trim() || passphrase.length < 12}>
            Encrypted Import
          </button>
        </div>
        {readiness && <pre>{readiness}</pre>}
        {encryptedExport && <pre>{encryptedExport}</pre>}
      </div>

      <div className="card">
        <h2>Import Backup JSON</h2>
        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Paste Veil export JSON here"
        />
        <button onClick={importJson} disabled={!importText.trim()}>
          Import into SQLite
        </button>
        {importResult && <pre>{importResult}</pre>}
      </div>

      {exportPath && (
        <div className="card">
          <h2>Export File</h2>
          <p className="muted">{exportPath}</p>
        </div>
      )}

      {exportText && (
        <div className="card">
          <h2>Export Preview</h2>
          <pre>{exportText}</pre>
        </div>
      )}
    </section>
  );
}
