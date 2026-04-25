import * as React from "react";
import type { MediaCyclerItem, MediaCyclerMediaType } from "@/types/media/mediaCycler";
import {
  prefetchMediaTypeByIntent,
  resolveSectionPrefetchOrder,
} from "@/components/shared/media/media-cycler/rendererRegistry";

type UseMediaCyclerPrefetchArgs = {
  items: MediaCyclerItem[];
  renderedItem: MediaCyclerItem | null;
  previousItem: MediaCyclerItem | null;
  nextItem: MediaCyclerItem | null;
};

export function useMediaCyclerPrefetch({
  items,
  renderedItem,
  previousItem,
  nextItem,
}: UseMediaCyclerPrefetchArgs) {
  const pointerIntentPrefetchRef = React.useRef<{
    itemKey: string;
    edge: "left" | "right";
  } | null>(null);

  const prefetchMediaType = React.useCallback((mediaType: MediaCyclerMediaType) => {
    prefetchMediaTypeByIntent(mediaType);
  }, []);

  const prefetchItemMediaByIntent = React.useCallback(
    (item: MediaCyclerItem) => {
      prefetchMediaType(item.mediaType);
    },
    [prefetchMediaType],
  );

  const prefetchAdjacentItem = React.useCallback(
    (edge: "left" | "right") => {
      const targetItem = edge === "right" ? nextItem : previousItem;
      if (!targetItem) {
        return;
      }

      prefetchItemMediaByIntent(targetItem);
    },
    [nextItem, prefetchItemMediaByIntent, previousItem],
  );

  const handleSinglePanelPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const target = event.currentTarget;
      const bounds = target.getBoundingClientRect();
      if (bounds.width <= 1) {
        return;
      }

      const pointerX = event.clientX - bounds.left;
      const ratio = pointerX / bounds.width;
      const nearLeft = ratio <= 0.22;
      const nearRight = ratio >= 0.78;
      if (!nearLeft && !nearRight) {
        return;
      }

      const edge: "left" | "right" = nearRight ? "right" : "left";
      const targetItem = edge === "right" ? nextItem : previousItem;
      if (!targetItem) {
        return;
      }

      const lastIntent = pointerIntentPrefetchRef.current;
      if (lastIntent && lastIntent.itemKey === targetItem.key && lastIntent.edge === edge) {
        return;
      }

      pointerIntentPrefetchRef.current = {
        itemKey: targetItem.key,
        edge,
      };
      prefetchItemMediaByIntent(targetItem);
    },
    [nextItem, prefetchItemMediaByIntent, previousItem],
  );

  const handleSinglePanelPointerEnter = React.useCallback(() => {
    if (nextItem) {
      prefetchItemMediaByIntent(nextItem);
    }
    if (previousItem) {
      prefetchItemMediaByIntent(previousItem);
    }
  }, [nextItem, prefetchItemMediaByIntent, previousItem]);

  const handleSinglePanelFocusCapture = React.useCallback(() => {
    prefetchAdjacentItem("right");
  }, [prefetchAdjacentItem]);

  React.useEffect(() => {
    if (!items.length || typeof window === "undefined") {
      return;
    }

    const mediaTypes = new Set(items.map((item) => item.mediaType));
    const prefetch = () => {
      const sectionPrefetchOrder = resolveSectionPrefetchOrder();
      sectionPrefetchOrder.forEach((mediaType) => {
        if (mediaTypes.has(mediaType)) {
          prefetchMediaType(mediaType);
        }
      });

      mediaTypes.forEach((mediaType) => {
        if (!sectionPrefetchOrder.includes(mediaType)) {
          prefetchMediaType(mediaType);
        }
      });
    };

    if ("requestIdleCallback" in globalThis) {
      const idleId = globalThis.requestIdleCallback(prefetch, { timeout: 800 });
      return () => globalThis.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetch, 120);
    return () => globalThis.clearTimeout(timeoutId);
  }, [items, prefetchMediaType]);

  React.useEffect(() => {
    if (!renderedItem) {
      return;
    }

    pointerIntentPrefetchRef.current = null;
    prefetchItemMediaByIntent(renderedItem);
  }, [prefetchItemMediaByIntent, renderedItem]);

  return {
    prefetchItemMediaByIntent,
    handleSinglePanelPointerMove,
    handleSinglePanelPointerEnter,
    handleSinglePanelFocusCapture,
  };
}
