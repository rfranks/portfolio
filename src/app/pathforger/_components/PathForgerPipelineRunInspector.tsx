import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type {
  PathForgerPipelineReplayCheckpoint,
  PathForgerPipelineRunDiagnostics,
} from "@/app/pathforger/_types/pipelineRunInspector";

type InspectorProps = {
  runs: PathForgerPipelineRunDiagnostics[];
  onReplayCheckpoint?: (
    checkpoint: PathForgerPipelineReplayCheckpoint,
    run: PathForgerPipelineRunDiagnostics,
  ) => void;
  replayBusy?: boolean;
};

type HealthChipColor = "success" | "warning" | "error" | "default";

function formatDuration(durationMs: number | null | undefined): string {
  if (!durationMs || !Number.isFinite(durationMs) || durationMs <= 0) {
    return "—";
  }
  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`;
  }
  return `${(durationMs / 1000).toFixed(2)} s`;
}

function toStatusChipColor(status: string): HealthChipColor {
  if (status === "completed" || status === "success") {
    return "success";
  }
  if (status === "running" || status === "pending") {
    return "warning";
  }
  if (status === "failed" || status === "error" || status === "canceled") {
    return "error";
  }
  return "default";
}

function toStageDurationMs(startedAtMs?: number, completedAtMs?: number): number | null {
  if (!startedAtMs || !completedAtMs) {
    return null;
  }
  return Math.max(0, completedAtMs - startedAtMs);
}

function tokenizeForDiff(markdown: string): Set<string> {
  return new Set(
    markdown
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  );
}

function summarizeBranchDelta(currentMarkdown: string, compareMarkdown: string): string {
  const currentTokens = tokenizeForDiff(currentMarkdown);
  const compareTokens = tokenizeForDiff(compareMarkdown);

  let added = 0;
  for (const token of currentTokens) {
    if (!compareTokens.has(token)) {
      added += 1;
    }
  }

  let removed = 0;
  for (const token of compareTokens) {
    if (!currentTokens.has(token)) {
      removed += 1;
    }
  }

  return `Token delta +${added} / -${removed}`;
}

function resolveRunById(
  runs: PathForgerPipelineRunDiagnostics[],
  runId: string,
): PathForgerPipelineRunDiagnostics | null {
  return runs.find((run) => run.runId === runId) ?? null;
}

function isReplayableCheckpoint(checkpoint: PathForgerPipelineReplayCheckpoint): boolean {
  if (checkpoint.stageKey === "loadKnowledge") {
    return false;
  }

  if (checkpoint.stageKey === "generatePitches") {
    return Boolean(checkpoint.pitches);
  }

  if (checkpoint.stageKey === "generateChapter" || checkpoint.stageKey === "generateImages") {
    return Boolean(checkpoint.pitches && checkpoint.chapter && checkpoint.selectedPitch);
  }

  return false;
}

function renderBranchOutcomeCard(params: {
  branchLabel: "A" | "B";
  markdown: string;
  compareMarkdown?: string;
}): React.ReactElement {
  const deltaText =
    typeof params.compareMarkdown === "string"
      ? summarizeBranchDelta(params.markdown, params.compareMarkdown)
      : null;

  return (
    <Paper variant="outlined" sx={{ p: 1.1, borderColor: "divider" }}>
      <Stack spacing={0.6}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={0.75}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Outcome {params.branchLabel}
          </Typography>
          {deltaText ? <Chip size="small" variant="outlined" label={deltaText} /> : null}
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ whiteSpace: "pre-wrap", display: "block" }}
        >
          {params.markdown || "No outcome text captured for this branch."}
        </Typography>
      </Stack>
    </Paper>
  );
}

export default function PathForgerPipelineRunInspector({
  runs,
  onReplayCheckpoint,
  replayBusy = false,
}: InspectorProps) {
  const [selectedRunId, setSelectedRunId] = React.useState("");
  const [compareRunId, setCompareRunId] = React.useState("");

  React.useEffect(() => {
    if (runs.length === 0) {
      if (selectedRunId) {
        setSelectedRunId("");
      }
      if (compareRunId) {
        setCompareRunId("");
      }
      return;
    }

    if (!selectedRunId) {
      setSelectedRunId(runs[0].runId);
      return;
    }

    if (!resolveRunById(runs, selectedRunId)) {
      setSelectedRunId(runs[0].runId);
    }

    if (compareRunId && !resolveRunById(runs, compareRunId)) {
      setCompareRunId("");
    }
  }, [compareRunId, runs, selectedRunId]);

  const selectedRun = React.useMemo(() => {
    if (runs.length === 0) {
      return null;
    }

    return resolveRunById(runs, selectedRunId) ?? runs[0];
  }, [runs, selectedRunId]);

  const compareRun = React.useMemo(() => {
    if (!compareRunId) {
      return null;
    }

    return resolveRunById(runs, compareRunId);
  }, [compareRunId, runs]);

  if (!selectedRun) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={0.75}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Pipeline Run Inspector
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run the PathForger pipeline to populate stage timings, branch diff snapshots, and replay
            checkpoints.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  const totalDurationMs = toStageDurationMs(
    selectedRun.snapshot.startedAtMs,
    selectedRun.snapshot.completedAtMs,
  );
  const stageRetries = selectedRun.snapshot.stages.reduce(
    (total, stage) => total + Math.max(0, stage.attempts - 1),
    0,
  );
  const failureStage = selectedRun.snapshot.stages.find(
    (stage) => stage.status === "error" || stage.status === "canceled",
  );
  const textModelFallback = selectedRun.requestedTextModel !== selectedRun.resolvedTextModel;
  const imageModelFallback = selectedRun.requestedImageModel !== selectedRun.resolvedImageModel;
  const replayEvents = selectedRun.snapshot.events.slice(-12);

  const selectedBranchSnapshot = selectedRun.branchOutcomeSnapshot;
  const compareBranchSnapshot = compareRun?.branchOutcomeSnapshot ?? null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          gap={1}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Pipeline Run Inspector
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Captured {new Date(selectedRun.capturedAtIso).toLocaleString()} • {runs.length} run
              {runs.length === 1 ? "" : "s"} available
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={selectedRun.snapshot.state}
              color={toStatusChipColor(selectedRun.snapshot.state)}
              variant="outlined"
            />
            <Chip
              size="small"
              label={`Duration ${formatDuration(totalDurationMs)}`}
              variant="outlined"
            />
            <Chip size="small" label={`Retries ${stageRetries}`} variant="outlined" />
            {failureStage ? (
              <Chip
                size="small"
                label={`Fail point ${failureStage.key}`}
                color="error"
                variant="outlined"
              />
            ) : null}
          </Stack>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} gap={1}>
          <FormControl size="small" sx={{ minWidth: 230 }}>
            <InputLabel id="pathforger-run-primary-label">Primary run</InputLabel>
            <Select
              labelId="pathforger-run-primary-label"
              value={selectedRun.runId}
              label="Primary run"
              onChange={(event) => setSelectedRunId(event.target.value)}
            >
              {runs.map((run) => (
                <MenuItem key={run.runId} value={run.runId}>
                  {new Date(run.capturedAtIso).toLocaleTimeString()} • {run.runId.slice(-6)} •{" "}
                  {run.snapshot.state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 230 }}>
            <InputLabel id="pathforger-run-compare-label">Compare run</InputLabel>
            <Select
              labelId="pathforger-run-compare-label"
              value={compareRunId}
              label="Compare run"
              onChange={(event) => setCompareRunId(event.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {runs
                .filter((run) => run.runId !== selectedRun.runId)
                .map((run) => (
                  <MenuItem key={run.runId} value={run.runId}>
                    {new Date(run.capturedAtIso).toLocaleTimeString()} • {run.runId.slice(-6)} •{" "}
                    {run.snapshot.state}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Stack>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700 }} color="text.secondary">
            Model Trace
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
            <Chip
              size="small"
              label={`Text: ${selectedRun.resolvedTextModel}`}
              color={textModelFallback ? "warning" : "success"}
              variant="outlined"
            />
            <Chip
              size="small"
              label={`Image: ${selectedRun.resolvedImageModel}`}
              color={imageModelFallback ? "warning" : "success"}
              variant="outlined"
            />
          </Stack>
          <Stack spacing={0.4} sx={{ mt: 0.75 }}>
            {selectedRun.stageModelTrace.map((trace) => (
              <Typography
                key={`${trace.stageKey}-${trace.traceType}`}
                variant="caption"
                color="text.secondary"
              >
                {trace.stageKey} • {trace.traceType} • {trace.model}
              </Typography>
            ))}
          </Stack>
        </Box>

        <Divider flexItem />

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700 }} color="text.secondary">
            Branch Diff + Outcomes
          </Typography>
          {selectedBranchSnapshot ? (
            <Stack spacing={0.75} sx={{ mt: 0.6 }}>
              <Typography variant="caption" color="text.secondary">
                Chapter {selectedBranchSnapshot.chapterNumber} •{" "}
                {selectedBranchSnapshot.chapterTitle}
                {compareBranchSnapshot
                  ? ` • compared with chapter ${compareBranchSnapshot.chapterNumber}`
                  : ""}
              </Typography>
              {renderBranchOutcomeCard({
                branchLabel: "A",
                markdown: selectedBranchSnapshot.outcomeA,
                compareMarkdown: compareBranchSnapshot?.outcomeA,
              })}
              {renderBranchOutcomeCard({
                branchLabel: "B",
                markdown: selectedBranchSnapshot.outcomeB,
                compareMarkdown: compareBranchSnapshot?.outcomeB,
              })}
              <Paper variant="outlined" sx={{ p: 1.1, borderColor: "divider" }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Path Ledger
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-wrap", display: "block", mt: 0.45 }}
                >
                  {selectedBranchSnapshot.pathLedgerMarkdown || "No path ledger text captured."}
                </Typography>
              </Paper>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              This run did not produce branch outcomes yet.
            </Typography>
          )}
        </Box>

        <Divider flexItem />

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700 }} color="text.secondary">
            Replay Checkpoints
          </Typography>
          <Stack spacing={0.55} sx={{ mt: 0.6 }}>
            {selectedRun.checkpoints.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                No replay checkpoints captured for this run.
              </Typography>
            ) : (
              selectedRun.checkpoints.map((checkpoint) => {
                const checkpointDuration = selectedRun.snapshot.startedAtMs
                  ? checkpoint.capturedAtMs - selectedRun.snapshot.startedAtMs
                  : null;
                const replayable = isReplayableCheckpoint(checkpoint);

                return (
                  <Paper
                    key={checkpoint.checkpointId}
                    variant="outlined"
                    sx={{ p: 0.8, borderColor: "divider", backgroundColor: "background.default" }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      alignItems={{ xs: "flex-start", md: "center" }}
                      justifyContent="space-between"
                      gap={0.75}
                    >
                      <Stack spacing={0.2}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {checkpoint.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          +{formatDuration(checkpointDuration)} • {checkpoint.stageKey}
                          {checkpoint.selectedPitch ? ` • pitch ${checkpoint.selectedPitch}` : ""}
                          {checkpoint.selectedBranch
                            ? ` • branch ${checkpoint.selectedBranch}`
                            : ""}
                        </Typography>
                      </Stack>

                      <Button
                        size="small"
                        variant="outlined"
                        disabled={!onReplayCheckpoint || replayBusy || !replayable}
                        onClick={() => {
                          if (!onReplayCheckpoint) {
                            return;
                          }
                          onReplayCheckpoint(checkpoint, selectedRun);
                        }}
                      >
                        Replay From Checkpoint
                      </Button>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Box>

        <Divider flexItem />

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700 }} color="text.secondary">
            Stage Timings
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {selectedRun.snapshot.stages.map((stage) => (
              <Paper
                key={stage.key}
                variant="outlined"
                sx={{ p: 1, borderColor: "divider", backgroundColor: "background.default" }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  gap={0.7}
                >
                  <Stack
                    direction="row"
                    spacing={0.6}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {stage.key}
                    </Typography>
                    <Chip
                      size="small"
                      label={stage.status}
                      color={toStatusChipColor(stage.status)}
                      variant="outlined"
                    />
                  </Stack>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={`Attempts ${stage.attempts}`} variant="outlined" />
                    <Chip
                      size="small"
                      label={`Time ${formatDuration(toStageDurationMs(stage.startedAtMs, stage.completedAtMs))}`}
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
                {stage.errorMessage ? (
                  <Typography
                    variant="caption"
                    color="error.main"
                    sx={{ mt: 0.55, display: "block" }}
                  >
                    {stage.errorMessage}
                  </Typography>
                ) : null}
              </Paper>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700 }} color="text.secondary">
            Replay Events
          </Typography>
          <Stack spacing={0.4} sx={{ mt: 0.5 }}>
            {replayEvents.map((event, index) => {
              const deltaMs = selectedRun.snapshot.startedAtMs
                ? Math.max(0, event.atMs - selectedRun.snapshot.startedAtMs)
                : null;

              return (
                <Typography
                  key={`${event.type}-${event.stageKey ?? "pipeline"}-${event.attempt ?? 0}-${index}`}
                  variant="caption"
                  color="text.secondary"
                >
                  +{formatDuration(deltaMs)} • {event.type}
                  {event.stageKey ? ` • ${event.stageKey}` : ""}
                  {event.attempt ? ` • attempt ${event.attempt}` : ""}
                </Typography>
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
