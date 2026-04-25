import type { MutableRefObject } from "react";
import type { ScaledTimeoutHandle } from "@/types/hooks/time";
import type { GameState } from "../../_types";
import { FISH_SPAWN_INTERVAL_MAX, FISH_SPAWN_INTERVAL_MIN } from "../../_constants";
import { FRAME_MS, GAME_TIME } from "../../_utils/gameConfig";
import { pickRandom, randomInRange } from "@/utils/game/engine2d";

export function startZombiefishSpawnSimulationStage(args: {
  stateRef: MutableRefObject<GameState>;
  fishSpawnTimeoutRef: MutableRefObject<ScaledTimeoutHandle | null>;
  simulationRuntime: {
    scheduleSpawner: (params: {
      handleRef: MutableRefObject<ScaledTimeoutHandle | null>;
      shouldContinue: () => boolean;
      getDelayMs: () => number;
      spawn: () => void;
    }) => void;
    clearTimeout: (handleRef: MutableRefObject<ScaledTimeoutHandle | null>) => void;
  };
  spawnFish: (kind: string, count: number) => void;
}): () => void {
  const basicKinds = ["blue", "green", "orange", "pink", "red"];

  args.simulationRuntime.scheduleSpawner({
    handleRef: args.fishSpawnTimeoutRef,
    shouldContinue: () => args.stateRef.current.phase === "playing",
    getDelayMs: () => {
      const { timer, conversions } = args.stateRef.current;
      const difficultyFactor = 1 + (1 - timer / GAME_TIME) + conversions * 0.1;
      const min = FISH_SPAWN_INTERVAL_MIN * FRAME_MS;
      const max = FISH_SPAWN_INTERVAL_MAX * FRAME_MS;
      const baseDelay = randomInRange(min, max);
      return Math.max(baseDelay / difficultyFactor, 250);
    },
    spawn: () => {
      const kind = pickRandom(basicKinds) ?? "blue";
      const count = Math.floor(Math.random() * 5) + 1;
      args.spawnFish(kind, count);

      const roll = Math.random();
      if (roll < 0.1) {
        args.spawnFish("brown", 1);
      } else if (roll < 0.15) {
        args.spawnFish("grey_long", 1);
      }
    },
  });

  return () => {
    args.simulationRuntime.clearTimeout(args.fishSpawnTimeoutRef);
  };
}
