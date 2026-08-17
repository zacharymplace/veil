import { strict as assert } from "node:assert";
import { createBrowserEngineSession } from "../../browser/engine/browserEngineV05";
import {
  evaluateWebViewDownload,
  evaluateWebViewNavigation,
  evaluateWebViewPermission,
} from "../../browser/webview/webViewContract";

const session = createBrowserEngineSession("temporary");

const https = evaluateWebViewNavigation(session, "https://example.com");
assert.equal(https.ok, true, "https navigation should be allowed");

const http = evaluateWebViewNavigation(session, "http://example.com");
assert.equal(http.ok, false, "http navigation should be blocked");

const download = await evaluateWebViewDownload(session, "https://example.com/file.zip");
assert.equal(download.status, "blocked", "downloads should be blocked");

const camera = await evaluateWebViewPermission(session, "camera");
assert.equal(camera.status, "prompt", "camera should require prompt");

console.log("PASS webview contract smoke");
