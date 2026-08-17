import {
  browserEnginePermissionRecords,
  browserEngineRequestPermission,
  createBrowserEngineSession,
} from "../../browser/engine/browserEngineV05";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const session = createBrowserEngineSession("financial");
const camera = await browserEngineRequestPermission(session, "camera");
const location = await browserEngineRequestPermission(session, "location");

assert(camera.status === "prompt", "camera should prompt");
assert(location.status === "prompt", "location should prompt");
assert(camera.sessionId === session.id, "camera record should belong to session");
assert(location.sessionId === session.id, "location record should belong to session");

const records = await browserEnginePermissionRecords();
assert(records.length >= 2, "permission records should be stored");

console.log("PASS permission manager smoke");
