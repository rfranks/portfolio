import * as React from "react";
import type { MediaCyclerItem } from "@/types/media/mediaCycler";

export type MediaCyclerControllerArgs = {
  items: MediaCyclerItem[];
  singlePanel: boolean;
  singlePanelActiveKey?: string;
  disableTransition: boolean;
  transitionMs: number;
  loopNavigation: boolean;
  loopFromBeginning: boolean;
  disableChevronPrevious?: boolean;
  disableChevronNext?: boolean;
  hideDisabledNextChevron: boolean;
  disableLoopNavigation: boolean;
  onChevronPrevious?: () => void;
  onChevronNext?: () => void;
  onLoopNavigation?: () => void;
  allowSwipe: boolean;
};

export function useMediaCyclerController({
  items,
  singlePanel,
  singlePanelActiveKey,
  disableTransition,
  transitionMs,
  loopNavigation,
  loopFromBeginning,
  disableChevronPrevious,
  disableChevronNext,
  hideDisabledNextChevron,
  disableLoopNavigation,
  onChevronPrevious,
  onChevronNext,
  onLoopNavigation,
  allowSwipe,
}: MediaCyclerControllerArgs) {
  const resolveActiveItem = React.useCallback(() => {
    if (items.length === 0) {
      return null;
    }

    if (singlePanelActiveKey) {
      return items.find((item) => item.key === singlePanelActiveKey) ?? items[0];
    }

    return items[0];
  }, [items, singlePanelActiveKey]);

  const initialItem = resolveActiveItem();
  const [renderedItem, setRenderedItem] = React.useState<MediaCyclerItem | null>(initialItem);
  const [isVisible, setIsVisible] = React.useState(true);
  const [transitionDirection, setTransitionDirection] = React.useState<"left" | "right">("right");
  const [metadataDialogItemKey, setMetadataDialogItemKey] = React.useState<string | null>(null);
  const [markdownByKey, setMarkdownByKey] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!singlePanel) {
      return;
    }

    const nextItem = resolveActiveItem();
    const currentKey = renderedItem?.key ?? null;
    const nextKey = nextItem?.key ?? null;

    if (currentKey === nextKey) {
      return;
    }

    if (disableTransition) {
      setRenderedItem(nextItem);
      setIsVisible(true);
      return;
    }

    if (currentKey && nextKey) {
      const currentIndex = items.findIndex((item) => item.key === currentKey);
      const nextIndex = items.findIndex((item) => item.key === nextKey);
      if (currentIndex !== -1 && nextIndex !== -1) {
        setTransitionDirection(nextIndex > currentIndex ? "right" : "left");
      }
    }

    setIsVisible(false);
    const swapDelay = Math.max(120, Math.floor(transitionMs * 0.45));
    const timeoutId = window.setTimeout(() => {
      setRenderedItem(nextItem);
      window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, swapDelay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [disableTransition, items, renderedItem, resolveActiveItem, singlePanel, transitionMs]);

  const activeKey = renderedItem?.key ?? null;
  const activeIndex = activeKey == null ? -1 : items.findIndex((item) => item.key === activeKey);
  const hasMultipleItems = items.length > 1;
  const previousItem = activeIndex > 0 ? items[activeIndex - 1] : null;
  const nextItem = activeIndex >= 0 ? items[activeIndex + 1] || null : null;
  const isAtFinalItem = activeIndex >= 0 && activeIndex === Math.max(items.length - 1, 0);
  const canWrapToFirst = loopNavigation && isAtFinalItem && hasMultipleItems;
  const canWrapToLast =
    loopNavigation && loopFromBeginning && activeIndex === 0 && hasMultipleItems;
  const previousDisabledRaw =
    disableChevronPrevious ?? (!previousItem || !Boolean(previousItem.onSelect));
  const nextDisabledRaw = disableChevronNext ?? (!nextItem || !Boolean(nextItem.onSelect));
  const previousDisabled = previousDisabledRaw && !canWrapToLast;
  const nextDisabled = nextDisabledRaw && !canWrapToFirst;
  const showLoopAction = canWrapToFirst;
  const loopDisabled = disableLoopNavigation;
  const hideNextChevron = hideDisabledNextChevron && !showLoopAction && nextDisabled;
  const swipeRef = React.useRef<{
    startX: number;
    startY: number;
    blocked: boolean;
    deltaX: number;
    deltaY: number;
  } | null>(null);

  const handleChevronPrevious = React.useCallback(() => {
    if (previousDisabled) {
      return;
    }

    if (onChevronPrevious) {
      onChevronPrevious();
      return;
    }

    if (previousItem?.onSelect) {
      previousItem.onSelect();
      return;
    }

    if (canWrapToLast) {
      const lastItem = items[items.length - 1];
      lastItem?.onSelect?.();
    }
  }, [canWrapToLast, items, onChevronPrevious, previousDisabled, previousItem]);

  const handleChevronNext = React.useCallback(() => {
    if (nextDisabled) {
      return;
    }

    if (onChevronNext) {
      onChevronNext();
      return;
    }

    nextItem?.onSelect?.();
  }, [nextDisabled, nextItem, onChevronNext]);

  const handleLoopNavigation = React.useCallback(() => {
    if (loopDisabled) {
      return;
    }

    if (onLoopNavigation) {
      onLoopNavigation();
      return;
    }

    const firstCycleItem = items[0];
    firstCycleItem?.onSelect?.();
  }, [items, loopDisabled, onLoopNavigation]);

  const isInteractiveSwipeTarget = React.useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return Boolean(
      target.closest(
        "a,button,input,textarea,select,summary,video,[role='button'],[role='link'],[data-no-swipe='true']",
      ),
    );
  }, []);

  const handleSwipeStart = React.useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!allowSwipe || event.touches.length !== 1) {
        swipeRef.current = null;
        return;
      }

      const touch = event.touches[0];
      swipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        blocked: isInteractiveSwipeTarget(event.target),
        deltaX: 0,
        deltaY: 0,
      };
    },
    [allowSwipe, isInteractiveSwipeTarget],
  );

  const handleSwipeMove = React.useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      const swipeState = swipeRef.current;
      if (!allowSwipe || !swipeState || swipeState.blocked || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      swipeState.deltaX = touch.clientX - swipeState.startX;
      swipeState.deltaY = touch.clientY - swipeState.startY;

      if (
        Math.abs(swipeState.deltaX) > 12 &&
        Math.abs(swipeState.deltaX) > Math.abs(swipeState.deltaY)
      ) {
        event.preventDefault();
      }
    },
    [allowSwipe],
  );

  const handleSwipeEnd = React.useCallback(() => {
    const swipeState = swipeRef.current;
    swipeRef.current = null;

    if (!allowSwipe || !swipeState || swipeState.blocked) {
      return;
    }

    const { deltaX, deltaY } = swipeState;
    if (Math.abs(deltaX) < 72) {
      return;
    }

    if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.1) {
      return;
    }

    if (deltaX < 0) {
      handleChevronNext();
      return;
    }

    handleChevronPrevious();
  }, [allowSwipe, handleChevronNext, handleChevronPrevious]);

  const handleSwipeCancel = React.useCallback(() => {
    swipeRef.current = null;
  }, []);

  React.useEffect(() => {
    const markdownItems = items.filter(
      (item) => item.mediaType === "markdown" && item.markdownPath?.trim(),
    );

    if (markdownItems.length === 0) {
      return;
    }

    const abortControllers: AbortController[] = [];
    let cancelled = false;

    const loadMarkdown = async () => {
      const entries = await Promise.all(
        markdownItems.map(async (item) => {
          const controller = new AbortController();
          abortControllers.push(controller);

          try {
            const response = await fetch(item.markdownPath as string, {
              signal: controller.signal,
            });
            if (!response.ok) {
              return [item.key, ""] as const;
            }
            const text = await response.text();
            return [item.key, text] as const;
          } catch {
            return [item.key, ""] as const;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setMarkdownByKey((current) => {
        const next = { ...current };
        entries.forEach(([key, content]) => {
          next[key] = content;
        });
        return next;
      });
    };

    void loadMarkdown();

    return () => {
      cancelled = true;
      abortControllers.forEach((controller) => controller.abort());
    };
  }, [items]);

  const metadataDialogItem =
    metadataDialogItemKey == null
      ? null
      : items.find((item) => item.key === metadataDialogItemKey) || null;

  return {
    renderedItem,
    isVisible,
    transitionDirection,
    metadataDialogItem,
    setMetadataDialogItemKey,
    markdownByKey,
    previousDisabled,
    nextDisabled,
    showLoopAction,
    loopDisabled,
    hideNextChevron,
    handleChevronPrevious,
    handleChevronNext,
    handleLoopNavigation,
    handleSwipeStart,
    handleSwipeMove,
    handleSwipeEnd,
    handleSwipeCancel,
  };
}
