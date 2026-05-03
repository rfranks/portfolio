import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import type { SequenceAnalysisOverlayData } from "../_utils/sequenceUtils";

type SequenceOverlayTracksProps = {
  activeSequenceLength: number;
  analysisExecutionModeLabel: string;
  overlayData: SequenceAnalysisOverlayData | null;
  overlayBusy: boolean;
  overlayStatus: string | null;
  showMotifOverlay: boolean;
  showHotspotOverlay: boolean;
  motifOverlaySummary: string | null;
  hotspotOverlaySummary: string | null;
  onToggleMotifOverlay: () => void;
  onToggleHotspotOverlay: () => void;
};

export default function SequenceOverlayTracks({
  activeSequenceLength,
  analysisExecutionModeLabel,
  overlayData,
  overlayBusy,
  overlayStatus,
  showMotifOverlay,
  showHotspotOverlay,
  motifOverlaySummary,
  hotspotOverlaySummary,
  onToggleMotifOverlay,
  onToggleHotspotOverlay,
}: SequenceOverlayTracksProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 0.5,
        mb: 1,
        p: 1.25,
        borderRadius: 2,
        bgcolor: "background.default",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Motif / hotspot overlay
        </Typography>
        <Chip size="small" variant="outlined" label={`Compute: ${analysisExecutionModeLabel}`} />
        {overlayBusy ? (
          <Chip
            size="small"
            color="info"
            icon={<CircularProgress size={12} />}
            label="Refreshing"
          />
        ) : null}
      </Box>
      {overlayStatus ? (
        <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 0.5 }}>
          {overlayStatus}
        </Typography>
      ) : null}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.75,
          mt: 0.75,
        }}
      >
        <Chip
          size="small"
          clickable
          color={showMotifOverlay ? "secondary" : "default"}
          variant={showMotifOverlay ? "filled" : "outlined"}
          label={motifOverlaySummary ?? "Motif markers"}
          onClick={onToggleMotifOverlay}
        />
        <Chip
          size="small"
          clickable
          color={showHotspotOverlay ? "primary" : "default"}
          variant={showHotspotOverlay ? "filled" : "outlined"}
          label={hotspotOverlaySummary ?? "GC hotspots"}
          onClick={onToggleHotspotOverlay}
        />
        <Typography variant="caption" color="text.secondary">
          Showing compressed overlays for {activeSequenceLength.toLocaleString("en-US")} bp.
        </Typography>
      </Box>
      {overlayData ? (
        <Box sx={{ display: "grid", gap: 0.75, mt: 1 }}>
          {showMotifOverlay ? (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                Motif markers {overlayData.motifTruncated ? "(sampled)" : "(full set)"}
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  height: 20,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                {overlayData.motifMatches.map((match, index) => {
                  const leftPct =
                    ((match.start - 1) / Math.max(1, overlayData.sequenceLength - 1)) * 100;
                  return (
                    <Box
                      key={`motif-overlay-${match.start}-${match.end}-${index}`}
                      title={`${match.motif} at bp ${match.start}-${match.end}`}
                      sx={{
                        position: "absolute",
                        top: 2,
                        bottom: 2,
                        width: "2px",
                        left: `calc(${leftPct}% - 1px)`,
                        bgcolor: "#8b5cf6",
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          ) : null}
          {showHotspotOverlay ? (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                GC hotspots {overlayData.gcHotspotTruncated ? "(sampled)" : "(full set)"}
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  height: 20,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                {overlayData.gcHotspots.map((anomaly, index) => {
                  const leftPct =
                    ((anomaly.windowStart - 1) / Math.max(1, overlayData.sequenceLength - 1)) * 100;
                  const widthPct = Math.max(
                    ((anomaly.windowEnd - anomaly.windowStart + 1) /
                      Math.max(1, overlayData.sequenceLength)) *
                      100,
                    0.28,
                  );
                  return (
                    <Box
                      key={`hotspot-overlay-${anomaly.windowStart}-${anomaly.windowEnd}-${index}`}
                      title={`bp ${anomaly.windowStart}-${anomaly.windowEnd} • GC ${anomaly.gcPct.toFixed(1)}% • Δ ${anomaly.deviationPct.toFixed(1)}%`}
                      sx={{
                        position: "absolute",
                        top: 3,
                        bottom: 3,
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        minWidth: "2px",
                        bgcolor: "#0ea5e9",
                        opacity: 0.85,
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          ) : null}
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          Preparing overlay tracks for this sequence...
        </Typography>
      )}
    </Paper>
  );
}
