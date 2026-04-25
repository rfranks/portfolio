"use client";

import * as React from "react";

export type ModalTransitionPhase = "closed" | "open" | "closing";

type ModalTransitionEvent =
  | { type: "OPEN_REQUESTED" }
  | { type: "CLOSE_REQUESTED" }
  | { type: "EXIT_ANIMATION_COMPLETE" };

type UseModalTransitionMachineOptions = {
  enabled?: boolean;
  exitAnimationMs?: number;
  initialOpen?: boolean;
};

const DEFAULT_EXIT_ANIMATION_MS = 280;

const modalTransitionReducer = (
  phase: ModalTransitionPhase,
  event: ModalTransitionEvent,
): ModalTransitionPhase => {
  switch (event.type) {
    case "OPEN_REQUESTED":
      return "open";
    case "CLOSE_REQUESTED":
      return phase === "closed" ? "closed" : "closing";
    case "EXIT_ANIMATION_COMPLETE":
      return phase === "closing" ? "closed" : phase;
    default:
      return phase;
  }
};

export function useModalTransitionMachine({
  enabled = true,
  exitAnimationMs = DEFAULT_EXIT_ANIMATION_MS,
  initialOpen = false,
}: UseModalTransitionMachineOptions = {}) {
  const [phase, dispatch] = React.useReducer(
    modalTransitionReducer,
    initialOpen && enabled ? "open" : "closed",
  );

  React.useEffect(() => {
    if (enabled) {
      return;
    }
    dispatch({ type: "CLOSE_REQUESTED" });
  }, [enabled]);

  React.useEffect(() => {
    if (phase !== "closing") {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "EXIT_ANIMATION_COMPLETE" });
    }, exitAnimationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [exitAnimationMs, phase]);

  const open = React.useCallback(() => {
    if (!enabled) {
      return;
    }
    dispatch({ type: "OPEN_REQUESTED" });
  }, [enabled]);

  const close = React.useCallback(() => {
    dispatch({ type: "CLOSE_REQUESTED" });
  }, []);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        if (!enabled) {
          return;
        }
        dispatch({ type: "OPEN_REQUESTED" });
        return;
      }
      dispatch({ type: "CLOSE_REQUESTED" });
    },
    [enabled],
  );

  return React.useMemo(
    () => ({
      close,
      isClosing: phase === "closing",
      isOpen: phase === "open",
      isVisible: phase !== "closed",
      open,
      phase,
      setOpen,
    }),
    [close, open, phase, setOpen],
  );
}
