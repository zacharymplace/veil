export type NavigationEntry = {
  id: string;
  sessionId: string;
  url: string;
  at: string;
  decision: "allow" | "block" | "prompt";
  reason: string;
};

const KEY = "veil.browser.history";
let memoryHistory: NavigationEntry[] = [];

function hasLocalStorage(): boolean {
  return typeof globalThis.localStorage !== "undefined";
}

function read(): NavigationEntry[] {
  if (!hasLocalStorage()) return memoryHistory;

  try {
    return JSON.parse(globalThis.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(entries: NavigationEntry[]): void {
  const next = entries.slice(0, 250);

  if (!hasLocalStorage()) {
    memoryHistory = next;
    return;
  }

  globalThis.localStorage.setItem(KEY, JSON.stringify(next));
}

export function appendNavigationEntry(
  input: Omit<NavigationEntry, "id" | "at">
): NavigationEntry {
  const entry: NavigationEntry = {
    ...input,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };

  write([entry, ...read()]);
  return entry;
}

export function listNavigationHistory(): NavigationEntry[] {
  return read();
}

export function clearNavigationHistory(): void {
  memoryHistory = [];

  if (hasLocalStorage()) {
    globalThis.localStorage.removeItem(KEY);
  }
}
