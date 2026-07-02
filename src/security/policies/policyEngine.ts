export type PolicyAction = "allow" | "block" | "prompt";

export type PolicyRequest =
  | { type: "navigation"; url: string }
  | { type: "download"; url: string }
  | { type: "permission"; permission: "camera" | "microphone" | "location" | "clipboard" }
  | { type: "storage"; scope: "cookies" | "cache" | "history" };

export type PolicyDecision = {
  action: PolicyAction;
  reason: string;
};

export function evaluatePolicy(request: PolicyRequest): PolicyDecision {
  if (request.type === "download") {
    return { action: "block", reason: "Downloads are disabled by default." };
  }

  if (request.type === "permission") {
    return { action: "prompt", reason: `${request.permission} requires explicit approval.` };
  }

  if (request.type === "navigation" && !request.url.startsWith("https://")) {
    return { action: "prompt", reason: "Non-HTTPS navigation requires confirmation." };
  }

  if (request.type === "storage") {
    return { action: "allow", reason: `${request.scope} is governed by session profile.` };
  }

  return { action: "allow", reason: "Allowed by default policy." };
}
