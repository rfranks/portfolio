import * as React from "react";
import { PORTFOLIO_MEDIA_TELEMETRY_ACTION } from "@/consts/observability/telemetryEvents";
import type { MediaActionKind } from "@/types/media/mediaActionContract";
import type { MediaCyclerItem, MediaCyclerMediaType } from "@/types/media/mediaCycler";
import type { PortfolioTelemetryTrigger } from "@/types/observability/telemetryEvents";
import { resolveMediaActionContract } from "@/utils/components/shared/mediaCycler";
import { emitMediaActionBusEvent } from "@/utils/media/mediaActionBus";
import { emitMediaActionTelemetry } from "@/utils/media/mediaActionTelemetry";
import { emitPortfolioTelemetryEvent } from "@/utils/observability/telemetryEvents";

type UseMediaCyclerTelemetryArgs = {
  renderedItem: MediaCyclerItem | null;
  metadataDialogItem: MediaCyclerItem | null;
  setMetadataDialogItemKey: (key: string | null) => void;
};

const isFirstRenderTrackedMediaType = (
  mediaType: MediaCyclerMediaType,
): mediaType is "image" | "video" | "pdf" | "diagram" =>
  mediaType === "image" || mediaType === "video" || mediaType === "pdf" || mediaType === "diagram";

export function useMediaCyclerTelemetry({
  renderedItem,
  metadataDialogItem,
  setMetadataDialogItemKey,
}: UseMediaCyclerTelemetryArgs) {
  const mediaFirstRenderStartMsRef = React.useRef<Record<string, number>>({});
  const mediaFirstRenderReportedKeysRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!renderedItem) {
      return;
    }

    if (
      isFirstRenderTrackedMediaType(renderedItem.mediaType) &&
      !mediaFirstRenderReportedKeysRef.current.has(renderedItem.key)
    ) {
      mediaFirstRenderStartMsRef.current[renderedItem.key] = performance.now();
    }
  }, [renderedItem]);

  const emitMediaTelemetry = React.useCallback(
    (
      kind: MediaActionKind,
      trigger: PortfolioTelemetryTrigger,
      item: MediaCyclerItem | null | undefined,
      control?: string,
    ) => {
      const actionContract = resolveMediaActionContract({
        kind,
        trigger,
        control,
        itemKey: item?.key,
        mediaType: item?.mediaType,
        title: item?.title,
        source: item?.mediaSource,
      });

      emitMediaActionTelemetry(actionContract);
      emitMediaActionBusEvent({
        source: "media-cycler",
        action: actionContract,
      });
    },
    [],
  );

  const openMetadataDialog = React.useCallback(
    (item: MediaCyclerItem, trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("details.open", trigger, item, control);
      setMetadataDialogItemKey(item.key);
    },
    [emitMediaTelemetry, setMetadataDialogItemKey],
  );

  const closeMetadataDialog = React.useCallback(
    (trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("details.close", trigger, metadataDialogItem, control);
      setMetadataDialogItemKey(null);
    },
    [emitMediaTelemetry, metadataDialogItem, setMetadataDialogItemKey],
  );

  const handleRendererFirstRenderReady = React.useCallback(
    (item: MediaCyclerItem, control?: string) => {
      if (!isFirstRenderTrackedMediaType(item.mediaType)) {
        return;
      }

      if (mediaFirstRenderReportedKeysRef.current.has(item.key)) {
        return;
      }
      mediaFirstRenderReportedKeysRef.current.add(item.key);

      const startedAtMs = mediaFirstRenderStartMsRef.current[item.key] ?? performance.now();
      const durationMs = Math.max(0, performance.now() - startedAtMs);

      emitPortfolioTelemetryEvent({
        channel: "media",
        action: PORTFOLIO_MEDIA_TELEMETRY_ACTION.FIRST_RENDER,
        trigger: "programmatic",
        itemKey: item.key,
        mediaType: item.mediaType,
        title: item.title,
        source: item.mediaSource,
        control: control ?? "renderer-ready",
        durationMs,
      });
    },
    [],
  );

  const emitRendererMediaAction = React.useCallback(
    (
      item: MediaCyclerItem,
      params: {
        kind: MediaActionKind;
        trigger: PortfolioTelemetryTrigger;
        control?: string;
        metaAction?: string;
      },
    ) => {
      const actionContract = resolveMediaActionContract({
        kind: params.kind,
        trigger: params.trigger,
        control: params.control,
        metaAction: params.metaAction,
        itemKey: item.key,
        mediaType: item.mediaType,
        title: item.title,
        source: item.mediaSource,
      });

      emitMediaActionTelemetry(actionContract);
      emitMediaActionBusEvent({
        source: "media-cycler",
        action: actionContract,
      });
    },
    [],
  );

  return {
    emitMediaTelemetry,
    openMetadataDialog,
    closeMetadataDialog,
    handleRendererFirstRenderReady,
    emitRendererMediaAction,
  };
}
