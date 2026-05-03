import type { GameState, GameUIState } from "@/app/zombiefish/_types";

export const selectZombiefishUiSnapshot = (state: GameState): GameUIState => ({
  phase: state.phase,
  timer: state.timer,
  shots: state.shots,
  hits: state.hits,
  score: state.score,
  accuracy: state.accuracy,
  cursor: state.cursor,
});

export const isZombiefishUiSnapshotEqual = (prev: GameUIState, next: GameUIState) =>
  prev.phase === next.phase &&
  prev.timer === next.timer &&
  prev.shots === next.shots &&
  prev.hits === next.hits &&
  prev.score === next.score &&
  prev.accuracy === next.accuracy &&
  prev.cursor === next.cursor;
