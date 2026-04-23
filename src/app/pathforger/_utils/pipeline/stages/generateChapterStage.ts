import type { PathForgerChapterResult } from "../../../_types/pipeline";
import type { PathForgerPipelineStageKey } from "../orchestrationStateMachine";
import type { PathForgerPipelineOrchestrationContext } from "../../../_types/orchestrationTypes";
import type { PathForgerTypedStageModule } from "../stageModules";

type CreateGenerateChapterStageInput = {
  generateChapter: (
    context: PathForgerPipelineOrchestrationContext,
  ) => Promise<PathForgerChapterResult>;
  getStartMessage: (context: PathForgerPipelineOrchestrationContext) => string;
};

export function createGenerateChapterStage(
  input: CreateGenerateChapterStageInput,
): PathForgerTypedStageModule<
  PathForgerPipelineOrchestrationContext,
  PathForgerChapterResult,
  PathForgerPipelineStageKey
> {
  return {
    key: "generateChapter",
    progressStage: "generatingChapter",
    startMessage: (context) => input.getStartMessage(context),
    retryMessage: ({ attempt, maxAttempts, errorMessage }) =>
      `Chapter generation issue (${errorMessage}). Retrying (${attempt}/${maxAttempts})...`,
    execute: async (context) => input.generateChapter(context),
    apply: (context, chapter) => ({
      ...context,
      chapter,
    }),
  };
}
