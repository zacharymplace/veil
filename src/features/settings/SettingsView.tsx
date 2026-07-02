import { ProtectionRow } from "../../components/ProtectionRow";

export function SettingsView() {
  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Settings</h1>
          <p>Control local privacy and safety defaults.</p>
        </div>
      </div>

      <div className="card">
        <h2>Safety Controls</h2>
        <ProtectionRow
          label="Adult gate"
          description="Requires explicit confirmation before entering the app."
          enabled
        />
        <ProtectionRow
          label="Session timer"
          description="Shows private browsing session duration."
          enabled
        />
        <ProtectionRow
          label="Panic close"
          description="Immediately closes private context."
          enabled
        />
        <ProtectionRow
          label="Cloud sync"
          description="Disabled by default."
          enabled={false}
        />
      </div>
    </section>
  );
}
