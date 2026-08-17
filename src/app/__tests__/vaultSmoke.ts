import { saveBookmarkAsync, wipeVaultAsync } from "../../features/vault/vaultAsync";
import { vaultSummary } from "../../services/vault/vaultService";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

if (typeof (globalThis as { localStorage?: unknown }).localStorage === "undefined") {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

await wipeVaultAsync();

const before = await vaultSummary();
assert(before.bookmarks === 0, "vault should start empty for this smoke test");

await saveBookmarkAsync({
  title: "Example",
  url: "https://example.com",
  tags: [],
  notes: "",
});

const after = await vaultSummary();
assert(
  after.bookmarks === before.bookmarks + 1,
  "vaultSummary should reflect bookmarks saved through the real save path (regression: vaultSummary previously read from a disconnected, always-empty store)"
);

await wipeVaultAsync();

console.log("PASS vault smoke");
