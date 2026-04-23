"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { TimelineEvent, TimelineEventKind } from "@/types/observability/navigationTelemetry";
import type { TimelineMetadata } from "@/types/observability/navigationTelemetry";

type SessionReplayLitePayload = {
  exportedAt: string;
  sessionStartedAt: string;
  currentRoute: string;
  metrics: {
    latestRouteRenderMs: number | null;
    latestRouteTransitionMs: number | null;
    latestInteractionMs: number | null;
  };
  longTasks: Array<{ durationMs: number; atMs: number }>;
  events: TimelineEvent[];
};

const EVENT_KIND_ORDER: TimelineEventKind[] = [
  "route",
  "navigation",
  "pager",
  "media",
  "interaction",
  "long-task",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isTimelineMetadataValue = (value: unknown): value is string | number | boolean | null =>
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
  typeof value === "string" && EVENT_KIND_ORDER.includes(value as TimelineEventKind);

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

  return {
    id: Math.max(1, Math.round(asFiniteNumberOrNull(value.id) ?? fallbackId)),
    atIso: asStringOrFallback(value.atIso, new Date().toISOString()),
    relativeMs: Math.max(0, Math.round(relativeMs)),
    route: asStringOrFallback(value.route, fallbackRoute),
    kind,
    action,
    durationMs:
      asFiniteNumberOrNull(value.durationMs) === null
        ? undefined
        : Math.max(0, Math.round(asFiniteNumberOrNull(value.durationMs) as number)),
    metadata: normalizeTimelineMetadata(value.metadata),
  };
};

const parseReplayPayload = (raw: unknown): SessionReplayLitePayload | null => {
  if (!isRecord(raw) || !Array.isArray(raw.events)) {
    return null;
  }

  const fallbackRoute = asStringOrFallback(raw.currentRoute, "/");
  const events = raw.events
    .map((entry, index) => normalizeReplayEvent(entry, index + 1, fallbackRoute))
    .filter((entry): entry is TimelineEvent => entry !== null)
    .sort((left, right) => left.relativeMs - right.relativeMs)
    .map((entry, index) => ({ ...entry, id: index + 1 }));
  const metrics = isRecord(raw.metrics) ? raw.metrics : {};
  const longTasks = Array.isArray(raw.longTasks)
    ? raw.longTasks
        .map((entry) => {
          if (!isRecord(entry)) {
            return null;
          }
          const durationMs = asFiniteNumberOrNull(entry.durationMs);
          const atMs = asFiniteNumberOrNull(entry.atMs);
          if (durationMs === null || atMs === null) {
            return null;
          }
          return { durationMs, atMs };
        })
        .filter((entry): entry is { durationMs: number; atMs: number } => Boolean(entry))
    : [];

  return {
    exportedAt: asStringOrFallback(raw.exportedAt, new Date().toISOString()),
    sessionStartedAt: asStringOrFallback(raw.sessionStartedAt, new Date().toISOString()),
    currentRoute: fallbackRoute,
    metrics: {
      latestRouteRenderMs: asFiniteNumberOrNull(metrics.latestRouteRenderMs),
      latestRouteTransitionMs: asFiniteNumberOrNull(metrics.latestRouteTransitionMs),
      latestInteractionMs: asFiniteNumberOrNull(metrics.latestInteractionMs),
    },
    longTasks,
    events,
  };
};

const formatMs = (value: number) => `${(value / 1000).toFixed(2)}s`;

export default function SessionReplayPageClient() {
  const [payload, setPayload] = React.useState<SessionReplayLitePayload | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [cursorMs, setCursorMs] = React.useState(0);
  const [activeKinds, setActiveKinds] = React.useState<Set<TimelineEventKind>>(
    () => new Set(EVENT_KIND_ORDER),
  );
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const maxMs = payload?.events.at(-1)?.relativeMs ?? 0;

  const visibleEvents = React.useMemo(() => {
    if (!payload) {
      return [];
    }
    return payload.events.filter(
      (event) => event.relativeMs <= cursorMs && activeKinds.has(event.kind),
    );
  }, [activeKinds, cursorMs, payload]);

  const routeEvents = React.useMemo(
    () => visibleEvents.filter((event) => event.kind === "route" || event.kind === "navigation"),
    [visibleEvents],
  );
  const mediaEvents = React.useMemo(
    () => visibleEvents.filter((event) => event.kind === "media" || event.kind === "pager"),
    [visibleEvents],
  );

  const toggleKind = React.useCallback((kind: TimelineEventKind) => {
    setActiveKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  }, []);

  const onSelectReplayFile = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const raw = JSON.parse(await file.text()) as unknown;
        const parsed = parseReplayPayload(raw);
        if (!parsed) {
          throw new Error("Invalid replay JSON payload.");
        }
        setPayload(parsed);
        setErrorMessage(null);
        setCursorMs(parsed.events.at(-1)?.relativeMs ?? 0);
      } catch (error) {
        setPayload(null);
        setCursorMs(0);
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    },
    [],
  );

  return (
    <Box sx={{ minHeight: "100vh", px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Session Replay Lite Viewer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Load exported replay JSON and scrub interaction timeline by route/media events.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
          >
            Load Replay JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={onSelectReplayFile}
          />
        </Stack>

        {errorMessage ? (
          <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "error.main" }}>
            <Typography variant="body2" color="error.main">
              {errorMessage}
            </Typography>
          </Paper>
        ) : null}

        {payload ? (
          <>
            <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Timeline Scrubber
                </Typography>
                <Slider
                  value={cursorMs}
                  min={0}
                  max={Math.max(1, maxMs)}
                  onChange={(_, nextValue) => setCursorMs(nextValue as number)}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {EVENT_KIND_ORDER.map((kind) => (
                    <Chip
                      key={kind}
                      label={kind}
                      color={activeKinds.has(kind) ? "primary" : "default"}
                      onClick={() => toggleKind(kind)}
                      size="small"
                    />
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Cursor: {formatMs(cursorMs)} / {formatMs(Math.max(maxMs, 0))}
                </Typography>
              </Stack>
            </Paper>

            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5}>
              <Paper
                elevation={0}
                sx={{ p: 2, flex: 1, border: "1px solid", borderColor: "divider", minHeight: 320 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Route + Navigation Events ({routeEvents.length})
                </Typography>
                <Stack spacing={1} sx={{ maxHeight: 360, overflowY: "auto" }}>
                  {routeEvents.map((event) => (
                    <Box
                      key={`${event.id}-${event.kind}`}
                      sx={{ borderBottom: "1px dashed", borderColor: "divider", pb: 0.75 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {formatMs(event.relativeMs)} • {event.kind}
                      </Typography>
                      <Typography variant="body2">{event.action}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.route}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{ p: 2, flex: 1, border: "1px solid", borderColor: "divider", minHeight: 320 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Media + Pager Events ({mediaEvents.length})
                </Typography>
                <Stack spacing={1} sx={{ maxHeight: 360, overflowY: "auto" }}>
                  {mediaEvents.map((event) => (
                    <Box
                      key={`${event.id}-${event.kind}`}
                      sx={{ borderBottom: "1px dashed", borderColor: "divider", pb: 0.75 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {formatMs(event.relativeMs)} • {event.kind}
                      </Typography>
                      <Typography variant="body2">{event.action}</Typography>
                      {event.metadata ? (
                        <Typography variant="caption" color="text.secondary">
                          {JSON.stringify(event.metadata)}
                        </Typography>
                      ) : null}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </>
        ) : (
          <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary">
              No replay loaded yet. Export replay JSON from the telemetry overlay and load it here.
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
