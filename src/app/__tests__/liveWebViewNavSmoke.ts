import fs from "node:fs";
import { strict as assert } from "node:assert";

const app = fs.readFileSync("src/App.tsx", "utf8");

assert(app.includes("LiveWebViewBindingView"), "App should import/render LiveWebViewBindingView");
assert(app.includes('"webview"'), "App should register webview view id");
assert(app.includes("WebView"), "App should expose WebView nav label");
assert(app.includes('activeView === "webview"'), "App should render WebView view when active");

console.log("PASS live webview nav smoke");
