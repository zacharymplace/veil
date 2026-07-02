import { DEFAULT_COLLECTIONS } from "../../vault/collections/collectionsRepository";
import { listVaultBookmarks } from "../../vault/bookmarks/bookmarkRepository";

export const COLLECTIONS = DEFAULT_COLLECTIONS;

export function vaultSummary() {
  const bookmarks = listVaultBookmarks();

  return {
    bookmarks: bookmarks.length,
    collections: COLLECTIONS.length,
    encrypted: false,
    storageMode: "SQLite",
  };
}
