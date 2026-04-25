import * as React from "react";
import { PORTFOLIO_SHORTCUT_EVENT } from "@/consts/observability/telemetryEvents";
import type { MediaActionKind } from "@/types/media/mediaActionContract";
import type { MediaCyclerItem } from "@/types/media/mediaCycler";
import type { PortfolioTelemetryTrigger } from "@/types/observability/telemetryEvents";
import { copyTextToClipboard } from "@/utils/components/shared/diagram";
import { addPortfolioWindowEventListener } from "@/utils/observability/telemetryEvents";

type EmitMediaTelemetry = (
  kind: MediaActionKind,
  trigger: PortfolioTelemetryTrigger,
  item: MediaCyclerItem | null | undefined,
  control?: string,
) => void;

type UseMediaCyclerNavigationArgs = {
  singlePanel: boolean;
  renderedItem: MediaCyclerItem | null;
  handleChevronPrevious: () => void;
  handleChevronNext: () => void;
  handleLoopNavigation: () => void;
  emitMediaTelemetry: EmitMediaTelemetry;
};

export function useMediaCyclerNavigation({
  singlePanel,
  renderedItem,
  handleChevronPrevious,
  handleChevronNext,
  handleLoopNavigation,
  emitMediaTelemetry,
}: UseMediaCyclerNavigationArgs) {
  const navigatePrevious = React.useCallback(
    (trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("navigate.previous", trigger, renderedItem, control);
      handleChevronPrevious();
    },
    [emitMediaTelemetry, handleChevronPrevious, renderedItem],
  );

  const navigateNext = React.useCallback(
    (trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("navigate.next", trigger, renderedItem, control);
      handleChevronNext();
    },
    [emitMediaTelemetry, handleChevronNext, renderedItem],
  );

  const navigateLoop = React.useCallback(
    (trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("navigate.loop", trigger, renderedItem, control);
      handleLoopNavigation();
    },
    [emitMediaTelemetry, handleLoopNavigation, renderedItem],
  );

  React.useEffect(() => {
    if (!singlePanel) {
      return;
    }

    const removePreviousShortcut = addPortfolioWindowEventListener(
      PORTFOLIO_SHORTCUT_EVENT.MEDIA_PREV,
      () => navigatePrevious("keyboard-shortcut", "media-prev-shortcut"),
    );
    const removeNextShortcut = addPortfolioWindowEventListener(
      PORTFOLIO_SHORTCUT_EVENT.MEDIA_NEXT,
      () => navigateNext("keyboard-shortcut", "media-next-shortcut"),
    );
    const removeLoopShortcut = addPortfolioWindowEventListener(
      PORTFOLIO_SHORTCUT_EVENT.MEDIA_LOOP,
      () => navigateLoop("keyboard-shortcut", "media-loop-shortcut"),
    );

    return () => {
      removePreviousShortcut();
      removeNextShortcut();
      removeLoopShortcut();
    };
  }, [navigateLoop, navigateNext, navigatePrevious, singlePanel]);

  const handleSinglePanelKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigatePrevious("keyboard", "ArrowLeft");
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigateNext("keyboard", "ArrowRight");
        return;
      }

      if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        navigateLoop("keyboard", "l");
        return;
      }

      if (event.key.toLowerCase() === "o") {
        event.preventDefault();
        if (renderedItem?.onMediaActivate) {
          renderedItem.onMediaActivate();
        }
        emitMediaTelemetry("open", "keyboard", renderedItem, "open-media-action");
        return;
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        const copyValue =
          renderedItem?.mediaSourceHref ??
          renderedItem?.mediaUrl ??
          renderedItem?.mediaCaption ??
          renderedItem?.title;
        if (copyValue?.trim()) {
          void copyTextToClipboard(copyValue);
        }
        emitMediaTelemetry("copy", "keyboard", renderedItem, "copy-media-action");
        return;
      }

      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        emitMediaTelemetry("export", "keyboard", renderedItem, "export-media-action");
        return;
      }

      if (event.key === "+" || event.key === "=" || event.key === "-") {
        event.preventDefault();
        emitMediaTelemetry("zoom", "keyboard", renderedItem, "zoom-media-action");
      }
    },
    [emitMediaTelemetry, navigateLoop, navigateNext, navigatePrevious, renderedItem],
  );

  return {
    navigatePrevious,
    navigateNext,
    navigateLoop,
    handleSinglePanelKeyDown,
  };
}
