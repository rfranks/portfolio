import type { MutableRefObject } from "react";
import type { ScaledTimeoutHandle } from "@/types/hooks/time";
import type { GameState } from "../../_types";
import {
  initializeWarbirdsDynamicDensity,
  stepWarbirdsDynamicDensity,
} from "./simulation/dynamicDensityState";
import { scheduleWarbirdsPhaseSpawner } from "./simulation/phaseSpawner";

export function startWarbirdsDynamicDensitySimulationStage(args: {
  stateRef: MutableRefObject<GameState>;
  densityTimeoutRef: MutableRefObject<ScaledTimeoutHandle | null>;
  simulationRuntime: {
    scheduleSpawner: (params: {
      handleRef: MutableRefObject<ScaledTimeoutHandle | null>;
      shouldContinue: () => boolean;
      getDelayMs: () => number;
      spawn: () => void;
    }) => void;
    clearTimeout: (handleRef: MutableRefObject<ScaledTimeoutHandle | null>) => void;
  };
  initialEnemyDensity: number;
  enemyDensityStep: number;
  delayMs: number;
}): () => void {
  initializeWarbirdsDynamicDensity(args.stateRef, args.initialEnemyDensity);

  return scheduleWarbirdsPhaseSpawner({
    stateRef: args.stateRef,
    phase: "playing",
    delayMs: args.delayMs,
    handleRef: args.densityTimeoutRef,
    simulationRuntime: args.simulationRuntime,
    spawn: () => {
      stepWarbirdsDynamicDensity(args.stateRef, args.enemyDensityStep);
    },
  });
}
