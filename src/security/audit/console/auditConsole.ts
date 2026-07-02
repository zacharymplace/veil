import {
  clearAuditEventsAsync,
  listAuditEventsAsync,
  type AuditEvent,
} from "../auditLog";

export type AuditConsoleSummary = {
  totalEvents: number;
  eventTypes: Record<string, number>;
  highSignalEvents: number;
  latestEventAt: string | null;
};

const HIGH_SIGNAL_PREFIXES = [
  "download.",
  "permission.",
  "policy.",
  "session.isolation.",
  "browser.cleanup",
];

export function summarizeAuditEvents(events: AuditEvent[]): AuditConsoleSummary {
  const eventTypes: Record<string, number> = {};

  for (const event of events) {
    eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
  }

  return {
    totalEvents: events.length,
    eventTypes,
    highSignalEvents: events.filter((event) =>
      HIGH_SIGNAL_PREFIXES.some((prefix) => event.type.startsWith(prefix))
    ).length,
    latestEventAt: events[0]?.at ?? null,
  };
}

export function filterAuditEvents(events: AuditEvent[], query: string): AuditEvent[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return events;

  return events.filter((event) => {
    return (
      event.type.toLowerCase().includes(normalized) ||
      event.summary.toLowerCase().includes(normalized) ||
      JSON.stringify(event.metadata ?? {}).toLowerCase().includes(normalized)
    );
  });
}

export function exportAuditEvents(events: AuditEvent[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      kind: "veil.audit-export",
      events,
      summary: summarizeAuditEvents(events),
    },
    null,
    2
  );
}

export async function loadAuditConsole() {
  const events = await listAuditEventsAsync();
  return {
    events,
    summary: summarizeAuditEvents(events),
  };
}

export async function clearAuditConsole(): Promise<void> {
  await clearAuditEventsAsync();
}
