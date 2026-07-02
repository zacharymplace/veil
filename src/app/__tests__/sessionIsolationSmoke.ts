import {
  browserEngineCleanup,
  browserEngineIsolationScopes,
  createBrowserEngineSession,
} from "../../browser/engine/browserEngineV05";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const temporary = createBrowserEngineSession("temporary");
const research = createBrowserEngineSession("research");

const scopes = browserEngineIsolationScopes();

const temporaryScope = scopes.find((scope) => scope.sessionId === temporary.id);
const researchScope = scopes.find((scope) => scope.sessionId === research.id);

assert(temporaryScope, "temporary scope should exist");
assert(researchScope, "research scope should exist");
assert(
  temporaryScope?.historyNamespace !== researchScope?.historyNamespace,
  "sessions should have separate history namespaces"
);
assert(temporaryScope?.persistsHistory === false, "temporary history should be ephemeral");
assert(researchScope?.persistsHistory === true, "research history should persist");

browserEngineCleanup(temporary);

assert(
  !browserEngineIsolationScopes().some((scope) => scope.sessionId === temporary.id),
  "temporary scope should be removed after cleanup"
);

console.log("PASS session isolation smoke");
