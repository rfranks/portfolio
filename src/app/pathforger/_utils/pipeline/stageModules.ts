import { PathForgerPipelineProgress } from "../../_types/pipeline";
import {
  PathForgerPipelineStateMachine,
  isAbortError,
  throwIfAborted,
} from "./orchestrationStateMachine";

export type PathForgerStageRetryPolicy<TContext> = {
  maxAttempts: number;
  shouldRetry: (error: unknown, context: TContext, attempt: number) => boolean;
  delayMs?: (attempt: number) => number;
};

export type PathForgerStageRecoverDecision = "retry" | "cancel" | "fail";

export type PathForgerStagePolicy<TContext, TStageKey extends string> = {
  next: readonly TStageKey[];
  retry: PathForgerStageRetryPolicy<TContext>;
  cancelMessage: string | ((context: TContext) => string);
  recover?: (params: {
    error: unknown;
    context: TContext;
    attempt: number;
    maxAttempts: number;
    stageKey: TStageKey;
    errorMessage: string;
    defaultDecision: PathForgerStageRecoverDecision;
  }) => PathForgerStageRecoverDecision;
};

export type PathForgerStagePolicyMap<TContext, TStageKey extends string> = Readonly<
  Record<TStageKey, PathForgerStagePolicy<TContext, TStageKey>>
>;

export type PathForgerStageModule<TContext, TOutput> = {
  key: string;
  progressStage?: PathForgerPipelineProgress["stage"];
  startMessage?: (context: TContext) => string;
  canceledMessage?: string | ((context: TContext) => string);
  retryMessage?: (params: {
    context: TContext;
    attempt: number;
    maxAttempts: number;
    errorMessage: string;
  }) => string;
  execute: (context: TContext) => Promise<TOutput>;
  apply: (context: TContext, output: TOutput) => TContext;
  retry?: PathForgerStageRetryPolicy<TContext>;
};

export type PathForgerTypedStageModule<
  TContext,
  TOutput,
  TStageKey extends string,
> = PathForgerStageModule<TContext, TOutput> & {
  key: TStageKey;
};

export function coerceStageModuleOutput<TContext, TOutput, TStageKey extends string>(
  module: PathForgerTypedStageModule<TContext, TOutput, TStageKey>,
): PathForgerTypedStageModule<TContext, unknown, TStageKey> {
  return module as PathForgerTypedStageModule<TContext, unknown, TStageKey>;
}

export class PathForgerStageExecutionError extends Error {
  readonly stageKey: string;

  readonly attempts: number;

  readonly causeValue: unknown;

  constructor(params: {
    stageKey: string;
    attempts: number;
    causeValue: unknown;
    message: string;
  }) {
    super(params.message);
    this.name = "PathForgerStageExecutionError";
    this.stageKey = params.stageKey;
    this.attempts = params.attempts;
    this.causeValue = params.causeValue;
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "PathForger stage execution failed.";
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createAbortError(message: string): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }

  const fallback = new Error(message);
  fallback.name = "AbortError";
  return fallback;
}

function resolveCanceledMessage<TContext, TStageKey extends string>(params: {
  module: PathForgerTypedStageModule<TContext, unknown, TStageKey>;
  context: TContext;
  stagePolicy?: PathForgerStagePolicy<TContext, TStageKey>;
}): string {
  const cancelMessageSource = params.stagePolicy?.cancelMessage ?? params.module.canceledMessage;
  if (typeof cancelMessageSource === "function") {
    return cancelMessageSource(params.context);
  }

  return cancelMessageSource ?? `PathForger pipeline canceled during ${params.module.key}.`;
}

export async function runPathForgerStageModule<
  TContext,
  TOutput,
  TStageKey extends string = string,
