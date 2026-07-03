import { strict as assert } from "node:assert";
import { createBrowserEngineSession } from "../../browser/engine/browserEngineV05";
import {
  bindLiveWebViewNavigation,
  liveWebViewDownloadsAllowed,
} from "../../browser/webview/liveWebViewBinding";

const session = createBrowserEngineSession("temporary");

const https = bindLiveWebViewNavigation(session, "https://example.com");
assert.equal(https.status, "ready", "https should bind to live WebView");
assert.equal(https.targetUrl, "https://example.com", "https target should be retained");
assert.equal(liveWebViewDownloadsAllowed(https), false, "downloads should not be sandbox-enabled");

const http = bindLiveWebViewNavigation(session, "http://example.com");
assert.equal(http.status, "blocked", "http should be blocked");
assert.equal(http.targetUrl, null, "blocked navigation should not expose target URL");

console.log("PASS live webview binding smoke");
