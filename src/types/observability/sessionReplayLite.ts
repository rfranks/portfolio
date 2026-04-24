import type { TimelineEvent } from "@/types/observability/navigationTelemetry";

export type SessionReplayLongTaskSample = {
  durationMs: number;
  atMs: number;
};

export type SessionReplayLiteMetrics = {
  latestRouteRenderMs: number | null;
  latestRouteTransitionMs: number | null;
  latestInteractionMs: number | null;
};

export type SessionReplayLitePayload = {
  exportedAt: string;
  sessionStartedAt: string;
  currentRoute: string;
  metrics: SessionReplayLiteMetrics;
  longTasks: SessionReplayLongTaskSample[];
  events: TimelineEvent[];
};
