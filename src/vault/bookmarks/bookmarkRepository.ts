import type { Bookmark } from "../../lib/types";

const KEY = "veil.vault.bookmarks";

function read(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(bookmarks: Bookmark[]) {
  localStorage.setItem(KEY, JSON.stringify(bookmarks));
}

export function listVaultBookmarks(): Bookmark[] {
  return read();
}

export function createVaultBookmark(input: Omit<Bookmark, "id" | "createdAt" | "updatedAt">): Bookmark {
  const now = new Date().toISOString();

  const bookmark: Bookmark = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  write([bookmark, ...read()]);
  return bookmark;
}

export function deleteVaultBookmark(id: string): void {
  write(read().filter((bookmark) => bookmark.id !== id));
}

export function wipeVaultBookmarks(): void {
  localStorage.removeItem(KEY);
}
