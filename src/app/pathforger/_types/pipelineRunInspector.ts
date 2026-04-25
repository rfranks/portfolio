import type {
  PathForgerBranchChoice,
  PathForgerChapterResult,
  PathForgerPitchResult,
} from "@/app/pathforger/_types/pipeline";
import type { PathForgerPitchChoice } from "@/app/pathforger/_types/pitch";
import type { PathForgerPipelineStateSnapshot } from "@/app/pathforger/_utils/pipeline/orchestrationStateMachine";
import type { PathForgerPipelineStageKey } from "@/app/pathforger/_utils/pipeline/orchestrationStateMachine";

export type PathForgerPipelineStageModelTrace = {
  stageKey: string;
  model: string;
  traceType: "knowledge" | "text" | "image";
};

export type PathForgerPipelineReplayCheckpoint = {
  checkpointId: string;
  stageKey: PathForgerPipelineStageKey;
  capturedAtMs: number;
  label: string;
  selectedPitch?: PathForgerPitchChoice;
  selectedBranch?: PathForgerBranchChoice;
  pitches?: PathForgerPitchResult;
  chapter?: PathForgerChapterResult;
};

export type PathForgerBranchOutcomeSnapshot = {
  chapterNumber: number;
  selectedPitch: PathForgerPitchChoice;
  chapterTitle: string;
  outcomeA: string;
  outcomeB: string;
  pathLedgerMarkdown: string;
};

export type PathForgerPipelineRunDiagnostics = {
  runId: string;
  capturedAtIso: string;
  requestedTextModel: string;
  requestedImageModel: string;
  resolvedTextModel: string;
  resolvedImageModel: string;
  snapshot: PathForgerPipelineStateSnapshot;
  stageModelTrace: PathForgerPipelineStageModelTrace[];
  checkpoints: PathForgerPipelineReplayCheckpoint[];
  branchOutcomeSnapshot: PathForgerBranchOutcomeSnapshot | null;
};
