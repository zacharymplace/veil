import type { Bookmark } from "../../lib/types";
import {
  createRustBookmark,
  deleteRustBookmark,
  listRustBookmarks,
  wipeRustBookmarks,
} from "../../vault/rust/rustBookmarkRepository";

export async function listBookmarksAsync(): Promise<Bookmark[]> {
  return listRustBookmarks();
}

export async function saveBookmarkAsync(
  input: Omit<Bookmark, "id" | "createdAt" | "updatedAt">
): Promise<Bookmark> {
  return createRustBookmark(input);
}

export async function removeBookmarkAsync(id: string): Promise<void> {
  return deleteRustBookmark(id);
}

export async function wipeVaultAsync(): Promise<void> {
  return wipeRustBookmarks();
}
