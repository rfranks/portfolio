import type { PowerupType } from "@/types/game/objects";
import type { GameState, GameUIState } from "@/app/warbirds/_types";

const cloneWarbirdsActivePowerups = (activePowerups: GameState["activePowerups"]) =>
  Object.fromEntries(
    Object.entries(activePowerups).map(([type, powerup]) => [
      type as PowerupType,
      { expires: powerup.expires },
    ]),
  ) as Record<PowerupType, { expires: number }>;

export const calculateWarbirdsAccuracyPct = (state: GameState): number =>
  state.shotsFired > 0 ? (state.shotsHit / state.shotsFired) * 100 : 0;

export const selectWarbirdsUiSnapshot = (state: GameState): GameUIState => ({
  score: state.score,
  medalCount: state.medalCount,
  duckCount: state.duckCount,
  enemyCount: state.enemyCount,
  ammo: state.ammo,
  crashed: state.crashed,
  activePowerups: cloneWarbirdsActivePowerups(state.activePowerups),
  frameCount: state.frameCount,
  cursor: state.cursor,
  countdown: state.countdown,
  phase: state.phase,
});

export const isWarbirdsUiSnapshotEqual = (prev: GameUIState, next: GameUIState) => {
  if (
    prev.score !== next.score ||
    prev.medalCount !== next.medalCount ||
    prev.duckCount !== next.duckCount ||
    prev.enemyCount !== next.enemyCount ||
    prev.ammo !== next.ammo ||
    prev.crashed !== next.crashed ||
    prev.frameCount !== next.frameCount ||
    prev.cursor !== next.cursor ||
    prev.countdown !== next.countdown ||
    prev.phase !== next.phase
  ) {
    return false;
  }

  const prevPowerupKeys = Object.keys(prev.activePowerups) as PowerupType[];
  const nextPowerupKeys = Object.keys(next.activePowerups) as PowerupType[];
  if (prevPowerupKeys.length !== nextPowerupKeys.length) {
    return false;
  }

  for (const key of prevPowerupKeys) {
    if (prev.activePowerups[key]?.expires !== next.activePowerups[key]?.expires) {
      return false;
    }
  }

  return true;
};
