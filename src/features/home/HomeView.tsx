import { useEffect, useState } from "react";
import { normalizeAddress } from "../../lib/url";
import {
  createSession,
  navigateSession,
  sessionLabel,
  type BrowserSession,
  type SessionProfile,
} from "../../services/browser/browserService";
import { defaultPrivacyReport, privacyScore } from "../../services/privacy/privacyService";
import { COLLECTIONS, vaultSummary } from "../../services/vault/vaultService";
import { saveBookmarkAsync } from "../vault/vaultAsync";

const PROFILES: SessionProfile[] = [
  "temporary",
  "research",
  "shopping",
  "medical",
  "financial",
  "adult",
];

const EMPTY_VAULT_SUMMARY = { bookmarks: 0, collections: COLLECTIONS.length, encrypted: false, storageMode: "SQLite" };

export function HomeView() {
  const [address, setAddress] = useState("");
  const [session, setSession] = useState<BrowserSession>(createSession("temporary"));
  const [error, setError] = useState("");
  const [vault, setVault] = useState(EMPTY_VAULT_SUMMARY);
  const score = privacyScore();

  async function refreshVaultSummary() {
    setVault(await vaultSummary());
  }

  useEffect(() => {
    refreshVaultSummary();
  }, []);

  function selectProfile(profile: SessionProfile) {
    setSession(createSession(profile));
    setAddress("");
  }

  function openAddress() {
    const nextUrl = normalizeAddress(address);
    if (!nextUrl) return;

    setSession((current) => navigateSession(current, nextUrl));
  }

  async function saveCurrent() {
    if (!session.currentUrl) return;

    try {
      setError("");
      await saveBookmarkAsync({
        title: session.currentUrl.replace(/^https?:\/\//, ""),
        url: session.currentUrl,
        tags: [session.profile],
        notes: `Saved from ${sessionLabel(session.profile)} session.`,
      });
      await refreshVaultSummary();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Browser</h1>
          <p>Compartmentalized private sessions with local-first vault controls.</p>
        </div>
        <button className="ghost-button" onClick={() => selectProfile("temporary")}>
          New temporary session
        </button>
      </div>

      <div className="session-strip">
        {PROFILES.map((profile) => (
          <button
            key={profile}
            className={session.profile === profile ? "session-chip active" : "session-chip"}
            onClick={() => selectProfile(profile)}
          >
            {sessionLabel(profile)}
          </button>
        ))}
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="browser-shell">
        <div className="browser-toolbar">
          <button className="circle-button" disabled>←</button>
          <button className="circle-button" disabled>→</button>
          <button className="circle-button" onClick={() => selectProfile(session.profile)}>↻</button>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") openAddress();
            }}
            placeholder="Search or enter address"
          />
          <button onClick={openAddress}>Open</button>
          <button onClick={saveCurrent} disabled={!session.currentUrl}>Save</button>
        </div>

        <div className="browser-canvas">
          {session.currentUrl ? (
            <div className="browser-preview">
              <span className="muted">{sessionLabel(session.profile)} session</span>
              <h2>{session.currentUrl}</h2>
              <p>
                WebView integration comes after session isolation, permission policy,
                and storage boundaries are implemented in Rust.
              </p>
            </div>
          ) : (
            <div>
              <h2>{sessionLabel(session.profile)} Session</h2>
              <p>
                Downloads are disabled and navigation is policy-governed. Cookie and
                storage isolation between profiles is not implemented yet.
              </p>
            </div>
          )}
        </div>

        <div className="browser-footer">
          <span>Session: {session.id.slice(0, 8)}</span>
          <span>Profile: {sessionLabel(session.profile)}</span>
          <span>Downloads disabled</span>
          <span>Cookies shared across profiles (isolation not yet implemented)</span>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Privacy Report</h2>
          <div className="privacy-score">
            <strong>{score}</strong>
            <span>Protection score</span>
          </div>

          <div className="mini-grid">
            <span>Trackers blocked: {defaultPrivacyReport.trackersBlocked}</span>
            <span>Cookies removed: {defaultPrivacyReport.cookiesRemoved}</span>
            <span>HTTPS upgrades: {defaultPrivacyReport.httpsUpgrades}</span>
            <span>Fingerprint attempts: {defaultPrivacyReport.fingerprintAttempts}</span>
          </div>
        </div>

        <div className="card">
          <h2>Vault</h2>
          <div className="mini-grid">
            <span>Bookmarks: {vault.bookmarks}</span>
            <span>Collections: {vault.collections}</span>
            <span>Storage: SQLite</span>
            <span>Encryption: planned</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Collections</h2>
        <div className="collection-grid">
          {COLLECTIONS.map((collection) => (
            <div className="collection-card" key={collection.id}>
              <strong>{collection.label}</strong>
              <p>{collection.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
