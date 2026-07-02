export type View = "home" | "browserEngine" | "sessionIsolation" | "permissions" | "downloads" | "vault" | "privacy" | "audit" | "database" | "core" | "settings";

export const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: "home", label: "Browser", icon: "◌" },
  { id: "browserEngine", label: "Engine", icon: "◉" },
  { id: "sessionIsolation", label: "Isolation", icon: "⬚" },
  { id: "permissions", label: "Permissions", icon: "◫" },
  { id: "downloads", label: "Downloads", icon: "⇩" },
  { id: "vault", label: "Vault", icon: "◇" },
  { id: "privacy", label: "Privacy", icon: "盾" },
  { id: "audit", label: "Audit", icon: "◎" },
  { id: "database", label: "Database", icon: "▣" },
  { id: "core", label: "Core", icon: "◈" },
  { id: "settings", label: "Settings", icon: "⚙" },
];
