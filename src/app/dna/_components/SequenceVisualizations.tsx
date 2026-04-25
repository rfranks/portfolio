import { useCallback, useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Paper from "@mui/material/Paper";
import SequenceDisplay from "./SequenceDisplay";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";

import {
  Brush,
  ChatBubble,
  ContentCopy,
  FontDownload,
  FontDownloadOff,
  Numbers,
  Share,
} from "@mui/icons-material";

import { BasepairHistogram, GatesChart, QiChart, RandicChart, SquiggleChart } from "./charts";
import { Title } from "@/components/shared";
import { ChartMethod, Sequence } from "../_types/types";
import {
  createSequenceAnalysisReportMarkdown,
  runSequenceAnalysisRecipe,
  runSelectedSequenceAnalysisRecipes,
  type SequenceAnalysisBatchResult,
  type SequenceAnalysisRecipeKind,
  type SequenceAnalysisRecipeResult,
} from "../_utils/sequenceUtils";
import SequenceCompareWorkspace from "./SequenceCompareWorkspace";
import type {
  SequenceAnalysisPreset,
  SequenceAnalysisRecipeState,
} from "../_types/analysisPresets";
import {
  buildSequenceAnalysisShareUrl,
  DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
  DNA_ANALYSIS_PRESET_STORAGE_KEY,
  DNA_ANALYSIS_RECIPE_LABELS,
  DNA_ANALYSIS_RECIPE_OPTIONS,
  loadStoredSequenceAnalysisPresets,
  normalizeSequenceAnalysisRecipeState,
  resolveSequenceAnalysisStateFromSearch,
  serializeSequenceAnalysisPresets,
  upsertSequenceAnalysisPreset,
} from "../_utils/analysisPresetState";

export type SequenceVisualizationsProps = {
  activeSequences?: Sequence[] | null;
  bpRange?: number[] | null;
  onBpRangeUpdate?: (bpRange: number[]) => void;
  chartMethod?: ChartMethod | null;
  onChartMethodUpdate?: (chartMethod: ChartMethod) => void;
};

export default function SequenceVisualizations({
  activeSequences = [],
  bpRange = [],
  chartMethod = "sequence",
  onBpRangeUpdate,
  onChartMethodUpdate,
}: SequenceVisualizationsProps) {
  const minBasePair = bpRange?.[0] || 1;
  const maxBasePair = bpRange?.[1] || activeSequences?.[0]?.sequence?.length || 1;

  const [colorizeSequence, setColorizeSequence] = useState<boolean>(true);
  const [displaySequenceText, setDisplaySequenceText] = useState<boolean>(true);
  const [displayTooltip, setDisplayTooltip] = useState<boolean>(true);
  const [displayBinary, setDisplayBinary] = useState<boolean>(false);
  const [showProteins, setShowProteins] = useState<boolean>(false);
  const [recipeKind, setRecipeKind] = useState<SequenceAnalysisRecipeKind>(
    DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.activeRecipeKind,
  );
  const [motif, setMotif] = useState(DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.motif);
  const [gcWindowSize, setGcWindowSize] = useState(
    DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.gcWindowSize,
  );
  const [gcThresholdPct, setGcThresholdPct] = useState(
    DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.gcThresholdPct,
  );
  const [minOrfCodons, setMinOrfCodons] = useState(
    DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.minOrfCodons,
  );
  const [analysisResult, setAnalysisResult] = useState<SequenceAnalysisRecipeResult | null>(null);
  const [analysisBatchResult, setAnalysisBatchResult] =
    useState<SequenceAnalysisBatchResult | null>(null);
  const [selectedRecipeKinds, setSelectedRecipeKinds] = useState<SequenceAnalysisRecipeKind[]>([
    ...DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.selectedRecipeKinds,
  ]);
  const [presetName, setPresetName] = useState("");
  const [savedPresets, setSavedPresets] = useState<SequenceAnalysisPreset[]>([]);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const activeSequence = activeSequences?.[0];
  const isSequenceChart = chartMethod === "sequence";
  const recipeState = useMemo<SequenceAnalysisRecipeState>(
    () => ({
      activeRecipeKind: recipeKind,
      selectedRecipeKinds,
      motif,
      gcWindowSize,
      gcThresholdPct,
      minOrfCodons,
    }),
    [gcThresholdPct, gcWindowSize, minOrfCodons, motif, recipeKind, selectedRecipeKinds],
  );

  const applyRecipeState = useCallback((state: SequenceAnalysisRecipeState) => {
    setRecipeKind(state.activeRecipeKind);
    setSelectedRecipeKinds(state.selectedRecipeKinds);
    setMotif(state.motif);
    setGcWindowSize(state.gcWindowSize);
    setGcThresholdPct(state.gcThresholdPct);
    setMinOrfCodons(state.minOrfCodons);
  }, []);

  useEffect(() => {
    setSelectedRecipeKinds((current) => {
      if (current.includes(recipeKind)) {
        return current;
      }
      const nextKinds = [recipeKind, ...current];
      return DNA_ANALYSIS_RECIPE_OPTIONS.filter((recipeOption) => nextKinds.includes(recipeOption));
    });
  }, [recipeKind]);

  const getChartMethodTitle = (chartMethod?: ChartMethod | null): string => {
    switch (chartMethod) {
      case "bpcontent":
        return "Basepair Content Histograms";
      case "squiggle":
        return (activeSequences?.length || 0) > 1 ? "Squiggle Charts" : "Squiggle Chart";
      case "gates":
        return "Gates Chart";
      case "qi":
        return "Qi Chart";
      case "sequence":
        return (activeSequences?.length || 0) > 1 ? "Sequences" : "Sequence";
      case "analysis":
        return "Sequence Analysis";
      case "randic":
        return (activeSequences?.length || 0) > 1 ? "Randic Charts" : "Randic Chart";
      default:
        return "";
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const loadedPresets = loadStoredSequenceAnalysisPresets((storageKey) =>
      window.localStorage.getItem(storageKey),
    );
    setSavedPresets(loadedPresets.presets);
    if (loadedPresets.migratedFromLegacyStorage) {
      window.localStorage.setItem(
        DNA_ANALYSIS_PRESET_STORAGE_KEY,
        serializeSequenceAnalysisPresets(loadedPresets.presets),
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const sharedState = resolveSequenceAnalysisStateFromSearch(window.location.search);
    applyRecipeState(sharedState);
  }, [applyRecipeState]);

  const runAnalysisRecipe = () => {
    if (!activeSequence?.sequence?.length) {
      setAnalysisResult(null);
      setAnalysisBatchResult(null);
      return;
    }
    setAnalysisResult(
      runSequenceAnalysisRecipe(activeSequence.sequence, {
        kind: recipeKind,
        motif,
        windowSize: gcWindowSize,
        gcThresholdPct,
        minOrfCodons,
      }),
    );
  };

  const buildRecipeConfig = (kind: SequenceAnalysisRecipeKind) => ({
    kind,
    motif,
    windowSize: gcWindowSize,
    gcThresholdPct,
    minOrfCodons,
  });

  const runSelectedRecipes = () => {
    if (!activeSequence?.sequence?.length) {
      setAnalysisResult(null);
      setAnalysisBatchResult(null);
      return;
    }

    const selectedKinds = selectedRecipeKinds.length > 0 ? selectedRecipeKinds : [recipeKind];
    const report = runSelectedSequenceAnalysisRecipes(
      activeSequence.sequence,
      selectedKinds.map((kind) => buildRecipeConfig(kind)),
    );
    setAnalysisBatchResult(report);
    const activeRecipeResult = report.recipes.find((recipe) => recipe.kind === recipeKind) ?? null;
    setAnalysisResult(activeRecipeResult);
  };

  const toggleRecipeSelection = (kind: SequenceAnalysisRecipeKind) => {
    setSelectedRecipeKinds((current) => {
      const nextKinds = current.includes(kind)
        ? current.filter((entry) => entry !== kind)
        : [...current, kind];
      return normalizeSequenceAnalysisRecipeState(
        {
          ...recipeState,
          selectedRecipeKinds: nextKinds,
        },
        recipeState,
      ).selectedRecipeKinds;
    });
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

  const exportBatchJson = () => {
    if (!analysisBatchResult) {
      return;
    }
    downloadTextReport(
      JSON.stringify(analysisBatchResult, null, 2),
      "dna-analysis-report.json",
      "application/json",
    );
  };

  const exportBatchMarkdown = () => {
    if (!analysisBatchResult) {
      return;
    }
    downloadTextReport(
      createSequenceAnalysisReportMarkdown(analysisBatchResult),
      "dna-analysis-report.md",
      "text/markdown",
    );
  };

  const savePreset = () => {
    if (typeof window === "undefined") {
      return;
    }
    if (!presetName.trim()) {
      return;
    }

    const nextPresets = upsertSequenceAnalysisPreset(savedPresets, presetName, recipeState);
    setSavedPresets(nextPresets);
    window.localStorage.setItem(
      DNA_ANALYSIS_PRESET_STORAGE_KEY,
      serializeSequenceAnalysisPresets(nextPresets),
    );
    setPresetName("");
    setShareStatus(`Saved preset "${nextPresets[0].name}".`);
  };

  const shareRecipeLink = async () => {
    if (typeof window === "undefined") {
      return;
    }
    const link = buildSequenceAnalysisShareUrl(window.location.href, recipeState);
    if (!navigator.clipboard?.writeText) {
      setShareStatus("Clipboard is unavailable in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setShareStatus("Share link copied to clipboard.");
    } catch {
      setShareStatus("Unable to copy share link. Try manually copying the URL.");
    }
  };

  useEffect(() => {
    if (!shareStatus) {
      return;
    }
    const timeout = window.setTimeout(() => setShareStatus(null), 2400);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [shareStatus]);

  const analysisRows = useMemo(() => {
    if (!analysisResult) {
      return [];
    }

    if (analysisResult.kind === "motif-scan") {
      return (analysisResult.motifMatches ?? [])
        .slice(0, 6)
        .map((match) => `${match.motif}: bp ${match.start}-${match.end}`);
    }
    if (analysisResult.kind === "gc-anomaly-scan") {
      return (analysisResult.gcAnomalies ?? [])
        .slice(0, 6)
        .map(
          (anomaly) =>
            `bp ${anomaly.windowStart}-${anomaly.windowEnd} • GC ${anomaly.gcPct.toFixed(1)}% (Δ ${anomaly.deviationPct.toFixed(1)}%)`,
        );
    }

    return (analysisResult.orfs ?? [])
      .slice(0, 6)
      .map((orf) => `frame ${orf.frame} • bp ${orf.start}-${orf.end} • ${orf.codons} codons`);
  }, [analysisResult]);

  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
        flex: 1,
        minWidth: 0,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: "background.paper",
          flexShrink: 0,
          pb: 1,
        }}
      >
        <Grid container>
          <Grid item>
            <Box sx={{ maxWidth: "800px", pt: 1 }}>
              <Title sx={{ color: "primary.main" }}>
                {getChartMethodTitle(chartMethod)}
                {`${
                  activeSequences?.map((sequence) => sequence.description).join(", ").length
                    ? (chartMethod !== "" ? " for " : "") +
                      activeSequences
                        ?.map((sequence) => sequence.description)
                        ?.sort()
                        .join(", ")
                    : ""
                }`}
              </Title>
            </Box>
          </Grid>
          <Grid item sx={{ flexGrow: 1, textAlign: "right" }}>
            <FormControl sx={{ m: 1, minWidth: 120, maxWidth: 360 }} size="small">
              <InputLabel id="chart-select-label">Visualization</InputLabel>
              <Select
                labelId="chart-select-label"
                id="chart-select"
                value={chartMethod || ""}
                label="Chart Method"
                onChange={function (e: SelectChangeEvent) {
                  onChartMethodUpdate?.(e.target.value as ChartMethod);
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={"bpcontent"}>basepair content</MenuItem>
                <MenuItem value={"sequence"}>sequence</MenuItem>
                <MenuItem value={"analysis"}>analysis recipes</MenuItem>
                <MenuItem value={"squiggle"}>squiggle</MenuItem>
                <MenuItem value={"gates"}>gates</MenuItem>
                <MenuItem value={"qi"}>qi</MenuItem>
                <MenuItem value={"randic"}>randic</MenuItem>
                <MenuItem value={"yau"}>yau</MenuItem>
                <MenuItem value={"yau_bp"}>yau_bp</MenuItem>
                <MenuItem value={"yau_int"}>yau_int</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 2, pl: 1, width: "100%" }}>
              <Slider
                min={1}
                max={activeSequence?.sequence.length || 1}
                step={3}
                getAriaLabel={() => "basepair(bp) range"}
                value={bpRange || []}
                onChange={(_, newValue: number | number[]) =>
                  onBpRangeUpdate?.(newValue as number[])
                }
                valueLabelDisplay="auto"
                valueLabelFormat={(value: number) =>
                  `bp# ${value}/${activeSequence?.sequence.length}`
                }
                getAriaValueText={(value: number) =>
                  `bp# ${value}/${activeSequence?.sequence.length}`
                }
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box
        className="flex-1 min-h-0 overflow-x-hidden"
        sx={{ overflowY: isSequenceChart ? "hidden" : "auto" }}
      >
        {chartMethod === "bpcontent" && (
          <BasepairHistogram sequences={activeSequences} bpRange={bpRange} />
        )}
        {chartMethod === "squiggle" && (
          <SquiggleChart sequences={activeSequences} bpRange={bpRange} />
        )}
        {chartMethod === "gates" && <GatesChart sequences={activeSequences} bpRange={bpRange} />}
        {chartMethod === "qi" && <QiChart sequences={activeSequences} bpRange={bpRange} />}
        {chartMethod === "randic" && <RandicChart sequences={activeSequences} bpRange={bpRange} />}
        {chartMethod === "sequence" && (
          <Box className="flex min-h-full min-w-0 flex-col">
            <Box className="flex shrink-0 flex-wrap items-start">
              <Box>
                <Typography className="inline-block px-2">
                  {activeSequence?.sequence.trim().length || 0} bps
                </Typography>
                {(bpRange?.[0] || 1) !== 1 ||
                bpRange?.[1] !== activeSequence?.sequence.trim().length ? (
                  <Typography className="inline-block px-2 text-xs font-semibold">
                    {`showing only ${bpRange![1] - bpRange![0] + 1} basepairs`}
                  </Typography>
                ) : null}
              </Box>
              <Box className="grow text-right">
                <Tooltip title="display the protein chain" arrow>
                  <IconButton
                    aria-label="display the protein chain"
                    color={showProteins ? "primary" : "default"}
                    className="ml-2"
                    onClick={() => setShowProteins(!showProteins)}
                  >
                    <Share />
                  </IconButton>
                </Tooltip>
                <ButtonGroup
                  variant="outlined"
                  size="large"
                  aria-label="display options"
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    position: "relative",
                    top: "8px",
                    "& .MuiButtonBase-root": {
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 0,
                      ml: 0,
                    },
                  }}
                >
                  <Tooltip title="display the sequence as binary" arrow>
                    <IconButton
                      aria-label="display the sequence as binary"
                      color={displayBinary ? "primary" : "default"}
                      className="ml-2"
                      onClick={() => setDisplayBinary(!displayBinary)}
                    >
                      <Numbers />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="display the info tooltip" arrow>
                    <IconButton
                      aria-label="display the info tooltip"
                      color={displayTooltip ? "primary" : "default"}
                      className="ml-2"
                      onClick={() => setDisplayTooltip(!displayTooltip)}
                    >
                      <ChatBubble />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="display the sequence" arrow>
                    <IconButton
                      aria-label="display the sequence"
                      color={displaySequenceText ? "primary" : "default"}
                      className="ml-2"
                      onClick={() => {
                        const nextDisplaySequenceText = !displaySequenceText;

                        if (!nextDisplaySequenceText && !colorizeSequence) {
                          setColorizeSequence(true);
                        }

                        setDisplaySequenceText(nextDisplaySequenceText);
                      }}
                    >
                      {displaySequenceText ? <FontDownload /> : <FontDownloadOff />}
                    </IconButton>
                  </Tooltip>
                </ButtonGroup>
                <Tooltip title="colorize the sequence" arrow>
                  <IconButton
                    aria-label="colorize the sequence"
                    color={colorizeSequence ? "primary" : "default"}
                    className="ml-2"
                    onClick={() => setColorizeSequence(!colorizeSequence)}
                  >
                    <Brush />
                  </IconButton>
                </Tooltip>
                {navigator.clipboard && (
                  <Tooltip title="copy to clipboard" arrow>
                    <IconButton
                      aria-label="copy sequence to clipboard"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          activeSequence?.sequence.substring(
                            (bpRange?.[0] || 1) - 1,
                            (bpRange?.[1] || activeSequence?.sequence.length) + 1,
                          ) || "",
                        )
                      }
                      className="ml-2"
                    >
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
            <Box className="shrink-0">
              <Typography className="inline-block p-2 font-semibold">Type:</Typography>
              <Typography className="inline-block p-2">{activeSequence?.type}</Typography>
            </Box>
            <Box className="flex min-h-0 min-w-0 flex-1 flex-col">
              <Divider />
              <SequenceDisplay
                sequences={activeSequences}
                showBinary={displayBinary}
                showColors={colorizeSequence}
                fillHeight={activeSequences?.length === 1}
                showProteins={showProteins}
                showText={displaySequenceText}
                showTooltip={displayTooltip}
                minBasePair={minBasePair}
                maxBasePair={maxBasePair}
              />
            </Box>
          </Box>
        )}
        {chartMethod === "analysis" && (
          <Box sx={{ mt: 0.75, p: 1.25, display: "grid", gap: 1.25 }}>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Active recipe setup
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                The dropdown selects which recipe settings you are editing and what the single-run
                button executes.
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 210 }}>
                  <InputLabel id="recipe-select-label">Active recipe</InputLabel>
                  <Select
                    labelId="recipe-select-label"
                    value={recipeKind}
                    label="Active recipe"
                    onChange={(event) =>
                      setRecipeKind(event.target.value as SequenceAnalysisRecipeKind)
                    }
                  >
                    {DNA_ANALYSIS_RECIPE_OPTIONS.map((recipeOption) => (
                      <MenuItem key={`recipe-select-${recipeOption}`} value={recipeOption}>
                        {DNA_ANALYSIS_RECIPE_LABELS[recipeOption]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {recipeKind === "motif-scan" ? (
                  <TextField
                    size="small"
                    label="Motif"
                    value={motif}
                    onChange={(event) => setMotif(event.target.value)}
                    sx={{ minWidth: 130 }}
                  />
                ) : null}
                {recipeKind === "gc-anomaly-scan" ? (
                  <>
                    <TextField
                      size="small"
                      type="number"
                      label="Window"
                      value={gcWindowSize}
                      onChange={(event) =>
                        setGcWindowSize(Math.max(8, Math.floor(Number(event.target.value) || 24)))
                      }
                      sx={{ width: 110 }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="GC Δ %"
                      value={gcThresholdPct}
                      onChange={(event) =>
                        setGcThresholdPct(Math.max(1, Number(event.target.value) || 15))
                      }
                      sx={{ width: 110 }}
                    />
                  </>
                ) : null}
                {recipeKind === "orf-scan" ? (
                  <TextField
                    size="small"
                    type="number"
                    label="Min Codons"
                    value={minOrfCodons}
                    onChange={(event) =>
                      setMinOrfCodons(Math.max(5, Math.floor(Number(event.target.value) || 10)))
                    }
                    sx={{ width: 130 }}
                  />
                ) : null}
                <Button
                  size="small"
                  variant="contained"
                  onClick={runAnalysisRecipe}
                  startIcon={<span aria-hidden="true">🧪</span>}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#0f766e",
                    "&:hover": { bgcolor: "#115e59" },
                  }}
                >
                  Run active recipe
                </Button>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Batch recipe selection
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Chips choose which recipes are included when you run a multi-recipe batch.
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
                {DNA_ANALYSIS_RECIPE_OPTIONS.map((recipeOption) => (
                  <Chip
                    key={`recipe-toggle-${recipeOption}`}
                    size="small"
                    color={selectedRecipeKinds.includes(recipeOption) ? "primary" : "default"}
                    variant={selectedRecipeKinds.includes(recipeOption) ? "filled" : "outlined"}
                    label={DNA_ANALYSIS_RECIPE_LABELS[recipeOption]}
                    onClick={() => toggleRecipeSelection(recipeOption)}
                  />
                ))}
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={runSelectedRecipes}
                  startIcon={<span aria-hidden="true">🚀</span>}
                  sx={{
                    ml: { xs: 0, sm: 1 },
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#1d4ed8",
                    "&:hover": { bgcolor: "#1e40af" },
                  }}
                >
                  Run selected recipes
                </Button>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Presets and reports
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => void shareRecipeLink()}
                  startIcon={<span aria-hidden="true">🔗</span>}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: "#0284c7",
                    color: "#0369a1",
                  }}
                >
                  Share setup link
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={exportBatchJson}
                  disabled={!analysisBatchResult}
                  startIcon={<span aria-hidden="true">📦</span>}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: "#059669",
                    color: "#047857",
                  }}
                >
                  Export JSON
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={exportBatchMarkdown}
                  disabled={!analysisBatchResult}
                  startIcon={<span aria-hidden="true">📝</span>}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: "#b45309",
                    color: "#92400e",
                  }}
                >
                  Export Markdown
                </Button>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                <TextField
                  size="small"
                  label="Preset name"
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  sx={{ minWidth: 180 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={savePreset}
                  startIcon={<span aria-hidden="true">💾</span>}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#4338ca",
                    "&:hover": { bgcolor: "#3730a3" },
                  }}
                >
                  Save preset
                </Button>
                {shareStatus ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "inline-flex", alignItems: "center", px: 0.5 }}
                  >
                    {shareStatus}
                  </Typography>
                ) : null}
                {savedPresets.map((preset) => (
                  <Button
                    key={`preset-${preset.name}`}
                    size="small"
                    variant="text"
                    startIcon={<span aria-hidden="true">📂</span>}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                    onClick={() => {
                      applyRecipeState(
                        normalizeSequenceAnalysisRecipeState(
                          preset.state,
                          DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
                        ),
                      );
                      setShareStatus(`Loaded preset "${preset.name}".`);
                    }}
                  >
                    {preset.name}
                  </Button>
                ))}
              </Box>
            </Paper>
            <SequenceCompareWorkspace
              activeSequences={activeSequences ?? []}
              recipeState={recipeState}
              savedPresets={savedPresets}
              onApplyPresetState={(state) => {
                applyRecipeState(state);
                setShareStatus("Applied compare workspace preset to recipe controls.");
              }}
            />
            {analysisResult ? (
              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Active recipe output
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {analysisResult.summary}
                </Typography>
                {analysisRows.map((row) => (
                  <Typography
                    key={row}
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {row}
                  </Typography>
                ))}
              </Paper>
            ) : null}
            {analysisBatchResult ? (
              <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Batch report summary
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {analysisBatchResult.summary}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Report generated at {analysisBatchResult.generatedAtIso}
                </Typography>
              </Paper>
            ) : null}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
