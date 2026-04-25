import type { MutableRefObject } from "react";
import type { ScaledTimeoutHandle } from "@/types/hooks/time";
import type { GameState, GamePhase } from "../../../_types";

export function scheduleWarbirdsPhaseSpawner(args: {
  stateRef: MutableRefObject<GameState>;
  phase: GamePhase;
  delayMs: number;
  handleRef: MutableRefObject<ScaledTimeoutHandle | null>;
  simulationRuntime: {
    scheduleSpawner: (params: {
      handleRef: MutableRefObject<ScaledTimeoutHandle | null>;
      shouldContinue: () => boolean;
      getDelayMs: () => number;
      spawn: () => void;
    }) => void;
    clearTimeout: (handleRef: MutableRefObject<ScaledTimeoutHandle | null>) => void;
  };
  spawn: () => void;
}): () => void {
  args.simulationRuntime.scheduleSpawner({
    handleRef: args.handleRef,
    shouldContinue: () => args.stateRef.current.phase === args.phase,
    getDelayMs: () => args.delayMs,
    spawn: args.spawn,
  });

  return () => args.simulationRuntime.clearTimeout(args.handleRef);
}
