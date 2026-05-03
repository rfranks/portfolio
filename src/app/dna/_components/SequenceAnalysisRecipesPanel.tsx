import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SequenceCompareWorkspace from "./SequenceCompareWorkspace";
import type {
  SequenceAnalysisPreset,
  SequenceAnalysisRecipeState,
} from "../_types/analysisPresets";
import { type Sequence } from "../_types/types";
import {
  type SequenceAnalysisBatchResult,
  type SequenceAnalysisRecipeKind,
  type SequenceAnalysisRecipeResult,
} from "../_utils/sequenceUtils";
import {
  DNA_ANALYSIS_RECIPE_LABELS,
  DNA_ANALYSIS_RECIPE_OPTIONS,
} from "../_utils/analysisPresetState";

type SequenceAnalysisRecipesPanelProps = {
  activeSequences: Sequence[];
  recipeKind: SequenceAnalysisRecipeKind;
  motif: string;
  gcWindowSize: number;
  gcThresholdPct: number;
  minOrfCodons: number;
  analysisExecutionModeLabel: string;
  analysisBusy: boolean;
  analysisError: string | null;
  selectedRecipeKinds: SequenceAnalysisRecipeKind[];
  analysisBatchResult: SequenceAnalysisBatchResult | null;
  presetName: string;
  shareStatus: string | null;
  savedPresets: SequenceAnalysisPreset[];
  recipeState: SequenceAnalysisRecipeState;
  analysisResult: SequenceAnalysisRecipeResult | null;
  analysisRows: string[];
  onRecipeKindChange: (kind: SequenceAnalysisRecipeKind) => void;
  onMotifChange: (value: string) => void;
  onGcWindowSizeChange: (value: number) => void;
  onGcThresholdPctChange: (value: number) => void;
  onMinOrfCodonsChange: (value: number) => void;
  onRunAnalysisRecipe: () => void;
  onToggleRecipeSelection: (kind: SequenceAnalysisRecipeKind) => void;
  onRunSelectedRecipes: () => void;
  onShareRecipeLink: () => void | Promise<void>;
  onExportBatchJson: () => void;
  onExportBatchMarkdown: () => void;
  onPresetNameChange: (value: string) => void;
  onSavePreset: () => void;
  onLoadPreset: (preset: SequenceAnalysisPreset) => void;
  onApplyComparePresetState: (state: SequenceAnalysisRecipeState) => void;
};

export default function SequenceAnalysisRecipesPanel({
  activeSequences,
  recipeKind,
  motif,
  gcWindowSize,
  gcThresholdPct,
  minOrfCodons,
  analysisExecutionModeLabel,
  analysisBusy,
  analysisError,
  selectedRecipeKinds,
  analysisBatchResult,
  presetName,
  shareStatus,
  savedPresets,
  recipeState,
  analysisResult,
  analysisRows,
  onRecipeKindChange,
  onMotifChange,
  onGcWindowSizeChange,
  onGcThresholdPctChange,
  onMinOrfCodonsChange,
  onRunAnalysisRecipe,
  onToggleRecipeSelection,
  onRunSelectedRecipes,
  onShareRecipeLink,
  onExportBatchJson,
  onExportBatchMarkdown,
  onPresetNameChange,
  onSavePreset,
  onLoadPreset,
  onApplyComparePresetState,
}: SequenceAnalysisRecipesPanelProps) {
  return (
    <Box sx={{ mt: 0.75, p: 1.25, display: "grid", gap: 1.25 }}>
      <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Active recipe setup
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          The dropdown selects which recipe settings you are editing and what the single-run button
          executes.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Compute mode: {analysisExecutionModeLabel}
          {analysisBusy ? " (running...)" : ""}
        </Typography>
        {analysisError ? (
          <Typography variant="caption" color="warning.main" sx={{ display: "block", mb: 1 }}>
            {analysisError}
          </Typography>
        ) : null}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 210 }}>
            <InputLabel id="recipe-select-label">Active recipe</InputLabel>
            <Select
              labelId="recipe-select-label"
              value={recipeKind}
              label="Active recipe"
              onChange={(event) =>
                onRecipeKindChange(event.target.value as SequenceAnalysisRecipeKind)
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
              onChange={(event) => onMotifChange(event.target.value)}
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
                  onGcWindowSizeChange(Math.max(8, Math.floor(Number(event.target.value) || 24)))
                }
                sx={{ width: 110 }}
              />
              <TextField
                size="small"
                type="number"
                label="GC Δ %"
                value={gcThresholdPct}
                onChange={(event) =>
                  onGcThresholdPctChange(Math.max(1, Number(event.target.value) || 15))
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
                onMinOrfCodonsChange(Math.max(5, Math.floor(Number(event.target.value) || 10)))
              }
              sx={{ width: 130 }}
            />
          ) : null}
          <Button
            size="small"
            variant="contained"
            onClick={onRunAnalysisRecipe}
            disabled={analysisBusy}
            startIcon={<span aria-hidden="true">🧪</span>}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#0f766e",
              "&:hover": { bgcolor: "#115e59" },
            }}
          >
            {analysisBusy ? "Running..." : "Run active recipe"}
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
              onClick={() => onToggleRecipeSelection(recipeOption)}
            />
          ))}
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={onRunSelectedRecipes}
            disabled={analysisBusy}
            startIcon={<span aria-hidden="true">🚀</span>}
            sx={{
              ml: { xs: 0, sm: 1 },
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#1d4ed8",
              "&:hover": { bgcolor: "#1e40af" },
            }}
          >
            {analysisBusy ? "Running..." : "Run selected recipes"}
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
            onClick={() => void onShareRecipeLink()}
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
            onClick={onExportBatchJson}
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
            onClick={onExportBatchMarkdown}
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
            onChange={(event) => onPresetNameChange(event.target.value)}
            sx={{ minWidth: 180 }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={onSavePreset}
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
              onClick={() => onLoadPreset(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </Box>
      </Paper>
      <SequenceCompareWorkspace
        activeSequences={activeSequences}
        recipeState={recipeState}
        savedPresets={savedPresets}
        onApplyPresetState={onApplyComparePresetState}
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
  );
}
