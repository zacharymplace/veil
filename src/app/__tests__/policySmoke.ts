import { evaluatePolicy } from "../../security/policies/policyEngine";
import { createBrowserSession } from "../../browser/session/sessionManager";
import { PROFILE_POLICIES } from "../../browser/profiles/profiles";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const download = evaluatePolicy({ type: "download", url: "https://example.com/file.zip" });
assert(download.action === "block", "downloads should be blocked by default");

const permission = evaluatePolicy({ type: "permission", permission: "camera" });
assert(permission.action === "prompt", "camera should require prompt");

const temporary = createBrowserSession("temporary");
assert(temporary.policy.historyEnabled === false, "temporary profile should disable history");

const adult = PROFILE_POLICIES.adult;
assert(adult.cookiesPersist === false, "adult profile should not persist cookies");
assert(adult.downloadsEnabled === false, "adult profile should disable downloads");

console.log("PASS policy smoke");
