import type { PortfolioTelemetryChannel } from "@/types/observability/telemetryEvents";

export type TimelineEventKind =
  | "route"
  | "interaction"
  | "long-task"
  | "media"
  | "pager"
  | "navigation";
export type TimelineMetadataValue = string | number | boolean | null;
export type TimelineMetadata = Record<string, TimelineMetadataValue>;

export type TimelineEvent = {
  id: number;
  atIso: string;
  relativeMs: number;
  route: string;
  kind: TimelineEventKind;
  action: string;
  durationMs?: number;
  metadata?: TimelineMetadata;
};

export type AppendTimelineOptions = {
  route?: string;
  durationMs?: number | null;
  metadata?: TimelineMetadata;
};

export type NavigationTelemetryHelperContext = {
  telemetryChannel: PortfolioTelemetryChannel;
};
