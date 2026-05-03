"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { portfolioApps } from "@/consts/resumeData";
import { useHealthSnapshots } from "@/hooks/observability/useHealthSnapshots";
import { useRouteStateSync } from "@/hooks/window/useRouteStateSync";
import type { HealthStatus } from "@/types/observability/healthSnapshots";
import { withBasePath } from "@/utils/basePath";
import {
  deriveMediaRenderPerfStatus,
  deriveRouteInteractionBudgetStatus,
  formatHealthTimestamp,
  healthStatusToChipColor,
  readBundleRouteMap,
  readNestedFiniteCount,
  readNestedStatus,
  resolveRouteInteractionStatus,
  resolveRouteMediaStatus,
} from "@/utils/observability/healthSnapshots";
import {
  buildReplayInspectionHref,
  parseRouteInspectionFlowSearch,
  type RouteInspectionFlowSource,
} from "@/utils/observability/routeInspectionFlow";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";

const healthRoute = getPortfolioAppRouteContract(portfolioApps, "health");
const replayRoute = getPortfolioAppRouteContract(portfolioApps, "replay");

function StatusChip({ status }: { status: HealthStatus }) {
  return (
    <Chip
      label={status.toUpperCase()}
      color={healthStatusToChipColor(status)}
      size="small"
      sx={{ fontWeight: 700 }}
    />
  );
}

function SnapshotCard({
  title,
  status,
  summary,
  updatedAt,
  extraLines,
}: {
  title: string;
  status: HealthStatus;
  summary: string;
  updatedAt: string;
  extraLines?: string[];
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <StatusChip status={status} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {summary}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Updated: {updatedAt}
        </Typography>
        {extraLines?.map((line) => (
          <Typography key={line} variant="caption" color="text.secondary">
            {line}
          </Typography>
        ))}
      </Stack>
    </Paper>
  );
}

