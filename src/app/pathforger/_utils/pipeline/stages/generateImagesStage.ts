import type { PathForgerPipelineStageKey } from "../orchestrationStateMachine";
import type {
  PathForgerImageStageResult,
  PathForgerPipelineOrchestrationContext,
} from "../../../_types/orchestrationTypes";
import type { PathForgerTypedStageModule } from "../stageModules";

type CreateGenerateImagesStageInput = {
  generateImages: (
    context: PathForgerPipelineOrchestrationContext,
  ) => Promise<PathForgerImageStageResult>;
};

export function createGenerateImagesStage(
  input: CreateGenerateImagesStageInput,
): PathForgerTypedStageModule<
  PathForgerPipelineOrchestrationContext,
  PathForgerImageStageResult,
  PathForgerPipelineStageKey
> {
  return {
    key: "generateImages",
    progressStage: "generatingImages",
    startMessage: () => "Rendering chapter and outcome images...",
    retryMessage: ({ attempt, maxAttempts, errorMessage }) =>
      `Image generation issue (${errorMessage}). Retrying (${attempt}/${maxAttempts})...`,
    execute: async (context) => input.generateImages(context),
    apply: (context, imageStageResult) => ({
      ...context,
      imageStageResult,
    }),
  };
}
