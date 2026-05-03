"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { portfolioApps } from "@/consts/resumeData";
import { useRouteStateSync } from "@/hooks/window/useRouteStateSync";
import type { TimelineEventKind } from "@/types/observability/navigationTelemetry";
import type { SessionReplayLitePayload } from "@/types/observability/sessionReplayLite";
import { withBasePath } from "@/utils/basePath";
import {
  buildHealthInspectionHref,
  parseRouteInspectionFlowSearch,
  type RouteInspectionFlowSource,
} from "@/utils/observability/routeInspectionFlow";
import {
  parseSessionReplayLitePayload,
  SESSION_REPLAY_EVENT_KIND_ORDER,
} from "@/utils/observability/sessionReplayLite";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";

const formatMs = (value: number) => `${(value / 1000).toFixed(2)}s`;
const healthRoute = getPortfolioAppRouteContract(portfolioApps, "health");

export default function SessionReplayPageClient() {
  const [payload, setPayload] = React.useState<SessionReplayLitePayload | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [cursorMs, setCursorMs] = React.useState(0);
  const [focusedRoute, setFocusedRoute] = React.useState<string | null>(null);
  const [flowSource, setFlowSource] = React.useState<RouteInspectionFlowSource | null>(null);
  const [activeKinds, setActiveKinds] = React.useState<Set<TimelineEventKind>>(
    () => new Set(SESSION_REPLAY_EVENT_KIND_ORDER),
  );
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const maxMs = payload?.events.at(-1)?.relativeMs ?? 0;

  const visibleEvents = React.useMemo(() => {
    if (!payload) {
      return [];
    }
    return payload.events.filter(
      (event) =>
        event.relativeMs <= cursorMs &&
        activeKinds.has(event.kind) &&
        (focusedRoute == null || event.route === focusedRoute),
    );
  }, [activeKinds, cursorMs, focusedRoute, payload]);

  const availableRoutes = React.useMemo(() => {
    if (!payload) {
      return [];
    }
    return Array.from(new Set(payload.events.map((event) => event.route))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [payload]);
  const hasFocusedRouteEvents = focusedRoute ? availableRoutes.includes(focusedRoute) : true;
  const inspectHealthHref = focusedRoute
    ? withBasePath(
        buildHealthInspectionHref({
          healthRoute: healthRoute.route,
          route: focusedRoute,
          source: "health",
        }),
      )
    : null;

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
        const parsed = parseSessionReplayLitePayload(raw);
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

  useRouteStateSync({
    listenToLocationEvents: true,
    onLocationChange: (location) => {
      const parsed = parseRouteInspectionFlowSearch(location.search);
      setFocusedRoute(parsed.route);
      setFlowSource(parsed.source);
      setActiveKinds(
        new Set(parsed.kinds.length > 0 ? parsed.kinds : SESSION_REPLAY_EVENT_KIND_ORDER),
      );
    },
  });

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
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
            >
              Load Replay JSON
            </Button>
            {inspectHealthHref ? (
              <Button
                variant="text"
                href={inspectHealthHref}
                sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
              >
                Open in Health
              </Button>
            ) : null}
          </Stack>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={onSelectReplayFile}
          />
        </Stack>

        {focusedRoute ? (
          <Paper elevation={0} sx={{ p: 1.5, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Focused route scope: {focusedRoute}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Showing only replay events for this route
                {flowSource ? ` (opened from ${flowSource}).` : "."}
              </Typography>
              {!hasFocusedRouteEvents && payload ? (
                <Typography variant="caption" color="warning.main">
                  Loaded replay has no events for {focusedRoute}.
                </Typography>
              ) : null}
            </Stack>
          </Paper>
        ) : null}

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
                  {SESSION_REPLAY_EVENT_KIND_ORDER.map((kind) => (
                    <Chip
                      key={kind}
                      label={kind}
                      color={activeKinds.has(kind) ? "primary" : "default"}
                      onClick={() => toggleKind(kind)}
                      size="small"
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label="all-routes"
                    color={focusedRoute == null ? "primary" : "default"}
                    onClick={() => setFocusedRoute(null)}
                    size="small"
                  />
                  {availableRoutes.map((route) => (
                    <Chip
                      key={route}
                      label={route}
                      color={focusedRoute === route ? "primary" : "default"}
                      onClick={() => setFocusedRoute(route)}
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
              {focusedRoute
                ? `No replay loaded yet. Load replay JSON to inspect ${focusedRoute}.`
                : "No replay loaded yet. Export replay JSON from the telemetry overlay and load it here."}
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
