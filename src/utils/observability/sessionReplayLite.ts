import type {
  TimelineEvent,
  TimelineEventKind,
  TimelineMetadata,
  TimelineMetadataValue,
} from "@/types/observability/navigationTelemetry";
import type {
  SessionReplayLitePayload,
  SessionReplayLongTaskSample,
} from "@/types/observability/sessionReplayLite";

export const SESSION_REPLAY_EVENT_KIND_ORDER: readonly TimelineEventKind[] = [
  "route",
  "navigation",
  "pager",
  "media",
  "interaction",
  "long-task",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isTimelineMetadataValue = (value: unknown): value is TimelineMetadataValue =>
  value === null || ["string", "number", "boolean"].includes(typeof value);

const normalizeTimelineMetadata = (value: unknown): TimelineMetadata | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter(([, nested]) => isTimelineMetadataValue(nested));
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as TimelineMetadata;
};

const asFiniteNumberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asStringOrFallback = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const isTimelineEventKind = (value: unknown): value is TimelineEventKind =>
  typeof value === "string" && SESSION_REPLAY_EVENT_KIND_ORDER.includes(value as TimelineEventKind);

const normalizeReplayEvent = (
  value: unknown,
  fallbackId: number,
  fallbackRoute: string,
): TimelineEvent | null => {
  if (!isRecord(value)) {
    return null;
  }

  const kind = isTimelineEventKind(value.kind) ? value.kind : null;
  const action =
    typeof value.action === "string" && value.action.trim().length > 0 ? value.action.trim() : null;
  const relativeMs = asFiniteNumberOrNull(value.relativeMs);
  if (!kind || !action || relativeMs === null) {
    return null;
  }

  const durationMs = asFiniteNumberOrNull(value.durationMs);

  return {
    id: Math.max(1, Math.round(asFiniteNumberOrNull(value.id) ?? fallbackId)),
    atIso: asStringOrFallback(value.atIso, new Date().toISOString()),
    relativeMs: Math.max(0, Math.round(relativeMs)),
    route: asStringOrFallback(value.route, fallbackRoute),
    kind,
    action,
    durationMs: durationMs === null ? undefined : Math.max(0, Math.round(durationMs)),
    metadata: normalizeTimelineMetadata(value.metadata),
  };
};

const normalizeReplayLongTask = (value: unknown): SessionReplayLongTaskSample | null => {
  if (!isRecord(value)) {
    return null;
  }

  const durationMs = asFiniteNumberOrNull(value.durationMs);
  const atMs = asFiniteNumberOrNull(value.atMs);
  if (durationMs === null || atMs === null) {
    return null;
  }

  return {
    durationMs: Math.max(0, Math.round(durationMs)),
    atMs: Math.max(0, Math.round(atMs)),
  };
};

export function parseSessionReplayLitePayload(raw: unknown): SessionReplayLitePayload | null {
  if (!isRecord(raw) || !Array.isArray(raw.events)) {
    return null;
  }

  const fallbackRoute = asStringOrFallback(raw.currentRoute, "/");
  const events = raw.events
    .map((entry, index) => normalizeReplayEvent(entry, index + 1, fallbackRoute))
    .filter((entry): entry is TimelineEvent => entry !== null)
    .sort((left, right) => left.relativeMs - right.relativeMs)
    .map((entry, index) => ({ ...entry, id: index + 1 }));

  const metricsRecord = isRecord(raw.metrics) ? raw.metrics : {};
  const longTasks = Array.isArray(raw.longTasks)
    ? raw.longTasks
        .map((entry) => normalizeReplayLongTask(entry))
        .filter((entry): entry is SessionReplayLongTaskSample => entry !== null)
    : [];

  return {
    exportedAt: asStringOrFallback(raw.exportedAt, new Date().toISOString()),
    sessionStartedAt: asStringOrFallback(raw.sessionStartedAt, new Date().toISOString()),
    currentRoute: fallbackRoute,
    metrics: {
      latestRouteRenderMs: asFiniteNumberOrNull(metricsRecord.latestRouteRenderMs),
      latestRouteTransitionMs: asFiniteNumberOrNull(metricsRecord.latestRouteTransitionMs),
      latestInteractionMs: asFiniteNumberOrNull(metricsRecord.latestInteractionMs),
    },
    longTasks,
    events,
  };
}
