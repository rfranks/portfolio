"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { usePathname } from "next/navigation";
import {
  NAVIGATION_TELEMETRY_MAX_LONG_TASKS,
  NAVIGATION_TELEMETRY_MAX_TIMELINE_EVENTS,
} from "@/consts/observability/navigationTelemetry";
import { createLogger } from "@/utils/observability/logger";
import {
  markEnd,
  markStart,
  measureAfterNextPaint,
  observeLongTasks,
} from "@/utils/observability/perf";
import {
  getMediaActionLabelFromControlLabel,
  getTargetLabel,
  getTimestampMs,
  mapTelemetryChannelToTimelineKind,
} from "@/utils/observability/navigationTelemetry";
import {
  PORTFOLIO_MEDIA_TELEMETRY_ACTION,
  PORTFOLIO_TELEMETRY_EVENT,
} from "@/consts/observability/telemetryEvents";
import { addPortfolioWindowEventListener } from "@/utils/observability/telemetryEvents";
import type { PortfolioTelemetryEventDetail } from "@/types/observability/telemetryEvents";
import type {
  AppendTimelineOptions,
  TimelineEvent,
  TimelineEventKind,
} from "@/types/observability/navigationTelemetry";
import type {
  SessionReplayLitePayload,
  SessionReplayLongTaskSample,
} from "@/types/observability/sessionReplayLite";
import { parseSessionReplayLitePayload } from "@/utils/observability/sessionReplayLite";
import type { RouteInteractionBudgetSnapshot } from "@/types/observability/routeInteractionBudgets";
import {
  loadRouteInteractionBudgetSnapshotFromStorage,
  saveRouteInteractionBudgetSnapshotToStorage,
  updateRouteInteractionBudgetFromTimelineEvent,
} from "@/utils/observability/routeInteractionBudgets";
import {
  loadMediaRenderPerfSnapshotFromStorage,
  saveMediaRenderPerfSnapshotToStorage,
  updateMediaRenderPerfSnapshot,
} from "@/utils/observability/mediaRenderPerf";

const logger = createLogger("navigation");
const REPLAY_SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3, 4] as const;

