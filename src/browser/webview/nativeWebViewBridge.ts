import { invoke } from "@tauri-apps/api/core";

export type NativeWebViewResult = {
  status: "ready" | "blocked";
  reason: string;
};

export type WebViewBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function hasNativeWebViewSupport(): boolean {
  return hasTauriRuntime();
}

export async function showNativeWebView(input: {
  sessionId: string;
  profile: string;
  url: string;
  bounds: WebViewBounds;
}): Promise<NativeWebViewResult> {
  return invoke<NativeWebViewResult>("webview_show", {
    sessionId: input.sessionId,
    profile: input.profile,
    url: input.url,
    x: input.bounds.x,
    y: input.bounds.y,
    width: input.bounds.width,
    height: input.bounds.height,
  });
}

export async function hideNativeWebView(): Promise<void> {
  await invoke("webview_hide");
}

export async function setNativeWebViewBounds(bounds: WebViewBounds): Promise<void> {
  await invoke("webview_set_bounds", {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  });
}
