import { StatusPill } from "../../components/StatusPill";
import { ProtectionRow } from "../../components/ProtectionRow";

export function PrivacyView() {
  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Privacy</h1>
          <p>Session-level visibility without analytics or remote telemetry.</p>
        </div>
      </div>

      <div className="metric-grid">
        <StatusPill label="Trackers blocked today" value="0" />
        <StatusPill label="Third-party requests" value="0" />
        <StatusPill label="Cookies cleared" value="0" />
        <StatusPill label="Vault items" value="0" />
      </div>

      <div className="card">
        <h2>Protection Layers</h2>
        <ProtectionRow
          label="No telemetry"
          description="Veil does not collect product analytics."
          enabled
        />
        <ProtectionRow
          label="No account requirement"
          description="The app works without identity or cloud services."
          enabled
        />
        <ProtectionRow
          label="Encrypted local data"
          description="The local database is encrypted at rest with SQLCipher; the key is stored in the OS keychain."
          enabled
        />
      </div>
    </section>
  );
}
