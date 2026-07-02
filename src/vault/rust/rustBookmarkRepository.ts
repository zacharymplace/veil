import { invoke } from "@tauri-apps/api/core";
import type { Bookmark } from "../../lib/types";

type SaveBookmarkInput = Omit<Bookmark, "id" | "createdAt" | "updatedAt">;

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const FALLBACK_KEY = "veil.vault.bookmarks.fallback";

function readFallback(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeFallback(bookmarks: Bookmark[]): void {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(bookmarks));
}

export async function listRustBookmarks(): Promise<Bookmark[]> {
  if (!hasTauriRuntime()) return readFallback();
  return invoke<Bookmark[]>("vault_list_bookmarks");
}

export async function createRustBookmark(input: SaveBookmarkInput): Promise<Bookmark> {
  if (!hasTauriRuntime()) {
    const now = new Date().toISOString();
    const bookmark: Bookmark = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    writeFallback([bookmark, ...readFallback()]);
    return bookmark;
  }

  return invoke<Bookmark>("vault_save_bookmark", {
    title: input.title,
    url: input.url,
    tags: input.tags,
    notes: input.notes ?? null,
    collectionId: input.collectionId ?? null,
  });
}

export async function deleteRustBookmark(id: string): Promise<void> {
  if (!hasTauriRuntime()) {
    writeFallback(readFallback().filter((bookmark) => bookmark.id !== id));
    return;
  }

  await invoke("vault_remove_bookmark", { id });
}

export async function wipeRustBookmarks(): Promise<void> {
  if (!hasTauriRuntime()) {
    localStorage.removeItem(FALLBACK_KEY);
    return;
  }

  await invoke("vault_wipe_bookmarks");
}
