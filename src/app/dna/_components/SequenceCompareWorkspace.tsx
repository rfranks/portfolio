import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import type {
  SequenceAnalysisPreset,
  SequenceAnalysisRecipeState,
} from "@/app/dna/_types/analysisPresets";
import type { Sequence } from "@/app/dna/_types/types";
import {
  buildSequenceCompareDiffReport,
  buildSequenceCompareHeatmapReport,
  createSequenceCompareDiffCsv,
  createSequenceCompareHeatmapCsv,
  type SequenceAnalysisRecipeConfig,
  type SequenceAnalysisRecipeKind,
  type SequenceCompareDiffReport,
  type SequenceCompareHeatmapReport,
} from "@/app/dna/_utils/sequenceUtils";
import {
  DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
  DNA_ANALYSIS_RECIPE_LABELS,
  normalizeSequenceAnalysisRecipeState,
} from "@/app/dna/_utils/analysisPresetState";

const CURRENT_SETUP_PRESET_VALUE = "__current_setup__";

export type SequenceCompareWorkspaceProps = {
  activeSequences: Sequence[];
  recipeState: SequenceAnalysisRecipeState;
  savedPresets: SequenceAnalysisPreset[];
  onApplyPresetState: (state: SequenceAnalysisRecipeState) => void;
};

