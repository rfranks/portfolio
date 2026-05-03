import { useCallback, useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import ButtonGroup from "@mui/material/ButtonGroup";
import Paper from "@mui/material/Paper";
import SequenceDisplay from "./SequenceDisplay";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Slider from "@mui/material/Slider";

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
  buildSequenceAnalysisOverlayData,
  createSequenceAnalysisReportMarkdown,
  DNA_ANALYSIS_OVERLAY_MAX_POINTS,
  DNA_LARGE_SEQUENCE_THRESHOLD_BP,
  runSequenceAnalysisRecipe,
  runSelectedSequenceAnalysisRecipes,
  type SequenceAnalysisBatchResult,
  type SequenceAnalysisOverlayData,
  type SequenceAnalysisRecipeKind,
  type SequenceAnalysisRecipeResult,
} from "../_utils/sequenceUtils";
import SequenceOverlayTracks from "./SequenceOverlayTracks";
import SequenceAnalysisRecipesPanel from "./SequenceAnalysisRecipesPanel";
import type {
  SequenceAnalysisPreset,
  SequenceAnalysisRecipeState,
} from "../_types/analysisPresets";
import { useSequenceAnalysisWorker } from "../_hooks/useSequenceAnalysisWorker";
import {
  buildSequenceAnalysisShareUrl,
  DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
  DNA_ANALYSIS_PRESET_STORAGE_KEY,
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
  forceWorkerAnalysis?: boolean;
};

