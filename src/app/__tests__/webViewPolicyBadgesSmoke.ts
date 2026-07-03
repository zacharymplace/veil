import fs from "node:fs";
import { strict as assert } from "node:assert";

const source = fs.readFileSync("src/features/webview/LiveWebViewBindingView.tsx", "utf8");

assert(source.includes("policy-badge"), "WebView UI should include policy badges");
assert(source.includes("policy-reason"), "WebView UI should expose policy reason");
assert(source.includes("WebView Decision Log"), "WebView UI should include decision log");
assert(source.includes("appendWebViewDecision"), "WebView UI should record decisions");

console.log("PASS webview policy badges smoke");
