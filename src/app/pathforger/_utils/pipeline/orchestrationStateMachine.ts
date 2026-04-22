export const PATHFORGER_PIPELINE_STAGE_KEYS = [
  "loadKnowledge",
  "generatePitches",
  "generateChapter",
  "generateImages",
] as const;

export type PathForgerPipelineStageKey = (typeof PATHFORGER_PIPELINE_STAGE_KEYS)[number];

export const PATHFORGER_PIPELINE_STAGE_TRANSITIONS: Readonly<
  Record<PathForgerPipelineStageKey, readonly PathForgerPipelineStageKey[]>
> = {
  loadKnowledge: ["generatePitches"],
  generatePitches: ["generateChapter"],
  generateChapter: ["generateImages"],
  generateImages: [],
} as const;

export type PathForgerPipelineOrchestrationState =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "canceled";

export type PathForgerPipelineStageStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "canceled";

export interface PathForgerPipelineStageSnapshot {
  key: string;
  status: PathForgerPipelineStageStatus;
  attempts: number;
  startedAtMs?: number;
  completedAtMs?: number;
  errorMessage?: string;
}

export interface PathForgerPipelineStateSnapshot {
  state: PathForgerPipelineOrchestrationState;
  currentStageKey?: string;
  stages: PathForgerPipelineStageSnapshot[];
  startedAtMs?: number;
  completedAtMs?: number;
  canceledReason?: string;
  lastErrorMessage?: string;
}

function createAbortError(message: string): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }

  const fallback = new Error(message);
  fallback.name = "AbortError";
  return fallback;
}

export function isAbortError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError",
  );
}

export function throwIfAborted(signal: AbortSignal | undefined, message: string): void {
  if (!signal?.aborted) {
    return;
  }

  throw createAbortError(message);
}

export class PathForgerPipelineStateMachine {
  private readonly stageIndexByKey: Map<string, number>;

  private snapshot: PathForgerPipelineStateSnapshot;

  constructor(stageKeys: readonly string[]) {
    this.stageIndexByKey = new Map(stageKeys.map((key, index) => [key, index]));
    this.snapshot = {
      state: "idle",
      stages: stageKeys.map((key) => ({
        key,
        status: "pending",
        attempts: 0,
      })),
    };
  }

  start(): void {
    this.snapshot = {
      ...this.snapshot,
      state: "running",
      startedAtMs: Date.now(),
      completedAtMs: undefined,
      canceledReason: undefined,
      lastErrorMessage: undefined,
    };
  }

  startStage(key: string, attempt: number): void {
    this.updateStage(key, {
      status: "running",
      attempts: attempt,
      startedAtMs: Date.now(),
      completedAtMs: undefined,
      errorMessage: undefined,
    });

    this.snapshot = {
      ...this.snapshot,
      state: "running",
      currentStageKey: key,
    };
  }

  completeStage(key: string): void {
    this.updateStage(key, {
      status: "success",
      completedAtMs: Date.now(),
      errorMessage: undefined,
    });
  }

  failStage(key: string, errorMessage: string): void {
    this.updateStage(key, {
      status: "error",
      completedAtMs: Date.now(),
      errorMessage,
    });

    this.snapshot = {
      ...this.snapshot,
      state: "failed",
      lastErrorMessage: errorMessage,
    };
  }

  cancel(reason = "PathForger pipeline canceled."): void {
    const now = Date.now();
    const currentStage = this.snapshot.currentStageKey;

    if (currentStage) {
      this.updateStage(currentStage, {
        status: "canceled",
        completedAtMs: now,
        errorMessage: reason,
      });
    }

    this.snapshot = {
      ...this.snapshot,
      state: "canceled",
      completedAtMs: now,
      canceledReason: reason,
      lastErrorMessage: reason,
    };
  }

  complete(): void {
    this.snapshot = {
      ...this.snapshot,
      state: "completed",
      completedAtMs: Date.now(),
      currentStageKey: undefined,
    };
  }

  getSnapshot(): PathForgerPipelineStateSnapshot {
    return {
      ...this.snapshot,
      stages: this.snapshot.stages.map((stage) => ({ ...stage })),
    };
  }

  private updateStage(
    key: string,
    patch: Partial<Omit<PathForgerPipelineStageSnapshot, "key">>,
  ): void {
    const index = this.stageIndexByKey.get(key);
    if (index === undefined) {
      return;
    }

    this.snapshot = {
      ...this.snapshot,
      stages: this.snapshot.stages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    };
  }
}