export default function SequenceVisualizations({
  activeSequences = [],
  bpRange = [],
  chartMethod = "sequence",
  onBpRangeUpdate,
  onChartMethodUpdate,
  forceWorkerAnalysis,
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
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [overlayData, setOverlayData] = useState<SequenceAnalysisOverlayData | null>(null);
  const [overlayBusy, setOverlayBusy] = useState(false);
  const [overlayStatus, setOverlayStatus] = useState<string | null>(null);
  const [showMotifOverlay, setShowMotifOverlay] = useState(true);
  const [showHotspotOverlay, setShowHotspotOverlay] = useState(true);
  const { workerEnabled, runWorkerRequest } = useSequenceAnalysisWorker();

  const activeSequence = activeSequences?.[0];
  const activeSequenceLength = activeSequence?.sequence?.length ?? 0;
  const hasLargeSequence = activeSequenceLength >= DNA_LARGE_SEQUENCE_THRESHOLD_BP;
  const isSequenceChart = chartMethod === "sequence";
  const useWorkerForAnalysis = (forceWorkerAnalysis ?? hasLargeSequence) && workerEnabled;
  const showLargeSequenceOverlay = isSequenceChart && hasLargeSequence;
  const analysisExecutionModeLabel = useWorkerForAnalysis
    ? "web worker"
    : hasLargeSequence
      ? "main thread fallback"
      : "main thread";
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

  const resolveErrorMessage = useCallback((error: unknown, fallbackMessage: string): string => {
    if (error instanceof Error && error.message.trim()) {
      return error.message.trim();
    }
    if (typeof error === "string" && error.trim()) {
      return error.trim();
    }
    return fallbackMessage;
  }, []);

  const createWorkerRequestId = useCallback(
    () => `dna-analysis-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    [],
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

  const runAnalysisRecipe = useCallback(async () => {
    if (!activeSequence?.sequence?.length) {
      setAnalysisResult(null);
      setAnalysisBatchResult(null);
      return;
    }

    const recipeConfig = {
      kind: recipeKind,
      motif,
      windowSize: gcWindowSize,
      gcThresholdPct,
      minOrfCodons,
    } as const;
    setAnalysisError(null);

    if (useWorkerForAnalysis) {
      setAnalysisBusy(true);
      try {
        const response = await runWorkerRequest({
          requestId: createWorkerRequestId(),
          action: "run-recipe",
          payload: {
            sequence: activeSequence.sequence,
            config: recipeConfig,
          },
        });
        if (response.action !== "run-recipe" || !response.ok) {
          throw new Error(
            response.ok
              ? "DNA analysis worker returned an unexpected response shape."
              : response.error,
          );
        }

        setAnalysisResult(response.result);
        setAnalysisBatchResult(null);
        return;
      } catch (error) {
        setAnalysisError(
          `${resolveErrorMessage(
            error,
            "DNA analysis worker failed to run the active recipe.",
          )} Falling back to main-thread analysis.`,
        );
      } finally {
        setAnalysisBusy(false);
      }
    }

    setAnalysisResult(runSequenceAnalysisRecipe(activeSequence.sequence, recipeConfig));
    setAnalysisBatchResult(null);
  }, [
    activeSequence?.sequence,
    createWorkerRequestId,
    gcThresholdPct,
    gcWindowSize,
    minOrfCodons,
    motif,
    recipeKind,
    resolveErrorMessage,
    runWorkerRequest,
    useWorkerForAnalysis,
  ]);

  const buildRecipeConfig = useCallback(
    (kind: SequenceAnalysisRecipeKind) => ({
      kind,
      motif,
      windowSize: gcWindowSize,
      gcThresholdPct,
      minOrfCodons,
    }),
    [gcThresholdPct, gcWindowSize, minOrfCodons, motif],
  );

  const runSelectedRecipes = useCallback(async () => {
    if (!activeSequence?.sequence?.length) {
      setAnalysisResult(null);
      setAnalysisBatchResult(null);
      return;
    }

    const selectedKinds = selectedRecipeKinds.length > 0 ? selectedRecipeKinds : [recipeKind];
    const recipeConfigs = selectedKinds.map((kind) => buildRecipeConfig(kind));
    setAnalysisError(null);

    if (useWorkerForAnalysis) {
      setAnalysisBusy(true);
      try {
        const response = await runWorkerRequest({
          requestId: createWorkerRequestId(),
          action: "run-batch",
          payload: {
            sequence: activeSequence.sequence,
            configs: recipeConfigs,
          },
        });
        if (response.action !== "run-batch" || !response.ok) {
          throw new Error(
            response.ok
              ? "DNA analysis worker returned an unexpected batch response."
              : response.error,
          );
        }

        setAnalysisBatchResult(response.result);
        const activeRecipeResult =
          response.result.recipes.find((recipe) => recipe.kind === recipeKind) ?? null;
        setAnalysisResult(activeRecipeResult);
        return;
      } catch (error) {
        setAnalysisError(
          `${resolveErrorMessage(
            error,
            "DNA analysis worker failed to run selected recipes.",
          )} Falling back to main-thread analysis.`,
        );
      } finally {
        setAnalysisBusy(false);
      }
    }

    const report = runSelectedSequenceAnalysisRecipes(activeSequence.sequence, recipeConfigs);
    setAnalysisBatchResult(report);
    const activeRecipeResult = report.recipes.find((recipe) => recipe.kind === recipeKind) ?? null;
    setAnalysisResult(activeRecipeResult);
  }, [
    activeSequence?.sequence,
    buildRecipeConfig,
    createWorkerRequestId,
    recipeKind,
    resolveErrorMessage,
    runWorkerRequest,
    selectedRecipeKinds,
    useWorkerForAnalysis,
  ]);

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

  useEffect(() => {
    if (!showLargeSequenceOverlay || !activeSequence?.sequence?.length) {
      setOverlayData(null);
      setOverlayBusy(false);
      setOverlayStatus(null);
      return;
    }

    let isCancelled = false;
    const syncOverlay = async () => {
      setOverlayBusy(true);
      setOverlayStatus(null);
      const overlayConfig = {
        motif,
        gcWindowSize,
        gcThresholdPct,
        maxPoints: DNA_ANALYSIS_OVERLAY_MAX_POINTS,
      };

      if (useWorkerForAnalysis) {
        try {
          const response = await runWorkerRequest({
            requestId: createWorkerRequestId(),
            action: "build-overlay",
            payload: {
              sequence: activeSequence.sequence,
              config: overlayConfig,
            },
          });
          if (response.action !== "build-overlay" || !response.ok) {
            throw new Error(
              response.ok
                ? "DNA analysis worker returned an unexpected overlay response."
                : response.error,
            );
          }

          if (!isCancelled) {
            setOverlayData(response.result);
          }
          return;
        } catch (error) {
          if (!isCancelled) {
            setOverlayStatus(
              `${resolveErrorMessage(
                error,
                "DNA overlay worker failed for the current sequence.",
              )} Recomputed on main thread.`,
            );
          }
        }
      }

      const fallbackOverlay = buildSequenceAnalysisOverlayData(
        activeSequence.sequence,
        overlayConfig,
      );
      if (!isCancelled) {
        setOverlayData(fallbackOverlay);
      }
    };

    void syncOverlay().finally(() => {
      if (!isCancelled) {
        setOverlayBusy(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    activeSequence?.sequence,
    createWorkerRequestId,
    gcThresholdPct,
    gcWindowSize,
    motif,
    resolveErrorMessage,
    runWorkerRequest,
    showLargeSequenceOverlay,
    useWorkerForAnalysis,
  ]);

  const motifOverlaySummary = useMemo(() => {
    if (!overlayData) {
      return null;
    }
    return `${overlayData.motifMatches.length.toLocaleString("en-US")}/${overlayData.motifTotalCount.toLocaleString(
      "en-US",
    )} motif markers`;
  }, [overlayData]);

  const hotspotOverlaySummary = useMemo(() => {
    if (!overlayData) {
      return null;
    }
    return `${overlayData.gcHotspots.length.toLocaleString("en-US")}/${overlayData.gcHotspotTotalCount.toLocaleString(
      "en-US",
    )} GC hotspots`;
  }, [overlayData]);

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
            {showLargeSequenceOverlay ? (
              <SequenceOverlayTracks
                activeSequenceLength={activeSequenceLength}
                analysisExecutionModeLabel={analysisExecutionModeLabel}
                overlayData={overlayData}
                overlayBusy={overlayBusy}
                overlayStatus={overlayStatus}
                showMotifOverlay={showMotifOverlay}
                showHotspotOverlay={showHotspotOverlay}
                motifOverlaySummary={motifOverlaySummary}
                hotspotOverlaySummary={hotspotOverlaySummary}
                onToggleMotifOverlay={() => setShowMotifOverlay((current) => !current)}
                onToggleHotspotOverlay={() => setShowHotspotOverlay((current) => !current)}
              />
            ) : null}
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
          <SequenceAnalysisRecipesPanel
            activeSequences={activeSequences ?? []}
            recipeKind={recipeKind}
            motif={motif}
            gcWindowSize={gcWindowSize}
            gcThresholdPct={gcThresholdPct}
            minOrfCodons={minOrfCodons}
            analysisExecutionModeLabel={analysisExecutionModeLabel}
            analysisBusy={analysisBusy}
            analysisError={analysisError}
            selectedRecipeKinds={selectedRecipeKinds}
            analysisBatchResult={analysisBatchResult}
            presetName={presetName}
            shareStatus={shareStatus}
            savedPresets={savedPresets}
            recipeState={recipeState}
            analysisResult={analysisResult}
            analysisRows={analysisRows}
            onRecipeKindChange={setRecipeKind}
            onMotifChange={setMotif}
            onGcWindowSizeChange={setGcWindowSize}
            onGcThresholdPctChange={setGcThresholdPct}
            onMinOrfCodonsChange={setMinOrfCodons}
            onRunAnalysisRecipe={() => void runAnalysisRecipe()}
            onToggleRecipeSelection={toggleRecipeSelection}
            onRunSelectedRecipes={() => void runSelectedRecipes()}
            onShareRecipeLink={shareRecipeLink}
            onExportBatchJson={exportBatchJson}
            onExportBatchMarkdown={exportBatchMarkdown}
            onPresetNameChange={setPresetName}
            onSavePreset={savePreset}
            onLoadPreset={(preset) => {
              applyRecipeState(
                normalizeSequenceAnalysisRecipeState(
                  preset.state,
                  DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
                ),
              );
              setShareStatus(`Loaded preset "${preset.name}".`);
            }}
            onApplyComparePresetState={(state) => {
              applyRecipeState(state);
              setShareStatus("Applied compare workspace preset to recipe controls.");
            }}
          />
        )}
      </Box>
    </Paper>
  );
}
