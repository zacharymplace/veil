import { useState } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { type View } from "./lib/navigation";
import { adultGateCopy } from "./features/safety/safety";
import { HomeView } from "./features/home/HomeView";
import { VaultView } from "./features/vault/VaultView";
import { PrivacyView } from "./features/dashboard/PrivacyView";
import { AuditView } from "./features/audit/AuditView";
import { SettingsView } from "./features/settings/SettingsView";
import { DatabaseView } from "./features/database/DatabaseView";

export default function App() {
  const [adultGateAccepted, setAdultGateAccepted] = useState(false);
  const [activeView, setActiveView] = useState<View>("home");

  if (!adultGateAccepted) {
    return (
      <main className="gate-shell">
        <section className="gate-card">
          <div className="brand-mark large">V</div>
          <h1>Welcome to Veil</h1>
          <p>{adultGateCopy()}</p>
          <div className="boundary-list centered">
            <span>Local only</span>
            <span>No analytics</span>
            <span>No accounts</span>
            <span>No scraping</span>
            <span>No downloads</span>
          </div>
          <button onClick={() => setAdultGateAccepted(true)}>
            I am an adult. Continue.
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Sidebar activeView={activeView} onChange={setActiveView} />

      <section className="content-shell">
        {activeView === "home" && <HomeView />}
        {activeView === "vault" && <VaultView />}
        {activeView === "privacy" && <PrivacyView />}
        {activeView === "audit" && <AuditView />}
        {activeView === "database" && <DatabaseView />}
        {activeView === "settings" && <SettingsView />}
      </section>
    </main>
  );
}
