import type { SequenceAnalysisRecipeKind } from "../_utils/sequenceUtils";

export type SequenceAnalysisRecipeState = {
  activeRecipeKind: SequenceAnalysisRecipeKind;
  selectedRecipeKinds: SequenceAnalysisRecipeKind[];
  motif: string;
  gcWindowSize: number;
  gcThresholdPct: number;
  minOrfCodons: number;
};

export type SequenceAnalysisPreset = {
  schemaVersion: 2;
  name: string;
  createdAtIso: string;
  updatedAtIso: string;
  state: SequenceAnalysisRecipeState;
};

export type SequenceAnalysisLegacyPreset = {
  name: string;
  recipeKind: SequenceAnalysisRecipeKind;
  motif: string;
  gcWindowSize: number;
  gcThresholdPct: number;
  minOrfCodons: number;
};
