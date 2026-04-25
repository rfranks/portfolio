import type { MutableRefObject } from "react";
import { ENEMY_HEIGHT, ENEMY_WIDTH, PLANE_HEIGHT, PLANE_WIDTH } from "@/consts/game/vehicles";
import type { AssetMgr } from "@/types/game/ui";
import { PLANE_OFFSET_X } from "../../../_constants";
import type { GameState } from "../../../_types";

function pickExplosionFrame(images: readonly HTMLImageElement[]): HTMLImageElement | undefined {
  if (images.length === 0) {
    return undefined;
  }
  return images[Math.floor(Math.random() * images.length)] ?? images[0];
}

export function runWarbirdsEnemyContactCollisionStage(args: {
  stateRef: MutableRefObject<GameState>;
  getImg: AssetMgr["getImg"];
}): void {
  if (
    args.stateRef.current.isActive("ghost", args.stateRef.current.frameCount) ||
    args.stateRef.current.crashed
  ) {
    return;
  }

  args.stateRef.current.enemies.forEach((enemy) => {
    const planeCenterX = PLANE_OFFSET_X + PLANE_WIDTH / 2;
    const planeCenterY = args.stateRef.current.y + PLANE_HEIGHT / 2;

    if (
      enemy.x < planeCenterX + PLANE_WIDTH / 2 &&
      enemy.x + ENEMY_WIDTH > planeCenterX - PLANE_WIDTH / 2 &&
      enemy.y < planeCenterY + PLANE_HEIGHT / 2 &&
      enemy.y + ENEMY_HEIGHT > planeCenterY - PLANE_HEIGHT / 2
    ) {
      args.stateRef.current.crashed = true;
      args.stateRef.current.groundContactFrames = 0;
      enemy.alive = false;

      const explosionImgs = (
        (args.getImg("explosionImgs") as HTMLImageElement[] | undefined) ?? []
      ).filter(Boolean);
      const enemyExplosion = pickExplosionFrame(explosionImgs);
      const playerExplosion = pickExplosionFrame(explosionImgs);

      if (enemyExplosion) {
        args.stateRef.current.falling.push({
          x: enemy.x,
          y: enemy.y,
          vy: 0,
          img: enemyExplosion,
        });
      }

      if (playerExplosion) {
        args.stateRef.current.falling.push({
          x: PLANE_OFFSET_X,
          y: args.stateRef.current.y,
          vy: 0,
          img: playerExplosion,
        });
      }
    }
  });
}
