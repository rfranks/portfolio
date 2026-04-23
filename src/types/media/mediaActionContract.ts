import type { MediaCyclerMediaType } from "@/types/media/mediaCycler";
import type { PortfolioTelemetryTrigger } from "@/types/observability/telemetryEvents";

export type MediaActionKind =
  | "navigate.previous"
  | "navigate.next"
  | "navigate.loop"
  | "details.open"
  | "details.close"
  | "open"
  | "copy"
  | "export"
  | "zoom";

export type MediaActionContract = {
  kind: MediaActionKind;
  trigger: PortfolioTelemetryTrigger;
  control?: string;
  itemKey?: string;
  title?: string;
  source?: string;
  mediaType?: MediaCyclerMediaType;
  metaAction?: string;
};
