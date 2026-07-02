import { useEffect, useState } from "react";
import type { Bookmark } from "../../lib/types";
import {
  listBookmarksAsync,
  removeBookmarkAsync,
  saveBookmarkAsync,
  wipeVaultAsync,
} from "./vaultAsync";

export function VaultView() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tagText, setTagText] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  async function refreshBookmarks() {
    setBookmarks(await listBookmarksAsync());
  }

  useEffect(() => {
    refreshBookmarks();
  }, []);

  async function addBookmark() {
    if (!url || !title) return;

    await saveBookmarkAsync({
      url,
      title,
      tags: tagText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      notes: "",
    });

    setUrl("");
    setTitle("");
    setTagText("");
    await refreshBookmarks();
  }

  async function deleteBookmark(id: string) {
    await removeBookmarkAsync(id);
    await refreshBookmarks();
  }

  async function wipeAll() {
    await wipeVaultAsync();
    setBookmarks([]);
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Vault</h1>
          <p>Rust-backed bookmark persistence prototype.</p>
        </div>
        <button className="danger-button" onClick={wipeAll}>Wipe vault</button>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Add bookmark</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" />
          <input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Tags, comma separated" />
          <button onClick={addBookmark}>Save bookmark</button>
        </div>

        <div className="card">
          <h2>Storage</h2>
          <div className="mini-grid">
            <span>Backend: Rust command</span>
            <span>Format: local JSON</span>
            <span>Encryption: planned</span>
            <span>Items: {bookmarks.length}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Recent bookmarks</h2>
        {bookmarks.length === 0 ? (
          <p className="muted">No bookmarks saved yet.</p>
        ) : (
          <div className="bookmark-table">
            {bookmarks.map((bookmark) => (
              <div className="bookmark-row" key={bookmark.id}>
                <div>
                  <strong>{bookmark.title}</strong>
                  <p>{bookmark.url}</p>
                </div>
                <div className="row-actions">
                  <span>{bookmark.tags.join(", ") || "Untagged"}</span>
                  <button className="ghost-button" onClick={() => deleteBookmark(bookmark.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
