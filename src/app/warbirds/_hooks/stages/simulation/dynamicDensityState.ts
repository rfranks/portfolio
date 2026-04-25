import type { MutableRefObject } from "react";
import type { GameState } from "../../../_types";

export function initializeWarbirdsDynamicDensity(
  stateRef: MutableRefObject<GameState>,
  initialEnemyDensity: number,
): void {
  stateRef.current.dynamicDensity = initialEnemyDensity;
}

export function stepWarbirdsDynamicDensity(
  stateRef: MutableRefObject<GameState>,
  enemyDensityStep: number,
): void {
  stateRef.current.dynamicDensity += enemyDensityStep;
}
