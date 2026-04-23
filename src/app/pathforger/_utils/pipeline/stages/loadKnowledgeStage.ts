import type { PathForgerPipelineStageKey } from "../orchestrationStateMachine";
import type {
  PathForgerKnowledge,
  PathForgerPipelineOrchestrationContext,
} from "../../../_types/orchestrationTypes";
import type { PathForgerTypedStageModule } from "../stageModules";

type CreateLoadKnowledgeStageInput = {
  loadKnowledge: () => Promise<PathForgerKnowledge>;
};

export function createLoadKnowledgeStage(
  input: CreateLoadKnowledgeStageInput,
): PathForgerTypedStageModule<
  PathForgerPipelineOrchestrationContext,
  PathForgerKnowledge,
  PathForgerPipelineStageKey
> {
  return {
    key: "loadKnowledge",
    progressStage: "loadingKnowledge",
    startMessage: () => "Loading PathForger story knowledge...",
    retryMessage: ({ attempt, maxAttempts, errorMessage }) =>
      `Knowledge loading issue (${errorMessage}). Retrying (${attempt}/${maxAttempts})...`,
    execute: async () => input.loadKnowledge(),
    apply: (context, knowledge) => ({
      ...context,
      knowledge,
    }),
  };
}
