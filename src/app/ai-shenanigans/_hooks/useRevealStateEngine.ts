"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildCondensedChronologyIndices,
  resolveCurrentRevealIndex,
} from "../_utils/chronologyUtils";
import type { RevealTimelineItem, RevealViewMode } from "../_types/revealStateEngine";

type UseRevealStateEngineArgs<TKey extends string> = {
  items: RevealTimelineItem<TKey>[];
  mode?: RevealViewMode;
  onModeChange?: (mode: RevealViewMode) => void;
  defaultMode?: RevealViewMode;
  condensedThreshold?: number;
};

export function useRevealStateEngine<TKey extends string>({
  items,
  mode: controlledMode,
  onModeChange,
  defaultMode = "chips",
  condensedThreshold = 3,
}: UseRevealStateEngineArgs<TKey>) {
  const [uncontrolledMode, setUncontrolledMode] = useState<RevealViewMode>(defaultMode);
  const mode = controlledMode ?? uncontrolledMode;

  const setMode = useCallback(
    (nextMode: RevealViewMode) => {
      if (controlledMode === undefined) {
        setUncontrolledMode(nextMode);
      }
      onModeChange?.(nextMode);
    },
    [controlledMode, onModeChange],
  );

  const currentIndex = useMemo(() => resolveCurrentRevealIndex(items), [items]);

  const useCondensedChips = mode === "chips" && items.length > condensedThreshold;

  const displayedIndices = useMemo(() => {
    if (!useCondensedChips) {
      return items.map((_, index) => index);
    }

    return buildCondensedChronologyIndices({
      labelCount: items.length,
      currentIndex,
    });
  }, [currentIndex, items, useCondensedChips]);

  return {
    mode,
    setMode,
    currentIndex,
    useCondensedChips,
    displayedIndices,
  };
}