>(params: {
  module: PathForgerTypedStageModule<TContext, TOutput, TStageKey>;
  context: TContext;
  machine: PathForgerPipelineStateMachine;
  onProgress?: (progress: PathForgerPipelineProgress) => void;
  abortSignal?: AbortSignal;
  stagePolicy?: PathForgerStagePolicy<TContext, TStageKey>;
}): Promise<{ context: TContext; output: TOutput }> {
  const retry = params.stagePolicy?.retry ?? params.module.retry;
  const maxAttempts = Math.max(1, retry?.maxAttempts ?? 1);
  let attempt = 1;
  let lastError: unknown = null;

  while (attempt <= maxAttempts) {
    const canceledMessage = resolveCanceledMessage({
      module: coerceStageModuleOutput(params.module),
      context: params.context,
      stagePolicy: params.stagePolicy,
    });
    throwIfAborted(params.abortSignal, canceledMessage);
    params.machine.startStage(params.module.key, attempt);

    if (params.module.progressStage && params.module.startMessage) {
      params.onProgress?.({
        stage: params.module.progressStage,
        message: params.module.startMessage(params.context),
      });
    }

    try {
      const output = await params.module.execute(params.context);
      throwIfAborted(params.abortSignal, canceledMessage);
      params.machine.completeStage(params.module.key);
      return {
        context: params.module.apply(params.context, output),
        output,
      };
    } catch (error) {
      if (isAbortError(error)) {
        params.machine.cancel(canceledMessage);
        throw error;
      }

      const errorMessage = toErrorMessage(error);
      lastError = error;
      params.machine.failStage(params.module.key, errorMessage);

      const canRetryDefault =
        Boolean(retry) &&
        attempt < maxAttempts &&
        (retry?.shouldRetry(error, params.context, attempt) ?? false);
      const defaultDecision: PathForgerStageRecoverDecision = canRetryDefault ? "retry" : "fail";

      const recoverDecision =
        params.stagePolicy?.recover?.({
          error,
          context: params.context,
          attempt,
          maxAttempts,
          stageKey: params.module.key,
          errorMessage,
          defaultDecision,
        }) ?? defaultDecision;

      const retryCapacityAvailable = attempt < maxAttempts;
      const shouldRetry = recoverDecision === "retry" && retryCapacityAvailable;
      if (recoverDecision === "cancel") {
        params.machine.cancel(canceledMessage);
        throw createAbortError(canceledMessage);
      }

      if (!shouldRetry) {
        throw new PathForgerStageExecutionError({
          stageKey: params.module.key,
          attempts: attempt,
          causeValue: lastError,
          message: errorMessage,
        });
      }

      if (params.module.progressStage && params.module.retryMessage) {
        params.onProgress?.({
          stage: params.module.progressStage,
          message: params.module.retryMessage({
            context: params.context,
            attempt: attempt + 1,
            maxAttempts,
            errorMessage,
          }),
        });
      }

      const delayMs = retry?.delayMs?.(attempt) ?? 0;
      if (delayMs > 0) {
        await sleep(delayMs);
      }

      attempt += 1;
    }
  }

  throw new PathForgerStageExecutionError({
    stageKey: params.module.key,
    attempts: maxAttempts,
    causeValue: lastError,
    message: toErrorMessage(lastError),
  });
}

export async function runPathForgerStageSequence<TContext, TStageKey extends string>(params: {
  modules: readonly PathForgerTypedStageModule<TContext, unknown, TStageKey>[];
  stagePolicyMap: PathForgerStagePolicyMap<TContext, TStageKey>;
  context: TContext;
  machine: PathForgerPipelineStateMachine;
  onProgress?: (progress: PathForgerPipelineProgress) => void;
  abortSignal?: AbortSignal;
}): Promise<TContext> {
  let context = params.context;
  let previousStageKey: TStageKey | null = null;

  for (const stageModule of params.modules) {
    if (previousStageKey) {
      const allowedTransitions: readonly TStageKey[] =
        params.stagePolicyMap[previousStageKey]?.next ?? [];
      if (!allowedTransitions.includes(stageModule.key)) {
        throw new Error(
          `Invalid PathForger stage transition: ${previousStageKey} -> ${stageModule.key}.`,
        );
      }
    }

    const result = await runPathForgerStageModule({
      module: stageModule,
      context,
      machine: params.machine,
      onProgress: params.onProgress,
      abortSignal: params.abortSignal,
      stagePolicy: params.stagePolicyMap[stageModule.key],
    });
    context = result.context;
    previousStageKey = stageModule.key;
  }

  return context;
}
