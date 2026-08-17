import { runCoreDiagnostics } from "../../core";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const diagnostics = await runCoreDiagnostics();

assert(diagnostics.length >= 3, "core diagnostics should be registered");
assert(
  diagnostics.every((diagnostic) => diagnostic.passed),
  "all core diagnostics should pass"
);

console.log("PASS core smoke");
