export type View = "home" | "vault" | "privacy" | "audit" | "database" | "core" | "settings";

export const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: "home", label: "Browser", icon: "◌" },
  { id: "vault", label: "Vault", icon: "◇" },
  { id: "privacy", label: "Privacy", icon: "盾" },
  { id: "audit", label: "Audit", icon: "◎" },
  { id: "database", label: "Database", icon: "▣" },
  { id: "core", label: "Core", icon: "◈" },
  { id: "settings", label: "Settings", icon: "⚙" },
];
