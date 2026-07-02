export type View = "home" | "vault" | "privacy" | "settings";

export const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: "home", label: "Browser", icon: "◌" },
  { id: "vault", label: "Vault", icon: "◇" },
  { id: "privacy", label: "Privacy", icon: "盾" },
  { id: "settings", label: "Settings", icon: "⚙" },
];
