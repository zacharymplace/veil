import { useState } from "react";
import { listBookmarks, removeBookmark, saveBookmark, wipeVault } from "./vault";

export function VaultView() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tagText, setTagText] = useState("");
  const [bookmarks, setBookmarks] = useState(listBookmarks());

  function addBookmark() {
    if (!url || !title) return;

    saveBookmark({
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
    setBookmarks(listBookmarks());
  }

  function deleteBookmark(id: string) {
    removeBookmark(id);
    setBookmarks(listBookmarks());
  }

  function wipeAll() {
    wipeVault();
    setBookmarks([]);
  }

  return (
    <section className="view">
      <div className="view-header">
        <div>
          <h1>Vault</h1>
          <p>Encrypted bookmark organization prototype.</p>
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
          <h2>Collections</h2>
          <div className="collection-list">
            <button>Favorites</button>
            <button>Research</button>
            <button>Saved</button>
            <button>Watch Later</button>
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