export default function HealthDashboardPageClient() {
  const [focusedRoute, setFocusedRoute] = React.useState<string | null>(null);
  const [flowSource, setFlowSource] = React.useState<RouteInspectionFlowSource | null>(null);
  const {
    aggregateSnapshot: snapshot,
    routeInteractionSnapshot: routeInteractionBudgets,
    mediaRenderPerfSnapshot,
    isLoading,
    errorMessage,
    refresh,
  } = useHealthSnapshots();

  const bundleSnapshot = snapshot?.snapshots.bundleBudget;
  const fileBudgetSnapshot = snapshot?.snapshots.fileBudgets;
  const schemaSnapshot = snapshot?.snapshots.schemaValidation;
  const typecheckSnapshot = snapshot?.snapshots.typecheckRunner;
  const testRunnerSnapshot = snapshot?.snapshots.testRunner;
  const a11yRunnerSnapshot = snapshot?.snapshots.a11yRunner;
  const fileBudgetDetails = fileBudgetSnapshot?.details ?? {};
  const testStatus =
    testRunnerSnapshot?.status ?? readNestedStatus(fileBudgetDetails, "testHealth");
  const a11yStatus =
    a11yRunnerSnapshot?.status ?? readNestedStatus(fileBudgetDetails, "a11yHealth");
  const totalTests = readNestedFiniteCount(fileBudgetDetails, "testHealth", "totalTestFiles");
  const totalA11yTests = readNestedFiniteCount(
    fileBudgetDetails,
    "a11yHealth",
    "totalA11yTestFiles",
  );
  const routeBudgetRoutes = React.useMemo(
    () => routeInteractionBudgets?.routes ?? [],
    [routeInteractionBudgets],
  );
  const interactionBudgetStatus = deriveRouteInteractionBudgetStatus(routeInteractionBudgets);
  const mediaRenderEntries = React.useMemo(
    () => mediaRenderPerfSnapshot?.entries ?? [],
    [mediaRenderPerfSnapshot],
  );
  const mediaRenderStatus = deriveMediaRenderPerfStatus(mediaRenderPerfSnapshot);
  const bundleRouteMap = React.useMemo(() => readBundleRouteMap(snapshot), [snapshot]);
  const focusedRouteBundle = focusedRoute ? (bundleRouteMap.get(focusedRoute) ?? null) : null;
  const focusedRouteInteraction =
    focusedRoute != null
      ? (routeBudgetRoutes.find((entry) => entry.route === focusedRoute) ?? null)
      : null;
  const focusedRouteMediaEntries = React.useMemo(
    () =>
      focusedRoute != null
        ? mediaRenderEntries.filter((entry) => entry.lastRoute === focusedRoute)
        : [],
    [focusedRoute, mediaRenderEntries],
  );
  const focusedRouteInteractionStatus =
    focusedRoute != null
      ? resolveRouteInteractionStatus(routeInteractionBudgets, focusedRoute)
      : { status: "unknown" as HealthStatus, detail: "No focused route." };
  const focusedRouteMediaStatus =
    focusedRoute != null
      ? resolveRouteMediaStatus(mediaRenderPerfSnapshot, focusedRoute)
      : { status: "unknown" as HealthStatus, detail: "No focused route." };
  const focusedBundleStatus: HealthStatus = focusedRouteBundle
    ? focusedRouteBundle.withinBudget
      ? "pass"
      : "fail"
    : "unknown";
  const focusedReplayHref = focusedRoute
    ? withBasePath(
        buildReplayInspectionHref({
          replayRoute: replayRoute.route,
          route: focusedRoute,
          source: "health",
          kinds: ["route", "navigation", "media", "pager"],
        }),
      )
    : null;
  const clearFocusedRouteHref = withBasePath(healthRoute.route);

  const interactionExtraLines = React.useMemo(() => {
    if (focusedRoute) {
      if (!focusedRouteInteraction) {
        return [`No route interaction snapshot entry found for ${focusedRoute}.`];
      }
      return [
        `${focusedRouteInteraction.route}: interaction ${
          focusedRouteInteraction.firstInteractionMs ?? "—"
        }ms · pager ${focusedRouteInteraction.firstPagerMs ?? "—"}ms · media ${
          focusedRouteInteraction.firstMediaMs ?? "—"
        }ms`,
      ];
    }

    if (routeBudgetRoutes.length > 0) {
      return routeBudgetRoutes
        .slice(0, 5)
        .map(
          (route) =>
            `${route.route}: interaction ${route.firstInteractionMs ?? "—"}ms · pager ${
              route.firstPagerMs ?? "—"
            }ms · media ${route.firstMediaMs ?? "—"}ms`,
        );
    }

    return ["Open portfolio routes in dev mode to populate this local telemetry snapshot."];
  }, [focusedRoute, focusedRouteInteraction, routeBudgetRoutes]);

  const mediaExtraLines = React.useMemo(() => {
    if (focusedRoute) {
      if (focusedRouteMediaEntries.length === 0) {
        return [`No media first-render samples found for ${focusedRoute}.`];
      }
      return focusedRouteMediaEntries.map(
        (entry) =>
          `${entry.mediaType}: avg ${entry.avgMs.toFixed(0)}ms (last ${entry.lastMs.toFixed(
            0,
          )}ms, budget ${entry.budgetMs}ms, status ${entry.status.toUpperCase()})`,
      );
    }

    if (mediaRenderEntries.length > 0) {
      return mediaRenderEntries.map(
        (entry) =>
          `${entry.mediaType}: avg ${entry.avgMs.toFixed(0)}ms (last ${entry.lastMs.toFixed(
            0,
          )}ms, budget ${entry.budgetMs}ms, status ${entry.status.toUpperCase()})`,
      );
    }

    return ["Open media panels in dev mode to populate renderer first-render telemetry."];
  }, [focusedRoute, focusedRouteMediaEntries, mediaRenderEntries]);

  useRouteStateSync({
    listenToLocationEvents: true,
    onLocationChange: (location) => {
      const parsed = parseRouteInspectionFlowSearch(location.search);
      setFocusedRoute(parsed.route);
      setFlowSource(parsed.source);
    },
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 3 },
        py: { xs: 2.5, md: 4 },
      }}
    >
      <Stack spacing={2.25}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          gap={1.5}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Health Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Route and app quality snapshots generated by local quality scripts.
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" gap={1}>
            <StatusChip status={snapshot?.overallStatus ?? "unknown"} />
            <Button variant="outlined" size="small" onClick={() => void refresh()}>
              Refresh
            </Button>
          </Stack>
        </Stack>

        {isLoading ? (
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
          >
            <Typography variant="body2" color="text.secondary">
              Loading health snapshots...
            </Typography>
          </Paper>
        ) : null}

        {!isLoading && errorMessage ? (
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Snapshots unavailable
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {errorMessage}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Run `npm run check:bundle-budget`, `npm run check:file-budgets`, and `npm run
              validate:resume:strict` to generate snapshots.
            </Typography>
          </Paper>
        ) : null}

        {focusedRoute ? (
          <Paper
            elevation={0}
            sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
          >
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Focused Route Inspection
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Route {focusedRoute}
                {flowSource ? ` (opened from ${flowSource})` : ""}.
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={`bundle ${focusedBundleStatus.toUpperCase()}`}
                  color={healthStatusToChipColor(focusedBundleStatus)}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`interaction ${focusedRouteInteractionStatus.status.toUpperCase()}`}
                  color={healthStatusToChipColor(focusedRouteInteractionStatus.status)}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={`media ${focusedRouteMediaStatus.status.toUpperCase()}`}
                  color={healthStatusToChipColor(focusedRouteMediaStatus.status)}
                  variant="outlined"
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {focusedRouteInteractionStatus.detail}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {focusedRouteMediaStatus.detail}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {focusedReplayHref ? (
                  <Button size="small" variant="outlined" href={focusedReplayHref}>
                    Inspect Replay Events
                  </Button>
                ) : null}
                <Button size="small" variant="text" href={clearFocusedRouteHref}>
                  Clear Route Focus
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        {!isLoading && !errorMessage ? (
          <Stack spacing={1.5}>
            <SnapshotCard
              title="Bundle Budget"
              status={bundleSnapshot?.status ?? "unknown"}
              summary={bundleSnapshot?.summary ?? "No bundle budget snapshot yet."}
              updatedAt={formatHealthTimestamp(bundleSnapshot?.generatedAt)}
            />
            <SnapshotCard
              title="Typecheck Health"
              status={typecheckSnapshot?.status ?? "unknown"}
              summary={typecheckSnapshot?.summary ?? "No typecheck snapshot yet."}
              updatedAt={formatHealthTimestamp(typecheckSnapshot?.generatedAt)}
            />
            <SnapshotCard
              title="Test Health"
              status={testStatus}
              summary={
                testRunnerSnapshot?.summary ??
                (totalTests == null
                  ? "No test-health inventory available yet."
                  : `Detected ${totalTests} test file(s) in repository scan.`)
              }
              updatedAt={formatHealthTimestamp(
                testRunnerSnapshot?.generatedAt ?? fileBudgetSnapshot?.generatedAt,
              )}
            />
            <SnapshotCard
              title="Accessibility (a11y) Health"
              status={a11yStatus}
              summary={
                a11yRunnerSnapshot?.summary ??
                (totalA11yTests == null
                  ? "No a11y-health inventory available yet."
                  : `Detected ${totalA11yTests} accessibility test file(s).`)
              }
              updatedAt={formatHealthTimestamp(
                a11yRunnerSnapshot?.generatedAt ?? fileBudgetSnapshot?.generatedAt,
              )}
            />
            <SnapshotCard
              title="Schema Validation"
              status={schemaSnapshot?.status ?? "unknown"}
              summary={schemaSnapshot?.summary ?? "No schema validation snapshot yet."}
              updatedAt={formatHealthTimestamp(schemaSnapshot?.generatedAt)}
            />
            <SnapshotCard
              title="Interaction Budgets (local)"
              status={focusedRoute ? focusedRouteInteractionStatus.status : interactionBudgetStatus}
              summary={
                focusedRoute
                  ? focusedRouteInteraction
                    ? `Focused route ${focusedRoute} interaction timings are available.`
                    : `No interaction budget entry found for focused route ${focusedRoute}.`
                  : routeBudgetRoutes.length > 0
                    ? `Captured first interaction timings for ${routeBudgetRoutes.length} route(s).`
                    : "No local route interaction budget snapshot found."
              }
              updatedAt={formatHealthTimestamp(routeInteractionBudgets?.generatedAt)}
              extraLines={interactionExtraLines}
            />
            <SnapshotCard
              title="Media First-Render Latency (local)"
              status={focusedRoute ? focusedRouteMediaStatus.status : mediaRenderStatus}
              summary={
                focusedRoute
                  ? focusedRouteMediaEntries.length === 0
                    ? `No media first-render samples captured for ${focusedRoute} yet.`
                    : `${focusedRouteMediaEntries.length} focused media sample(s) for ${focusedRoute}.`
                  : mediaRenderEntries.length === 0
                    ? "No media first-render samples captured yet."
                    : `${mediaRenderEntries.length} tracked media type(s) with renderer-level latency budgets.`
              }
              updatedAt={formatHealthTimestamp(mediaRenderPerfSnapshot?.generatedAt)}
              extraLines={mediaExtraLines}
            />
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Aggregate updated: {formatHealthTimestamp(snapshot?.generatedAt)}
              </Typography>
            </Paper>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}
