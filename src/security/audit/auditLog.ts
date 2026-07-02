import { invoke } from "@tauri-apps/api/core";

export type AuditEvent = {
  id: string;
  at: string;
  type: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

type RustAuditEvent = {
  id: string;
  at: string;
  eventType: string;
  summary: string;
  metadataJson?: string | null;
};

let memoryEvents: AuditEvent[] = [];

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function fromRust(event: RustAuditEvent): AuditEvent {
  return {
    id: event.id,
    at: event.at,
    type: event.eventType,
    summary: event.summary,
    metadata: event.metadataJson ? JSON.parse(event.metadataJson) : undefined,
  };
}

export async function appendAuditEventAsync(
  input: Omit<AuditEvent, "id" | "at">
): Promise<AuditEvent> {
  if (!hasTauriRuntime()) {
    const event: AuditEvent = {
      ...input,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    };

    memoryEvents = [event, ...memoryEvents].slice(0, 500);
    return event;
  }

  const event = await invoke<RustAuditEvent>("audit_append_event", {
    eventType: input.type,
    summary: input.summary,
    metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
  });

  return fromRust(event);
}

export async function listAuditEventsAsync(): Promise<AuditEvent[]> {
  if (!hasTauriRuntime()) return memoryEvents;

  const events = await invoke<RustAuditEvent[]>("audit_list_events");
  return events.map(fromRust);
}

export async function clearAuditEventsAsync(): Promise<void> {
  if (!hasTauriRuntime()) {
    memoryEvents = [];
    return;
  }

  await invoke("audit_clear_events");
}

export function appendAuditEvent(input: Omit<AuditEvent, "id" | "at">): AuditEvent {
  const event: AuditEvent = {
    ...input,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };

  memoryEvents = [event, ...memoryEvents].slice(0, 500);

  void appendAuditEventAsync(input);

  return event;
}

export function listAuditEvents(): AuditEvent[] {
  return memoryEvents;
}

export function clearAuditEvents(): void {
  memoryEvents = [];
  void clearAuditEventsAsync();
}
