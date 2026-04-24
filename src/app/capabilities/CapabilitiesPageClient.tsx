"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getAppCapabilityRegistry } from "@/components/portfolio/appCapabilityRegistry";

const sortCapabilities = () =>
  [...getAppCapabilityRegistry()].sort((left, right) =>
    left.label.localeCompare(right.label, undefined, { sensitivity: "base" }),
  );

export default function CapabilitiesPageClient() {
  const capabilities = React.useMemo(sortCapabilities, []);

  return (
    <Box sx={{ minHeight: "100vh", px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 4 } }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            App Capability Matrix
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generated from the shared capability registry, including feature surface, data sources,
            and quality coverage per app/project route.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {capabilities.map((capability) => (
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
              <Stack spacing={1.1}>
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
                    <Chip size="small" label={capability.kind} color="primary" variant="outlined" />
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
                    Data Sources
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
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

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Quality Coverage
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                    {capability.qualityCoverage.map((coverage) => (
                      <Chip
                        key={`${capability.id}-quality-${coverage}`}
                        size="small"
                        label={coverage}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
