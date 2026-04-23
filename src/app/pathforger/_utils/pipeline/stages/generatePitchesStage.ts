import type { PathForgerPipelineStageKey } from "../orchestrationStateMachine";
import type {
  PathForgerPipelineOrchestrationContext,
  PathForgerPitchesStageResult,
} from "../../../_types/orchestrationTypes";
import type { PathForgerTypedStageModule } from "../stageModules";

type CreateGeneratePitchesStageInput = {
  generatePitches: (
    context: PathForgerPipelineOrchestrationContext,
  ) => Promise<PathForgerPitchesStageResult>;
};

export function createGeneratePitchesStage(
  input: CreateGeneratePitchesStageInput,
): PathForgerTypedStageModule<
  PathForgerPipelineOrchestrationContext,
  PathForgerPitchesStageResult,
  PathForgerPipelineStageKey
> {
  return {
    key: "generatePitches",
    progressStage: "generatingPitches",
    startMessage: () => "Generating a selection of potential stories...",
    retryMessage: ({ attempt, maxAttempts, errorMessage }) =>
      `Pitch generation issue (${errorMessage}). Retrying (${attempt}/${maxAttempts})...`,
    execute: async (context) => input.generatePitches(context),
    apply: (context, result) => ({
      ...context,
      pitches: result.pitches,
      selectedPitch: result.selectedPitch,
    }),
  };
}