const downloadTextReport = (content: string, fileName: string, mimeType: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

export default function SequenceCompareWorkspace({
  activeSequences,
  recipeState,
  savedPresets,
  onApplyPresetState,
}: SequenceCompareWorkspaceProps) {
  const theme = useTheme();
  const [selectedPresetName, setSelectedPresetName] = useState<string>(CURRENT_SETUP_PRESET_VALUE);
  const [heatmapReport, setHeatmapReport] = useState<SequenceCompareHeatmapReport | null>(null);
  const [diffReport, setDiffReport] = useState<SequenceCompareDiffReport | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const presetByName = useMemo(
    () => new Map(savedPresets.map((preset) => [preset.name, preset] as const)),
    [savedPresets],
  );

  const selectedPreset =
    selectedPresetName === CURRENT_SETUP_PRESET_VALUE
      ? null
      : (presetByName.get(selectedPresetName) ?? null);

  const effectiveRecipeState = useMemo(
    () =>
      normalizeSequenceAnalysisRecipeState(
        selectedPreset?.state ?? recipeState,
        DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
      ),
    [recipeState, selectedPreset?.state],
  );

  const selectedKinds = useMemo(
    () =>
      effectiveRecipeState.selectedRecipeKinds.length > 0
        ? effectiveRecipeState.selectedRecipeKinds
        : [effectiveRecipeState.activeRecipeKind],
    [effectiveRecipeState.activeRecipeKind, effectiveRecipeState.selectedRecipeKinds],
  );

  const recipeConfigs: SequenceAnalysisRecipeConfig[] = useMemo(
    () =>
      selectedKinds.map((kind) => ({
        kind,
        motif: effectiveRecipeState.motif,
        windowSize: effectiveRecipeState.gcWindowSize,
        gcThresholdPct: effectiveRecipeState.gcThresholdPct,
        minOrfCodons: effectiveRecipeState.minOrfCodons,
      })),
    [effectiveRecipeState, selectedKinds],
  );

  const runCompareWorkspace = useCallback(() => {
    if (activeSequences.length < 2) {
      setHeatmapReport(null);
      setDiffReport(null);
      setStatus("Select at least two active sequences to run compare workspace.");
      return;
    }

    const nextHeatmapReport = buildSequenceCompareHeatmapReport(activeSequences, recipeConfigs);
    const nextDiffReport = buildSequenceCompareDiffReport(activeSequences);
    setHeatmapReport(nextHeatmapReport);
    setDiffReport(nextDiffReport);
    setStatus(nextHeatmapReport.summary);
  }, [activeSequences, recipeConfigs]);

  useEffect(() => {
    if (!status) {
      return;
    }
    const timeout = window.setTimeout(() => setStatus(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const recipeMaxByKind = useMemo(() => {
    const maxByKind: Partial<Record<SequenceAnalysisRecipeKind, number>> = {};
    heatmapReport?.rows.forEach((row) => {
      row.recipeCells.forEach((cell) => {
        maxByKind[cell.kind] = Math.max(maxByKind[cell.kind] ?? 0, cell.value);
      });
    });
    return maxByKind;
  }, [heatmapReport?.rows]);

  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Multi-sequence compare workspace
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Compare active sequences with batch analysis presets, visualize recipe heatmap counts, and
        export heatmap/diff reports.
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 210 }}>
          <InputLabel id="compare-preset-select-label">Batch preset</InputLabel>
          <Select
            labelId="compare-preset-select-label"
            value={selectedPresetName}
            label="Batch preset"
            onChange={(event: SelectChangeEvent) => setSelectedPresetName(event.target.value)}
          >
            <MenuItem value={CURRENT_SETUP_PRESET_VALUE}>Current setup</MenuItem>
            {savedPresets.map((preset) => (
              <MenuItem key={`compare-preset-${preset.name}`} value={preset.name}>
                {preset.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          size="small"
          variant="outlined"
          disabled={!selectedPreset}
          onClick={() => {
            if (!selectedPreset) {
              return;
            }
            onApplyPresetState(
              normalizeSequenceAnalysisRecipeState(
                selectedPreset.state,
                DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
              ),
            );
            setStatus(`Applied preset "${selectedPreset.name}" to active recipe controls.`);
          }}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Apply preset to controls
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={runCompareWorkspace}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            bgcolor: "#0f766e",
            "&:hover": { bgcolor: "#115e59" },
          }}
        >
          Run compare workspace
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={!heatmapReport}
          onClick={() => {
            if (!heatmapReport) {
              return;
            }
            downloadTextReport(
              createSequenceCompareHeatmapCsv(heatmapReport),
              "dna-sequence-compare-heatmap.csv",
              "text/csv",
            );
          }}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Export heatmap CSV
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={!diffReport}
          onClick={() => {
            if (!diffReport) {
              return;
            }
            downloadTextReport(
              createSequenceCompareDiffCsv(diffReport),
              "dna-sequence-compare-diff.csv",
              "text/csv",
            );
          }}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Export diff CSV
        </Button>
      </Box>

      {status ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
          {status}
        </Typography>
      ) : null}

      {activeSequences.length < 2 ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Select two or more active sequences from the GeneBoard sequence selector to enable compare
          output.
        </Typography>
      ) : null}

      {heatmapReport ? (
        <Box sx={{ mt: 1.25, overflowX: "auto" }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            {heatmapReport.summary}
          </Typography>
          <Table size="small" sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Sequence</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 84 }}>Length</TableCell>
                {heatmapReport.recipeKinds.map((kind) => (
                  <TableCell key={`heatmap-header-${kind}`} sx={{ fontWeight: 700 }}>
                    {DNA_ANALYSIS_RECIPE_LABELS[kind]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {heatmapReport.rows.map((row) => (
                <TableRow key={`heatmap-row-${row.sequenceDescription}`}>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {row.sequenceDescription}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {row.sequenceType}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.sequenceLength.toLocaleString("en-US")}</TableCell>
                  {row.recipeCells.map((cell) => {
                    const maxValue = Math.max(1, recipeMaxByKind[cell.kind] ?? 1);
                    const intensity = Math.min(1, cell.value / maxValue);
                    const backgroundColor = alpha(
                      theme.palette.primary.main,
                      0.08 + intensity * 0.44,
                    );
                    return (
                      <TableCell
                        key={`heatmap-cell-${row.sequenceDescription}-${cell.kind}`}
                        sx={{ backgroundColor }}
                      >
                        <Tooltip title={cell.summary}>
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {cell.value}
                          </Box>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : null}

      {diffReport?.entries.length ? (
        <Box sx={{ mt: 1.25, display: "grid", gap: 0.75 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {diffReport.summary}
          </Typography>
          {diffReport.entries.map((entry) => (
            <Box
              key={`diff-entry-${entry.comparisonDescription}`}
              sx={{ p: 0.75, borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {entry.comparisonDescription}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {entry.mismatchCount.toLocaleString("en-US")} mismatches over{" "}
                {entry.comparedBasepairs.toLocaleString("en-US")} compared bp (
                {entry.mismatchPct.toFixed(2)}%) • length delta {entry.lengthDelta}
              </Typography>
              {entry.firstMismatches.length > 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  first mismatches:{" "}
                  {entry.firstMismatches
                    .slice(0, 6)
                    .map(
                      (mismatch) =>
                        `bp ${mismatch.position} ${mismatch.baselineBase}>${mismatch.comparisonBase}`,
                    )
                    .join("; ")}
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  no mismatches in compared range.
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      ) : null}
    </Paper>
  );
}
