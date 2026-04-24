import { useEffect, useMemo, useState } from "react";

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
  runSequenceAnalysisRecipe,
  type SequenceAnalysisRecipeKind,
  type SequenceAnalysisRecipeResult,
} from "../_utils/sequenceUtils";

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
  const PRESET_STORAGE_KEY = "dna-analysis-recipes-v1";
  const minBasePair = bpRange?.[0] || 1;
  const maxBasePair = bpRange?.[1] || activeSequences?.[0]?.sequence?.length || 1;

  const [colorizeSequence, setColorizeSequence] = useState<boolean>(true);
  const [displaySequenceText, setDisplaySequenceText] = useState<boolean>(true);
  const [displayTooltip, setDisplayTooltip] = useState<boolean>(true);
  const [displayBinary, setDisplayBinary] = useState<boolean>(false);
  const [showProteins, setShowProteins] = useState<boolean>(false);
  const [recipeKind, setRecipeKind] = useState<SequenceAnalysisRecipeKind>("motif-scan");
  const [motif, setMotif] = useState("ATG");
  const [gcWindowSize, setGcWindowSize] = useState(24);
  const [gcThresholdPct, setGcThresholdPct] = useState(15);
  const [minOrfCodons, setMinOrfCodons] = useState(10);
  const [analysisResult, setAnalysisResult] = useState<SequenceAnalysisRecipeResult | null>(null);
  const [presetName, setPresetName] = useState("");
  const [savedPresets, setSavedPresets] = useState<
    Array<{
      name: string;
      recipeKind: SequenceAnalysisRecipeKind;
      motif: string;
      gcWindowSize: number;
      gcThresholdPct: number;
      minOrfCodons: number;
    }>
  >([]);

  const activeSequence = activeSequences?.[0];
  const isSequenceChart = chartMethod === "sequence";

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
    try {
      const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as typeof savedPresets;
      if (Array.isArray(parsed)) {
        setSavedPresets(parsed);
      }
    } catch {
      // ignore malformed preset storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const queryRecipe = (params.get("dnaRecipe") || "").trim().toLowerCase();
    const queryMotif = (params.get("dnaMotif") || "").trim();
    const queryWindow = Number(params.get("dnaWindow") || "");
    const queryThreshold = Number(params.get("dnaGcThreshold") || "");
    const queryMinOrf = Number(params.get("dnaMinOrfCodons") || "");

    if (
      queryRecipe === "motif-scan" ||
      queryRecipe === "gc-anomaly-scan" ||
      queryRecipe === "orf-scan"
    ) {
      setRecipeKind(queryRecipe);
    }
    if (queryMotif) {
      setMotif(queryMotif);
    }
    if (Number.isFinite(queryWindow) && queryWindow > 0) {
      setGcWindowSize(Math.floor(queryWindow));
    }
    if (Number.isFinite(queryThreshold) && queryThreshold > 0) {
      setGcThresholdPct(queryThreshold);
    }
    if (Number.isFinite(queryMinOrf) && queryMinOrf > 0) {
      setMinOrfCodons(Math.floor(queryMinOrf));
    }
  }, []);

  const runAnalysisRecipe = () => {
    if (!activeSequence?.sequence?.length) {
      setAnalysisResult(null);
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

  const savePreset = () => {
    if (typeof window === "undefined") {
      return;
    }
    const normalizedName = presetName.trim();
    if (!normalizedName) {
      return;
    }

    const nextPresets = [
      {
        name: normalizedName,
        recipeKind,
        motif,
        gcWindowSize,
        gcThresholdPct,
        minOrfCodons,
      },
      ...savedPresets.filter(
        (preset) => preset.name.toLowerCase() !== normalizedName.toLowerCase(),
      ),
    ].slice(0, 10);
    setSavedPresets(nextPresets);
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(nextPresets));
    setPresetName("");
  };

  const shareRecipeLink = async () => {
    if (typeof window === "undefined") {
      return;
    }
    const link = new URL(window.location.href);
    link.searchParams.set("dnaRecipe", recipeKind);
    link.searchParams.set("dnaMotif", motif);
    link.searchParams.set("dnaWindow", String(gcWindowSize));
    link.searchParams.set("dnaGcThreshold", String(gcThresholdPct));
    link.searchParams.set("dnaMinOrfCodons", String(minOrfCodons));
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link.toString());
    }
  };

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
            <Box
              sx={{
                mt: 0.75,
                mb: 1.25,
                p: 1.25,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Analysis Recipes
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="recipe-select-label">Recipe</InputLabel>
                  <Select
                    labelId="recipe-select-label"
                    value={recipeKind}
                    label="Recipe"
                    onChange={(event) =>
                      setRecipeKind(event.target.value as SequenceAnalysisRecipeKind)
                    }
                  >
                    <MenuItem value="motif-scan">motif scan</MenuItem>
                    <MenuItem value="gc-anomaly-scan">gc anomaly scan</MenuItem>
                    <MenuItem value="orf-scan">orf scan</MenuItem>
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
                <Button size="small" variant="contained" onClick={runAnalysisRecipe}>
                  Run
                </Button>
                <Button size="small" variant="outlined" onClick={() => void shareRecipeLink()}>
                  Share
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
                <Button size="small" variant="outlined" onClick={savePreset}>
                  Save preset
                </Button>
                {savedPresets.map((preset) => (
                  <Button
                    key={`preset-${preset.name}`}
                    size="small"
                    variant="text"
                    onClick={() => {
                      setRecipeKind(preset.recipeKind);
                      setMotif(preset.motif);
                      setGcWindowSize(preset.gcWindowSize);
                      setGcThresholdPct(preset.gcThresholdPct);
                      setMinOrfCodons(preset.minOrfCodons);
                    }}
                  >
                    {preset.name}
                  </Button>
                ))}
              </Box>
              {analysisResult ? (
                <Box sx={{ mt: 1 }}>
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
                </Box>
              ) : null}
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
      </Box>
    </Paper>
  );
}
