"use client";

import { useModalTransitionMachine } from "./useModalTransitionMachine";

type UseBlackjackModalTransitionsOptions = {
  exitAnimationMs?: number;
  hasEngineState: boolean;
  hasHintText: boolean;
  hasRoundTimelineEntries: boolean;
};

export function useBlackjackModalTransitions({
  exitAnimationMs,
  hasEngineState,
  hasHintText,
  hasRoundTimelineEntries,
}: UseBlackjackModalTransitionsOptions) {
  const domAvailable = typeof document !== "undefined";

  const hintModal = useModalTransitionMachine({
    enabled: hasHintText,
    exitAnimationMs,
  });
  const roundDetailsModal = useModalTransitionMachine({
    enabled: hasRoundTimelineEntries,
    exitAnimationMs,
  });
  const analyticsModal = useModalTransitionMachine({ exitAnimationMs });
  const gameModeModal = useModalTransitionMachine({
    enabled: hasEngineState,
    exitAnimationMs,
  });
  const settingsModal = useModalTransitionMachine({ exitAnimationMs });

  return {
    analyticsModal: {
      ...analyticsModal,
      shouldRender: domAvailable && analyticsModal.isVisible,
    },
    gameModeModal: {
      ...gameModeModal,
      shouldRender: domAvailable && hasEngineState && gameModeModal.isVisible,
    },
    hintModal: {
      ...hintModal,
      shouldRender: domAvailable && hasHintText && hintModal.isVisible,
    },
    roundDetailsModal: {
      ...roundDetailsModal,
      shouldRender: domAvailable && hasRoundTimelineEntries && roundDetailsModal.isVisible,
    },
    settingsModal: {
      ...settingsModal,
      shouldRender: domAvailable && settingsModal.isVisible,
    },
  };
}
