import { PORTFOLIO_MEDIA_TELEMETRY_ACTION } from "@/consts/observability/telemetryEvents";
import type { MediaActionContract } from "@/types/media/mediaActionContract";
import { emitPortfolioTelemetryEvent } from "@/utils/observability/telemetryEvents";

function resolveMediaTelemetryAction(contract: MediaActionContract) {
  switch (contract.kind) {
    case "navigate.previous":
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.PREVIOUS_PANEL;
    case "navigate.next":
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.NEXT_PANEL;
    case "navigate.loop":
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.LOOP;
    case "details.open":
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.DETAILS_OPEN;
    case "details.close":
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.DETAILS_CLOSE;
    case "open":
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.OPEN;
    case "copy":
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.COPY;
    case "export":
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.EXPORT;
    case "zoom":
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.ZOOM;
    default:
      return PORTFOLIO_MEDIA_TELEMETRY_ACTION.OPEN;
  }
}

export function emitMediaActionTelemetry(contract: MediaActionContract): void {
  emitPortfolioTelemetryEvent({
    channel: "media",
    action: resolveMediaTelemetryAction(contract),
    trigger: contract.trigger,
    itemKey: contract.itemKey,
    mediaType: contract.mediaType,
    title: contract.title,
    source: contract.source,
    control: contract.control ?? contract.metaAction,
  });
}
