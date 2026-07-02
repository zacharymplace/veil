export type VaultCollection = {
  id: string;
  label: string;
  description: string;
};

export const DEFAULT_COLLECTIONS: VaultCollection[] = [
  { id: "research", label: "Research", description: "Private research links." },
  { id: "favorites", label: "Favorites", description: "Frequently used sites." },
  { id: "watch-later", label: "Watch Later", description: "Items saved for later." },
  { id: "saved-searches", label: "Saved Searches", description: "Reusable private searches." },
  { id: "pinned", label: "Pinned Sites", description: "Trusted starting points." },
];
