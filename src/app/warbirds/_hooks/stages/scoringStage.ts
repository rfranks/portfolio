import type { MutableRefObject } from "react";
import type { AudioMgr } from "@/types/audio/audio";
import { PLANE_HEIGHT, PLANE_WIDTH } from "@/consts/game/vehicles";
import type { GameState } from "../../_types";
import { PLANE_OFFSET_X } from "../../_constants";

export function applyWarbirdsScoreDelta(
  stateRef: MutableRefObject<GameState>,
  delta: number,
): void {
  const doubleScore = stateRef.current.isActive("coin2x", stateRef.current.frameCount) && delta > 0;
  const finalDelta = doubleScore ? delta * 2 : delta;
  stateRef.current.score += Math.max(finalDelta, 0);
}

export function runWarbirdsMedalAutoCollectStage(args: {
  stateRef: MutableRefObject<GameState>;
  play: AudioMgr["play"];
  changeScore: (delta: number) => void;
  medalSize: number;
  medalScore: number;
}): { x: number; y: number } {
  const planeX = PLANE_OFFSET_X;
  const planeY = args.stateRef.current.y;
  const planeW = PLANE_WIDTH;
  const planeH = PLANE_HEIGHT;

  const planeCenter = {
    x: PLANE_OFFSET_X + PLANE_WIDTH / 2,
    y: args.stateRef.current.y + PLANE_HEIGHT / 2,
  };

  for (let index = args.stateRef.current.medals.length - 1; index >= 0; index -= 1) {
    const medal = args.stateRef.current.medals[index];
    if (
      medal.x < planeX + planeW &&
      medal.x + args.medalSize > planeX &&
      medal.y < planeY + planeH &&
      medal.y + args.medalSize > planeY
    ) {
      args.play("medalSfx");
      args.changeScore(args.medalScore);
      args.stateRef.current.floatingScores.push({
        x: medal.x + args.medalSize / 2,
        y: medal.y + args.medalSize / 2,
        vy: -1,
        amount: args.medalScore,
        age: 0,
        maxAge: 60,
      });
      args.stateRef.current.medals.splice(index, 1);
      args.stateRef.current.medalCount += 1;
    }
  }

  return planeCenter;
}
