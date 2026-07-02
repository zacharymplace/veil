export type AuditEvent = {
  id: string;
  at: string;
  type: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

const KEY = "veil.audit.events";
let memoryEvents: AuditEvent[] = [];

function hasLocalStorage(): boolean {
  return typeof globalThis.localStorage !== "undefined";
}

function read(): AuditEvent[] {
  if (!hasLocalStorage()) return memoryEvents;

  try {
    return JSON.parse(globalThis.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(events: AuditEvent[]): void {
  if (!hasLocalStorage()) {
    memoryEvents = events;
    return;
  }

  globalThis.localStorage.setItem(KEY, JSON.stringify(events));
}

export function appendAuditEvent(input: Omit<AuditEvent, "id" | "at">): AuditEvent {
  const event: AuditEvent = {
    ...input,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };

  const events = [event, ...read()].slice(0, 250);
  write(events);
  return event;
}

export function listAuditEvents(): AuditEvent[] {
  return read();
}

export function clearAuditEvents(): void {
  memoryEvents = [];

  if (hasLocalStorage()) {
    globalThis.localStorage.removeItem(KEY);
  }
}
