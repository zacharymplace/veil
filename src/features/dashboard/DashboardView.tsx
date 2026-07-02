import { StatusPill } from "../../components/StatusPill";
import { ProtectionRow } from "../../components/ProtectionRow";

export function DashboardView() {
  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Dashboard</h1>
          <p>Local-first private browsing vault.</p>
        </div>
        <button className="ghost-button">Lock</button>
      </div>

      <div className="metric-grid">
        <StatusPill label="Trackers blocked" value="0" />
        <StatusPill label="Cookies cleared" value="0" />
        <StatusPill label="HTTPS upgrades" value="0" />
        <StatusPill label="Session time" value="0m" />
      </div>

      <div className="grid">
        <div className="card">
          <h2>Privacy Status</h2>
          <ProtectionRow
            label="Tracker protection"
            description="Blocks known tracking and advertising requests."
            enabled
          />
          <ProtectionRow
            label="Cookie isolation"
            description="Clears session cookies and keeps browsing isolated."
            enabled
          />
          <ProtectionRow
            label="Local-only vault"
            description="Bookmarks and notes stay on this device."
            enabled
          />
          <ProtectionRow
            label="Auto-lock"
            description="Locks after 10 minutes of inactivity."
            enabled
          />
        </div>

        <div className="card">
          <h2>Boundaries</h2>
          <div className="boundary-list">
            <span>No hosting</span>
            <span>No scraping</span>
            <span>No downloads</span>
            <span>No analytics</span>
            <span>No accounts</span>
            <span>No engagement feed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
