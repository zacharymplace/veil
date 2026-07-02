import type { Bookmark } from "../../lib/types";
import {
  createVaultBookmark,
  deleteVaultBookmark,
  listVaultBookmarks,
  wipeVaultBookmarks,
} from "../../vault/bookmarks/bookmarkRepository";

export function listBookmarks(): Bookmark[] {
  return listVaultBookmarks();
}

export function saveBookmark(input: Omit<Bookmark, "id" | "createdAt" | "updatedAt">): Bookmark {
  return createVaultBookmark(input);
}

export function removeBookmark(id: string): void {
  deleteVaultBookmark(id);
}

export function wipeVault(): void {
  wipeVaultBookmarks();
}

export function countBookmarks(): number {
  return listVaultBookmarks().length;
}
