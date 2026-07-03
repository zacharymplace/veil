import { strict as assert } from "node:assert";
import { createBrowserEngineSession } from "../../browser/engine/browserEngineV05";
import { bindLiveWebViewNavigation } from "../../browser/webview/liveWebViewBinding";
import {
  appendWebViewDecision,
  createWebViewDecisionEntry,
  webViewStatusLabel,
} from "../../browser/webview/decisions/webViewDecisionLog";

const session = createBrowserEngineSession("temporary");

const readyBinding = bindLiveWebViewNavigation(session, "https://example.com");
const readyEntry = createWebViewDecisionEntry(readyBinding, "2026-01-01T00:00:00.000Z");

assert.equal(readyEntry.status, "ready", "ready decision should be recorded");
assert.equal(readyEntry.downloadsAllowed, false, "downloads should remain blocked");
assert.equal(readyEntry.sandboxActive, true, "sandbox should be active");
assert.equal(webViewStatusLabel(readyEntry), "Ready", "ready label should be readable");

const blockedBinding = bindLiveWebViewNavigation(session, "http://example.com");
const log = appendWebViewDecision([readyEntry], blockedBinding, "2026-01-01T00:00:01.000Z");

assert.equal(log.length, 2, "decision log should append entries");
assert.equal(log[0].status, "blocked", "newest decision should be first");
assert(log[0].reason.includes("HTTPS"), "blocked reason should explain HTTPS requirement");

console.log("PASS webview decision log smoke");
