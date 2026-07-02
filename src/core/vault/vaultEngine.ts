import type { Bookmark } from "../../lib/types";
import {
  listBookmarksAsync,
  removeBookmarkAsync,
  saveBookmarkAsync,
  wipeVaultAsync,
} from "../../features/vault/vaultAsync";
import { COLLECTIONS, vaultSummary } from "../../services/vault/vaultService";

export const CORE_COLLECTIONS = COLLECTIONS;

export async function listCoreBookmarks(): Promise<Bookmark[]> {
  return listBookmarksAsync();
}

export async function saveCoreBookmark(
  input: Omit<Bookmark, "id" | "createdAt" | "updatedAt">
): Promise<Bookmark> {
  return saveBookmarkAsync(input);
}

export async function removeCoreBookmark(id: string): Promise<void> {
  return removeBookmarkAsync(id);
}

export async function wipeCoreVault(): Promise<void> {
  return wipeVaultAsync();
}

export function coreVaultSummary() {
  return vaultSummary();
}