export default function NavigationTelemetry() {
  const isDev = process.env.NODE_ENV !== "production";
  const pathname = usePathname();
  const activePathname = pathname || "/";
  const previousPathRef = useRef<string | null>(null);
  const currentPathRef = useRef<string>(activePathname);
  const interactionThrottleRef = useRef<number>(0);
  const sessionStartAtIsoRef = useRef(new Date().toISOString());
  const sessionStartPerformanceMsRef = useRef(getTimestampMs());
  const nextTimelineEventIdRef = useRef(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [timelinePaused, setTimelinePaused] = useState(false);
  const [latestRouteRenderMs, setLatestRouteRenderMs] = useState<number | null>(null);
  const [latestRouteTransitionMs, setLatestRouteTransitionMs] = useState<number | null>(null);
  const [latestInteractionMs, setLatestInteractionMs] = useState<number | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [longTasks, setLongTasks] = useState<SessionReplayLongTaskSample[]>([]);
  const [timelineViewMode, setTimelineViewMode] = useState<"live" | "replay">("live");
  const [replayPayload, setReplayPayload] = useState<SessionReplayLitePayload | null>(null);
  const [replayError, setReplayError] = useState<string | null>(null);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [replayCursorMs, setReplayCursorMs] = useState(0);
  const replayFileInputRef = useRef<HTMLInputElement | null>(null);
  const replayAnimationFrameRef = useRef<number | null>(null);
  const replayLastAnimationMsRef = useRef<number | null>(null);
  const replayCursorMsRef = useRef(0);
  const timelinePausedRef = useRef(timelinePaused);
  const timelineEventsRef = useRef<TimelineEvent[]>([]);
  const routeInteractionBudgetSnapshotRef = useRef<RouteInteractionBudgetSnapshot | null>(null);
  const mediaRenderPerfSnapshotRef = useRef(loadMediaRenderPerfSnapshotFromStorage());
  const replayMaxRelativeMs = replayPayload?.events.at(-1)?.relativeMs ?? 0;

  useEffect(() => {
    replayCursorMsRef.current = replayCursorMs;
  }, [replayCursorMs]);

  const overlayEnabledByQuery = useMemo(() => {
    if (!isDev || typeof window === "undefined") {
      return false;
    }

    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("perfDebug") === "1";
  }, [isDev]);

  useEffect(() => {
    timelinePausedRef.current = timelinePaused;
  }, [timelinePaused]);

  useEffect(() => {
    routeInteractionBudgetSnapshotRef.current = loadRouteInteractionBudgetSnapshotFromStorage();
    mediaRenderPerfSnapshotRef.current = loadMediaRenderPerfSnapshotFromStorage();
  }, []);

  const appendTimelineEvent = useCallback(
    (kind: TimelineEventKind, action: string, options?: AppendTimelineOptions) => {
      if (!isDev || timelinePausedRef.current) {
        return;
      }

      const nowMs = getTimestampMs();
      const timelineEvent: TimelineEvent = {
        id: nextTimelineEventIdRef.current + 1,
        atIso: new Date().toISOString(),
        relativeMs: Math.round(nowMs - sessionStartPerformanceMsRef.current),
        route: options?.route ?? currentPathRef.current,
        kind,
        action,
      };
      nextTimelineEventIdRef.current = timelineEvent.id;

      routeInteractionBudgetSnapshotRef.current = updateRouteInteractionBudgetFromTimelineEvent({
        current: routeInteractionBudgetSnapshotRef.current,
        event: timelineEvent,
      });
      if (routeInteractionBudgetSnapshotRef.current) {
        saveRouteInteractionBudgetSnapshotToStorage(routeInteractionBudgetSnapshotRef.current);
      }

      if (options?.durationMs !== undefined && options.durationMs !== null) {
        timelineEvent.durationMs = Math.round(options.durationMs);
      }
      if (options?.metadata) {
        timelineEvent.metadata = options.metadata;
      }

      setTimelineEvents((current) => {
        const next = [timelineEvent, ...current].slice(0, NAVIGATION_TELEMETRY_MAX_TIMELINE_EVENTS);
        timelineEventsRef.current = next;
        return next;
      });
    },
    [isDev],
  );

  useEffect(() => {
    currentPathRef.current = activePathname;
  }, [activePathname]);

  useEffect(() => {
    const previousPath = previousPathRef.current;

    if (previousPath) {
      const transitionDuration = markEnd("route-transition");
      if (isDev && transitionDuration !== null) {
        setLatestRouteTransitionMs(Math.round(transitionDuration));
      }
      appendTimelineEvent("route", "route-transition", {
        durationMs: transitionDuration,
        metadata: {
          from: previousPath,
          to: activePathname,
        },
      });
      logger.info("Route transition", {
        from: previousPath,
        to: activePathname,
        durationMs: transitionDuration === null ? null : Math.round(transitionDuration),
      });
    }

    const routeRenderMarkName = `route-render:${activePathname}`;
    markStart(routeRenderMarkName);
    const cancelPaintMeasure = measureAfterNextPaint(routeRenderMarkName, (durationMs) => {
      if (isDev && durationMs !== null) {
        setLatestRouteRenderMs(Math.round(durationMs));
      }
      appendTimelineEvent("route", "route-render", {
        durationMs,
        metadata: {
          route: activePathname,
        },
      });
      logger.debug("Route render", {
        route: activePathname,
        durationMs: durationMs === null ? null : Math.round(durationMs),
      });
    });

    appendTimelineEvent("route", previousPath ? "route-enter" : "session-entry", {
      metadata: {
        route: activePathname,
        from: previousPath,
      },
    });

    previousPathRef.current = activePathname;
    markStart("route-transition");

    return cancelPaintMeasure;
  }, [activePathname, appendTimelineEvent, isDev]);

  useEffect(() => {
    const disconnect = observeLongTasks((sample) => {
      if (isDev) {
        setLongTasks((current) =>
          [
            { durationMs: Math.round(sample.duration), atMs: Math.round(sample.startTime) },
            ...current,
          ].slice(0, NAVIGATION_TELEMETRY_MAX_LONG_TASKS),
        );
      }
      appendTimelineEvent("long-task", sample.name || "long-task", {
        durationMs: sample.duration,
        metadata: {
          startTimeMs: Math.round(sample.startTime),
        },
      });
      logger.warn("Long task", {
        route: currentPathRef.current,
        durationMs: Math.round(sample.duration),
        startTimeMs: Math.round(sample.startTime),
        name: sample.name,
      });
    });

    return disconnect;
  }, [appendTimelineEvent, isDev]);

  useEffect(() => {
    const recordInteraction = (event: Event) => {
      const targetLabel = getTargetLabel(event.target);
      const mediaAction = getMediaActionLabelFromControlLabel(targetLabel);
      if (mediaAction) {
        appendTimelineEvent("media", mediaAction, {
          metadata: {
            eventType: event.type,
            control: targetLabel,
          },
        });
      }

      const now = Date.now();
      if (now - interactionThrottleRef.current < 250) {
        return;
      }
      interactionThrottleRef.current = now;

      const markName = `ui-interaction:${event.type}:${Math.round(getTimestampMs())}`;
      const eventType = event.type;
      markStart(markName);
      measureAfterNextPaint(markName, (durationMs) => {
        if (isDev && durationMs !== null) {
          setLatestInteractionMs(Math.round(durationMs));
        }
        appendTimelineEvent("interaction", `interaction:${eventType}`, {
          durationMs,
          metadata: {
            control: targetLabel,
          },
        });
        logger.debug("Interaction latency", {
          route: currentPathRef.current,
          eventType,
          durationMs: durationMs === null ? null : Math.round(durationMs),
        });
      });
    };

    window.addEventListener("pointerdown", recordInteraction, { passive: true });
    window.addEventListener("keydown", recordInteraction);

    return () => {
      window.removeEventListener("pointerdown", recordInteraction);
      window.removeEventListener("keydown", recordInteraction);
    };
  }, [appendTimelineEvent, isDev]);

  useEffect(() => {
    if (!isDev) {
      return;
    }

    const removeTypedTelemetryListener = addPortfolioWindowEventListener(
      PORTFOLIO_TELEMETRY_EVENT.EMIT,
      (detail: PortfolioTelemetryEventDetail) => {
        if (!detail.action.trim()) {
          return;
        }

        const timelineKind = mapTelemetryChannelToTimelineKind(detail.channel);
        appendTimelineEvent(timelineKind, detail.action.trim(), {
          durationMs: detail.durationMs ?? null,
          metadata: {
            trigger: detail.trigger ?? null,
            control: detail.control ?? null,
            itemKey: detail.itemKey ?? null,
            mediaType: detail.mediaType ?? null,
            title: detail.title ?? null,
            source: detail.source ?? null,
            durationMs:
              typeof detail.durationMs === "number" && Number.isFinite(detail.durationMs)
                ? Math.round(detail.durationMs)
                : null,
          },
        });

        if (
          detail.action === PORTFOLIO_MEDIA_TELEMETRY_ACTION.FIRST_RENDER &&
          typeof detail.mediaType === "string" &&
          typeof detail.durationMs === "number" &&
          Number.isFinite(detail.durationMs)
        ) {
          mediaRenderPerfSnapshotRef.current = updateMediaRenderPerfSnapshot({
            current: mediaRenderPerfSnapshotRef.current,
            mediaType: detail.mediaType,
            durationMs: detail.durationMs,
            itemKey: detail.itemKey ?? null,
            route: currentPathRef.current,
            atIso: new Date().toISOString(),
          });

          if (mediaRenderPerfSnapshotRef.current) {
            saveMediaRenderPerfSnapshotToStorage(mediaRenderPerfSnapshotRef.current);
          }
        }
      },
    );

    return () => {
      removeTypedTelemetryListener();
    };
  }, [appendTimelineEvent, isDev]);

  useEffect(() => {
    if (!isDev) {
      return;
    }

    if (overlayEnabledByQuery) {
      setShowOverlay(true);
    }

    const handleToggle = (event: KeyboardEvent) => {
      if (!event.altKey || !event.shiftKey || event.key.toLowerCase() !== "l") {
        return;
      }
      event.preventDefault();
      setShowOverlay((current) => !current);
    };

    window.addEventListener("keydown", handleToggle);
    return () => {
      window.removeEventListener("keydown", handleToggle);
    };
  }, [isDev, overlayEnabledByQuery]);

  const clearTimeline = useCallback(() => {
    timelineEventsRef.current = [];
    setTimelineEvents([]);
    setLongTasks([]);
    setLatestInteractionMs(null);
    setLatestRouteRenderMs(null);
    setLatestRouteTransitionMs(null);
    appendTimelineEvent("interaction", "timeline-cleared");
  }, [appendTimelineEvent]);

  const copyTimelineJson = useCallback(async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      sessionStartedAt: sessionStartAtIsoRef.current,
      currentRoute: activePathname,
      metrics: {
        latestRouteRenderMs,
        latestRouteTransitionMs,
        latestInteractionMs,
      },
      longTasks,
      events: [...timelineEventsRef.current].reverse(),
    };

    const json = JSON.stringify(payload, null, 2);
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(json);
    appendTimelineEvent("interaction", "timeline-copy-json", {
      metadata: {
        bytes: json.length,
        eventCount: timelineEventsRef.current.length,
      },
    });
  }, [
    appendTimelineEvent,
    latestInteractionMs,
    latestRouteRenderMs,
    latestRouteTransitionMs,
    longTasks,
    activePathname,
  ]);

  const exportTimelineJson = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      sessionStartedAt: sessionStartAtIsoRef.current,
      currentRoute: activePathname,
      metrics: {
        latestRouteRenderMs,
        latestRouteTransitionMs,
        latestInteractionMs,
      },
      longTasks,
      events: [...timelineEventsRef.current].reverse(),
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `session-replay-lite-${Date.now()}.json`;
    anchor.click();
    window.URL.revokeObjectURL(objectUrl);

    appendTimelineEvent("interaction", "timeline-export-json", {
      metadata: {
        bytes: json.length,
        eventCount: timelineEventsRef.current.length,
      },
    });
  }, [
    appendTimelineEvent,
    latestInteractionMs,
    latestRouteRenderMs,
    latestRouteTransitionMs,
    longTasks,
    activePathname,
  ]);

  const stopReplayPlayback = useCallback(() => {
    if (replayAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(replayAnimationFrameRef.current);
      replayAnimationFrameRef.current = null;
    }
    replayLastAnimationMsRef.current = null;
    setReplayPlaying(false);
  }, []);

  useEffect(() => {
    if (!replayPayload) {
      if (timelineViewMode === "replay") {
        setTimelineViewMode("live");
      }
      return;
    }
    if (timelineViewMode === "live") {
      return;
    }
    if (!replayPlaying) {
      return;
    }

    const runFrame = (timestampMs: number) => {
      const previousAnimationMs = replayLastAnimationMsRef.current ?? timestampMs;
      replayLastAnimationMsRef.current = timestampMs;
      const elapsedMs = Math.max(0, timestampMs - previousAnimationMs);
      const nextCursor = Math.min(
        replayMaxRelativeMs,
        replayCursorMsRef.current + elapsedMs * replaySpeed,
      );
      replayCursorMsRef.current = nextCursor;
      setReplayCursorMs(Math.round(nextCursor));

      if (nextCursor >= replayMaxRelativeMs) {
        stopReplayPlayback();
        return;
      }

      replayAnimationFrameRef.current = window.requestAnimationFrame(runFrame);
    };

    replayAnimationFrameRef.current = window.requestAnimationFrame(runFrame);
    return () => {
      if (replayAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(replayAnimationFrameRef.current);
        replayAnimationFrameRef.current = null;
      }
      replayLastAnimationMsRef.current = null;
    };
  }, [
    replayMaxRelativeMs,
    replayPayload,
    replayPlaying,
    replaySpeed,
    stopReplayPlayback,
    timelineViewMode,
  ]);

  useEffect(() => {
    return () => {
      if (replayAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(replayAnimationFrameRef.current);
      }
    };
  }, []);

  const loadReplayFromFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";

      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const parsed = parseSessionReplayLitePayload(JSON.parse(text) as unknown);
        if (!parsed) {
          setReplayError("Invalid replay JSON shape.");
          setReplayPayload(null);
          setTimelineViewMode("live");
          stopReplayPlayback();
          return;
        }

        setReplayPayload(parsed);
        setReplayError(null);
        setReplayCursorMs(0);
        replayCursorMsRef.current = 0;
        setReplayPlaying(false);
        setTimelineViewMode("replay");
        appendTimelineEvent("interaction", "timeline-replay-loaded", {
          metadata: {
            fileName: file.name,
            eventCount: parsed.events.length,
          },
        });
      } catch {
        setReplayError("Failed to parse replay JSON.");
        setReplayPayload(null);
        setTimelineViewMode("live");
        stopReplayPlayback();
      }
    },
    [appendTimelineEvent, stopReplayPlayback],
  );

  const unloadReplay = useCallback(() => {
    stopReplayPlayback();
    setReplayPayload(null);
    setReplayError(null);
    setReplayCursorMs(0);
    replayCursorMsRef.current = 0;
    setTimelineViewMode("live");
    appendTimelineEvent("interaction", "timeline-replay-unloaded");
  }, [appendTimelineEvent, stopReplayPlayback]);

  const jumpReplayCursor = useCallback(
    (nextCursorMs: number) => {
      const clamped = Math.max(0, Math.min(replayMaxRelativeMs, Math.round(nextCursorMs)));
      setReplayCursorMs(clamped);
      replayCursorMsRef.current = clamped;
      replayLastAnimationMsRef.current = null;
    },
    [replayMaxRelativeMs],
  );

  const replayVisibleEvents = useMemo(() => {
    if (!replayPayload) {
      return [];
    }

    return replayPayload.events.filter((event) => event.relativeMs <= replayCursorMs);
  }, [replayCursorMs, replayPayload]);

  const displayedTimelineEvents = useMemo(() => {
    if (timelineViewMode === "replay" && replayPayload) {
      return [...replayVisibleEvents].reverse();
    }
    return timelineEvents;
  }, [timelineEvents, timelineViewMode, replayPayload, replayVisibleEvents]);

  const activeRoute =
    timelineViewMode === "replay" && replayPayload ? replayPayload.currentRoute : activePathname;
  const activeMetrics =
    timelineViewMode === "replay" && replayPayload
      ? replayPayload.metrics
      : {
          latestRouteRenderMs,
          latestRouteTransitionMs,
          latestInteractionMs,
        };
  const activeLongTaskCount =
    timelineViewMode === "replay" && replayPayload
      ? replayPayload.longTasks.length
      : longTasks.length;

  if (!isDev || !showOverlay) {
    return null;
  }

  return (
    <Box
      aria-label="Performance debug overlay"
      sx={(theme) => ({
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: theme.zIndex.tooltip + 1,
        minWidth: 240,
        maxWidth: 320,
        borderRadius: 1.25,
        border: "1px solid",
        borderColor: alpha(theme.palette.common.white, 0.25),
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.grey[900], 0.88)
            : alpha(theme.palette.common.white, 0.9),
        color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
        backdropFilter: "blur(8px)",
        p: 1.1,
        maxHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        gap: 0.85,
        pointerEvents: "auto",
      })}
    >
      <Typography variant="caption" sx={{ display: "block", fontWeight: 700 }}>
        Session Replay Lite
      </Typography>
      <Typography variant="caption" sx={{ display: "block", opacity: 0.78 }}>
        Alt+Shift+L · perfDebug=1
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        Route: {activeRoute}
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        Render: {activeMetrics.latestRouteRenderMs ?? "—"}ms
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        Transition: {activeMetrics.latestRouteTransitionMs ?? "—"}ms
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        Interaction: {activeMetrics.latestInteractionMs ?? "—"}ms
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        Timeline events: {displayedTimelineEvents.length}
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        Long tasks: {activeLongTaskCount}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.55 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setTimelinePaused((current) => !current)}
          sx={{ minWidth: 0, px: 0.9, py: 0.1, fontSize: "0.66rem" }}
        >
          {timelinePaused ? "Resume" : "Pause"}
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={clearTimeline}
          sx={{ minWidth: 0, px: 0.9, py: 0.1, fontSize: "0.66rem" }}
        >
          Clear
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            void copyTimelineJson();
          }}
          sx={{ minWidth: 0, px: 0.9, py: 0.1, fontSize: "0.66rem" }}
        >
          Copy JSON
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={exportTimelineJson}
          sx={{ minWidth: 0, px: 0.9, py: 0.1, fontSize: "0.66rem" }}
        >
          Export JSON
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => replayFileInputRef.current?.click()}
          sx={{ minWidth: 0, px: 0.9, py: 0.1, fontSize: "0.66rem" }}
        >
          Load JSON
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() =>
            setTimelineViewMode((current) =>
              current === "live" && replayPayload ? "replay" : "live",
            )
          }
          disabled={!replayPayload}
          sx={{ minWidth: 0, px: 0.9, py: 0.1, fontSize: "0.66rem" }}
        >
          {timelineViewMode === "replay" ? "Show Live" : "Show Replay"}
        </Button>
        {replayPayload ? (
          <Button
            size="small"
            variant="outlined"
            onClick={unloadReplay}
            sx={{ minWidth: 0, px: 0.9, py: 0.1, fontSize: "0.66rem" }}
          >
            Unload Replay
          </Button>
        ) : null}
      </Box>
      <input
        ref={replayFileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          void loadReplayFromFile(event);
        }}
        style={{ display: "none" }}
      />
      {replayError ? (
        <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
          {replayError}
        </Typography>
      ) : null}
      {timelineViewMode === "replay" && replayPayload ? (
        <Box
          sx={(theme) => ({
            borderRadius: 1,
            border: "1px solid",
            borderColor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.common.white, 0.2)
                : alpha(theme.palette.common.black, 0.16),
            p: 0.75,
            display: "flex",
            flexDirection: "column",
            gap: 0.6,
          })}
        >
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Replay Viewer
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.78 }}>
            {replayPayload.events.length} events · {replayCursorMs}ms / {replayMaxRelativeMs}ms
          </Typography>
          <Box sx={{ display: "flex", gap: 0.55, flexWrap: "wrap" }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                if (replayCursorMs >= replayMaxRelativeMs) {
                  jumpReplayCursor(0);
                }
                setReplayPlaying((current) => !current);
              }}
              sx={{ minWidth: 0, px: 0.8, py: 0.05, fontSize: "0.64rem" }}
            >
              {replayPlaying ? "Pause Replay" : "Play Replay"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                stopReplayPlayback();
                jumpReplayCursor(0);
              }}
              sx={{ minWidth: 0, px: 0.8, py: 0.05, fontSize: "0.64rem" }}
            >
              Restart
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setReplaySpeed((current) => (current < 4 ? current * 2 : 0.5))}
              sx={{ minWidth: 0, px: 0.8, py: 0.05, fontSize: "0.64rem" }}
            >
              Speed {replaySpeed}x
            </Button>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="caption" sx={{ minWidth: 32 }}>
              0
            </Typography>
            <Box
              component="input"
              type="range"
              min={0}
              max={Math.max(1, replayMaxRelativeMs)}
              step={1}
              value={Math.min(replayCursorMs, Math.max(1, replayMaxRelativeMs))}
              onChange={(event) => {
                jumpReplayCursor(Number(event.currentTarget.value));
              }}
              sx={{ width: "100%" }}
            />
            <Typography variant="caption" sx={{ minWidth: 42, textAlign: "right" }}>
              {replayMaxRelativeMs}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.4, flexWrap: "wrap" }}>
            {REPLAY_SPEED_OPTIONS.map((speedValue) => (
              <Button
                key={speedValue}
                size="small"
                variant={Math.abs(replaySpeed - speedValue) < 0.001 ? "contained" : "outlined"}
                onClick={() => setReplaySpeed(speedValue)}
                sx={{ minWidth: 0, px: 0.65, py: 0.05, fontSize: "0.62rem" }}
              >
                {speedValue}x
              </Button>
            ))}
          </Box>
        </Box>
      ) : null}

      <Divider
        sx={(theme) => ({
          borderColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.18)
              : alpha(theme.palette.common.black, 0.16),
        })}
      />

      <Box sx={{ overflow: "auto", minHeight: 120, maxHeight: "44vh", pr: 0.2 }}>
        {displayedTimelineEvents.length === 0 ? (
          <Typography variant="caption" sx={{ display: "block", opacity: 0.72 }}>
            no events yet
          </Typography>
        ) : (
          displayedTimelineEvents.map((timelineEvent) => (
            <Box key={timelineEvent.id} sx={{ mb: 0.45 }}>
              <Typography
                variant="caption"
                sx={{ display: "block", fontWeight: 700, lineHeight: 1.25 }}
              >
                +{timelineEvent.relativeMs}ms · {timelineEvent.kind}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  lineHeight: 1.22,
                  opacity: 0.92,
                }}
              >
                {timelineEvent.action}
                {timelineEvent.durationMs !== undefined ? ` (${timelineEvent.durationMs}ms)` : ""}
              </Typography>
              {timelineEvent.metadata ? (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    lineHeight: 1.2,
                    opacity: 0.72,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={JSON.stringify(timelineEvent.metadata)}
                >
                  {JSON.stringify(timelineEvent.metadata)}
                </Typography>
              ) : null}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
