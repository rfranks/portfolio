import type { PathForgerPipelineOrchestrationContext } from "../../_types/orchestrationTypes";
import {
  PATHFORGER_PIPELINE_STAGE_KEYS,
  PATHFORGER_PIPELINE_STAGE_TRANSITIONS,
  PathForgerPipelineStateMachine,
  type PathForgerPipelineStageKey,
  isAbortError,
} from "./orchestrationStateMachine";
import {
  PathForgerStageExecutionError,
  type PathForgerStagePolicy,
  type PathForgerStagePolicyMap,
} from "./stageModules";

export type CreatePathForgerStagePolicyMapInput = {
  retryDelayMs: (attempt: number) => number;
  shouldRetry?: (error: unknown) => boolean;
};

type PathForgerStageRetryAdapter = {
  maxAttempts?: number;
  shouldRetry?: (
    error: unknown,
    context: PathForgerPipelineOrchestrationContext,
    attempt: number,
  ) => boolean;
  delayMs?: (attempt: number) => number;
};

type PathForgerStageRecoverResolver = NonNullable<
  PathForgerStagePolicy<
    PathForgerPipelineOrchestrationContext,
    PathForgerPipelineStageKey
  >["recover"]
>;

type PathForgerStageOrchestrationAdapter = {
  cancelMessage: string;
  retry?: PathForgerStageRetryAdapter;
  recover?: PathForgerStageRecoverResolver;
};

const PATHFORGER_PIPELINE_CANCEL_MESSAGES = {
  beforeStart: "PathForger pipeline canceled before start.",
  beforeFinalization: "PathForger pipeline canceled before finalization.",
  canceled: "PathForger pipeline canceled.",
} as const;

const defaultRecover: PathForgerStageRecoverResolver = ({ defaultDecision }) => defaultDecision;

const STAGE_ORCHESTRATION_ADAPTERS: Readonly<
  Record<PathForgerPipelineStageKey, PathForgerStageOrchestrationAdapter>
> = {
  loadKnowledge: {
    cancelMessage: "PathForger pipeline canceled while loading story knowledge.",
  },
  generatePitches: {
    cancelMessage: "PathForger pipeline canceled during pitch generation.",
  },
  generateChapter: {
    cancelMessage: "PathForger pipeline canceled during chapter generation.",
  },
  generateImages: {
    cancelMessage: "PathForger pipeline canceled during image rendering.",
  },
};

export function normalizePathForgerPipelineErrorMessage(error: unknown): string {
  if (error instanceof PathForgerStageExecutionError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "PathForger pipeline failed.";
}

export function shouldRetryPathForgerPipelineStageError(error: unknown): boolean {
  if (isAbortError(error)) {
    return false;
  }

  const message = normalizePathForgerPipelineErrorMessage(error);
  const normalized = message.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("timeout") ||
    normalized.includes("timed out") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("network error") ||
    normalized.includes("fetch failed") ||
    normalized.includes("server error") ||
    /\b5\d{2}\b/.test(normalized)
  );
}

function buildStagePolicyMap(
  input: CreatePathForgerStagePolicyMapInput,
): PathForgerStagePolicyMap<PathForgerPipelineOrchestrationContext, PathForgerPipelineStageKey> {
  const shouldRetry = input.shouldRetry ?? shouldRetryPathForgerPipelineStageError;
  const stagePolicyMap = {} as Record<
    PathForgerPipelineStageKey,
    PathForgerStagePolicy<PathForgerPipelineOrchestrationContext, PathForgerPipelineStageKey>
  >;

  for (const stageKey of PATHFORGER_PIPELINE_STAGE_KEYS) {
    const stageAdapter = STAGE_ORCHESTRATION_ADAPTERS[stageKey];
    stagePolicyMap[stageKey] = {
      next: PATHFORGER_PIPELINE_STAGE_TRANSITIONS[stageKey],
      retry: {
        maxAttempts: Math.max(1, stageAdapter.retry?.maxAttempts ?? 2),
        shouldRetry: (error, context, attempt) =>
          stageAdapter.retry?.shouldRetry?.(error, context, attempt) ?? shouldRetry(error),
        delayMs: (attempt) => stageAdapter.retry?.delayMs?.(attempt) ?? input.retryDelayMs(attempt),
      },
      cancelMessage: stageAdapter.cancelMessage,
      recover: stageAdapter.recover ?? defaultRecover,
    };
  }

  return stagePolicyMap;
}

function mapPathForgerPipelineError(params: {
  error: unknown;
  machine: PathForgerPipelineStateMachine;
}): Error {
  if (isAbortError(params.error)) {
    params.machine.cancel(PATHFORGER_PIPELINE_CANCEL_MESSAGES.canceled);
    return new Error(PATHFORGER_PIPELINE_CANCEL_MESSAGES.canceled);
  }

  if (params.error instanceof PathForgerStageExecutionError) {
    return new Error(
      `PathForger pipeline failed during ${params.error.stageKey}: ${params.error.message}`,
    );
  }

  const normalizedMessage = normalizePathForgerPipelineErrorMessage(params.error);
  params.machine.failUnhandled(normalizedMessage);
  return new Error(normalizedMessage);
}

export type PathForgerPipelineOrchestrationPolicy = {
  stagePolicyMap: PathForgerStagePolicyMap<
    PathForgerPipelineOrchestrationContext,
    PathForgerPipelineStageKey
  >;
  cancelMessages: typeof PATHFORGER_PIPELINE_CANCEL_MESSAGES;
  mapPipelineError: (params: { error: unknown; machine: PathForgerPipelineStateMachine }) => Error;
};

export function createPathForgerPipelineOrchestrationPolicy(
  input: CreatePathForgerStagePolicyMapInput,
): PathForgerPipelineOrchestrationPolicy {
  return {
    stagePolicyMap: buildStagePolicyMap(input),
    cancelMessages: PATHFORGER_PIPELINE_CANCEL_MESSAGES,
    mapPipelineError: (params) => mapPathForgerPipelineError(params),
  };
}

export function createPathForgerStagePolicyMap(
  input: CreatePathForgerStagePolicyMapInput,
): PathForgerStagePolicyMap<PathForgerPipelineOrchestrationContext, PathForgerPipelineStageKey> {
  return createPathForgerPipelineOrchestrationPolicy(input).stagePolicyMap;
}
