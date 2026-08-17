import { useEffect, useState } from "react";
import { runCoreDiagnostics, getThreatModel, type CoreDiagnostic } from "../../core";

export function CoreView() {
  const [diagnostics, setDiagnostics] = useState<CoreDiagnostic[]>([]);
  const threatModel = getThreatModel();

  useEffect(() => {
    runCoreDiagnostics().then(setDiagnostics);
  }, []);

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Core</h1>
          <p>Veil Core v1.0 architecture, diagnostics, and operating boundaries.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Core Engines</h2>
          <div className="boundary-list">
            <span>Browser Engine</span>
            <span>Vault Engine</span>
            <span>Policy Engine</span>
            <span>Backup Engine</span>
            <span>Security Engine</span>
          </div>
        </div>

        <div className="card">
          <h2>Diagnostics</h2>
          {diagnostics.map((diagnostic) => (
            <div className="protection-row" key={diagnostic.name}>
              <div>
                <strong>{diagnostic.name}</strong>
                <p>{diagnostic.detail}</p>
              </div>
              <span className={diagnostic.passed ? "badge on" : "badge off"}>
                {diagnostic.passed ? "Pass" : "Fail"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Protects Against</h2>
          <div className="boundary-list">
            {threatModel.protectsAgainst.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Does Not Claim</h2>
          <div className="boundary-list">
            {threatModel.doesNotProtectAgainst.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
