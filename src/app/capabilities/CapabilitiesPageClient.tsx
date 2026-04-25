"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getAppCapabilityRegistry } from "@/components/portfolio/appCapabilityRegistry";
import { useHealthSnapshots } from "@/hooks/observability/useHealthSnapshots";
import type { HealthStatus } from "@/types/observability/healthSnapshots";
import {
  healthStatusToChipColor,
  readBundleRouteMap,
  resolveRouteInteractionStatus,
  resolveRouteMediaStatus,
  toHealthStatus,
} from "@/utils/observability/healthSnapshots";

const sortCapabilities = () =>
  [...getAppCapabilityRegistry()].sort((left, right) => {
    const byGroup = left.commandGroup.localeCompare(right.commandGroup, undefined, {
      sensitivity: "base",
    });
    if (byGroup !== 0) {
      return byGroup;
    }

    return left.label.localeCompare(right.label, undefined, { sensitivity: "base" });
  });

export default function CapabilitiesPageClient() {
  const capabilities = React.useMemo(sortCapabilities, []);
  const {
    aggregateSnapshot: healthSnapshot,
    routeInteractionSnapshot,
    mediaRenderPerfSnapshot: mediaPerfSnapshot,
    refresh: loadMeasuredSnapshots,
  } = useHealthSnapshots();

  const bundleRouteMap = React.useMemo(() => readBundleRouteMap(healthSnapshot), [healthSnapshot]);
  const testsStatus = toHealthStatus(healthSnapshot?.snapshots?.testRunner?.status);
  const a11yStatus = toHealthStatus(healthSnapshot?.snapshots?.a11yRunner?.status);

  return (
    <Box sx={{ minHeight: "100vh", px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 4 } }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          gap={1.2}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              App Capability Matrix
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Route capabilities with measured quality coverage from health snapshots, route
              interaction traces, and media render telemetry.
            </Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={() => void loadMeasuredSnapshots()}>
            Refresh Measured Data
          </Button>
        </Stack>

        <Stack spacing={1.5}>
          {capabilities.map((capability) => {
            const bundleRoute = bundleRouteMap.get(capability.href);
            const bundleStatus: HealthStatus = bundleRoute
              ? bundleRoute.withinBudget
                ? "pass"
                : "fail"
              : "unknown";
            const bundleDetail = bundleRoute
              ? `bundle ${Math.round(bundleRoute.totalKb ?? 0)}KB • largest ${Math.round(bundleRoute.largestKb ?? 0)}KB`
              : "No route-level bundle metrics found.";

            const interaction = resolveRouteInteractionStatus(
              routeInteractionSnapshot,
              capability.href,
            );
            const media = resolveRouteMediaStatus(mediaPerfSnapshot, capability.href);

            const measuredQuality = [
              {
                label: `tests ${testsStatus.toUpperCase()}`,
                status: testsStatus,
                detail: "Latest unit lane run.",
              },
              {
                label: `a11y ${a11yStatus.toUpperCase()}`,
                status: a11yStatus,
                detail: "Latest a11y lane run.",
              },
              {
                label: `bundle ${bundleStatus.toUpperCase()}`,
                status: bundleStatus,
                detail: bundleDetail,
              },
              {
                label: `interaction ${interaction.status.toUpperCase()}`,
                status: interaction.status,
                detail: interaction.detail,
              },
              {
                label: `media ${media.status.toUpperCase()}`,
                status: media.status,
                detail: media.detail,
              },
            ];

            return (
              <Paper
                key={capability.id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack spacing={1.15}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1.25}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {capability.label}
                      </Typography>
                      <Link href={capability.href} underline="hover" color="primary.main">
                        {capability.href}
                      </Link>
                    </Box>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        label={capability.commandGroup}
                        color="primary"
                        variant="outlined"
                      />
                      {capability.isPresentationProject ? (
                        <Chip
                          size="small"
                          label="presentation"
                          color="secondary"
                          variant="outlined"
                        />
                      ) : null}
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {capability.features.map((feature) => (
                      <Chip
                        key={`${capability.id}-feature-${feature}`}
                        size="small"
                        label={feature}
                      />
                    ))}
                  </Stack>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Measured Quality Coverage
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 0.5 }}
                    >
                      {measuredQuality.map((quality) => (
                        <Chip
                          key={`${capability.id}-quality-${quality.label}`}
                          size="small"
                          label={quality.label}
                          color={healthStatusToChipColor(quality.status)}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                    <Stack spacing={0.3} sx={{ mt: 0.75 }}>
                      {measuredQuality.map((quality) => (
                        <Typography
                          key={`${capability.id}-quality-detail-${quality.label}`}
                          variant="caption"
                          color="text.secondary"
                        >
                          {quality.detail}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                      Data Sources
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 0.5 }}
                    >
                      {capability.dataSources.map((source) => (
                        <Chip
                          key={`${capability.id}-source-${source}`}
                          size="small"
                          label={source}
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}
