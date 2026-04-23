import type { MediaCyclerMediaType } from "@/types/media/mediaCycler";
import type { MediaActionContract, MediaActionKind } from "@/types/media/mediaActionContract";
import type { PortfolioTelemetryTrigger } from "@/types/observability/telemetryEvents";
import {
  MEDIA_SECTION_DEMO_HINTS,
  MEDIA_SECTION_DIAGRAM_HINTS,
  MEDIA_SECTION_OVERVIEW_HINTS,
} from "@/consts/components/shared/mediaCycler";

export const assertNever = (value: never): never => {
  throw new Error(`Unhandled media type: ${String(value)}`);
};

export const resolveMediaSectionPrefetchOrder = (
  searchParams: URLSearchParams,
): MediaCyclerMediaType[] => {
  const sectionToken = (searchParams.get("section") || searchParams.get("slide") || "")
    .trim()
    .toLowerCase();

  if (!sectionToken) {
    return [];
  }

  const sectionSegments = sectionToken.split(/[\\s/_-]+/).filter(Boolean);
  const hasToken = (hints: Set<string>) => sectionSegments.some((segment) => hints.has(segment));

  if (hasToken(MEDIA_SECTION_DIAGRAM_HINTS)) {
    return ["diagram", "pdf"];
  }
  if (hasToken(MEDIA_SECTION_DEMO_HINTS)) {
    return ["video", "image"];
  }
  if (hasToken(MEDIA_SECTION_OVERVIEW_HINTS)) {
    return ["markdown", "image", "video"];
  }

  return [];
};

export function resolveMediaActionContract(args: {
  kind: MediaActionKind;
  trigger: PortfolioTelemetryTrigger;
  control?: string;
  itemKey?: string;
  title?: string;
  source?: string;
  mediaType?: MediaCyclerMediaType;
  metaAction?: string;
}): MediaActionContract {
  return {
    kind: args.kind,
    trigger: args.trigger,
    control: args.control,
    itemKey: args.itemKey,
    title: args.title,
    source: args.source,
    mediaType: args.mediaType,
    metaAction: args.metaAction,
  };
}
