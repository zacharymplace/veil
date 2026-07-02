import {
  browserEngineCheckDownload,
  browserEngineNavigate,
  browserEngineRequestPermission,
  createBrowserEngineSession,
} from "../../browser/engine/browserEngineV05";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const session = createBrowserEngineSession("temporary");
const nextSession = browserEngineNavigate(session, "example.com");

assert(nextSession.currentUrl === "https://example.com", "navigation should normalize HTTPS URL");

const download = browserEngineCheckDownload(nextSession, "https://example.com/file.zip");
assert(download.status === "blocked", "downloads should be blocked");

const camera = browserEngineRequestPermission(nextSession, "camera");
assert(camera.status === "prompt", "camera permission should prompt");

console.log("PASS browser engine smoke");
