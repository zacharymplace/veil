import { DEFAULT_COLLECTIONS } from "../../vault/collections/collectionsRepository";
import { listBookmarksAsync } from "../../features/vault/vaultAsync";

export const COLLECTIONS = DEFAULT_COLLECTIONS;

export async function vaultSummary() {
  const bookmarks = await listBookmarksAsync();

  return {
    bookmarks: bookmarks.length,
    collections: COLLECTIONS.length,
    encrypted: false,
    storageMode: "SQLite",
  };
}
