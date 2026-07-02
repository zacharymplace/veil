import {
  browserEngineCheckDownload,
  browserEngineDownloadRecords,
  createBrowserEngineSession,
} from "../../browser/engine/browserEngineV05";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const session = createBrowserEngineSession("temporary");

const zip = browserEngineCheckDownload(session, "https://example.com/file.zip");
const png = browserEngineCheckDownload(session, "https://example.com/image.png");

assert(zip.status === "blocked", "zip download should be blocked");
assert(zip.risk === "high", "zip should be high risk");
assert(png.status === "blocked", "png download should still be blocked by default");
assert(png.risk === "low", "png should be low risk");

const records = browserEngineDownloadRecords();
assert(records.length >= 2, "download records should be stored");

console.log("PASS download guard smoke");
