import { DEFAULT_COLLECTIONS } from "../../vault/collections/collectionsRepository";
import { listBookmarksAsync } from "../../features/vault/vaultAsync";

export const COLLECTIONS = DEFAULT_COLLECTIONS;

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function vaultSummary() {
  const bookmarks = await listBookmarksAsync();

  return {
    bookmarks: bookmarks.length,
    collections: COLLECTIONS.length,
    encrypted: hasTauriRuntime(),
    storageMode: "SQLite",
  };
}
