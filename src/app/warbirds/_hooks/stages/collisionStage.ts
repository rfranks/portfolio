import type { MutableRefObject } from "react";
import type { AudioMgr } from "@/types/audio/audio";
import type { AssetMgr } from "@/types/game/ui";
import type { GameState } from "../../_types";
import { runWarbirdsCrashResolutionStage } from "./collision/crashResolutionStage";
import { runWarbirdsEnemyContactCollisionStage } from "./collision/enemyContactStage";
import { runWarbirdsPlayerMotionAndGroundStage } from "./collision/playerMotionStage";

export function runWarbirdsPlayerCollisionStage(args: {
  stateRef: MutableRefObject<GameState>;
  gravity: number;
  groundY: number;
  play: AudioMgr["play"];
  pause: AudioMgr["pause"];
  getImg: AssetMgr["getImg"];
  onAutoFlap: () => void;
  debugPlayerCrash: boolean;
  enableAutoFlap: boolean;
}): void {
  if (args.stateRef.current.crashed) {
    return;
  }

  runWarbirdsPlayerMotionAndGroundStage({
    stateRef: args.stateRef,
    gravity: args.gravity,
    groundY: args.groundY,
    onAutoFlap: args.onAutoFlap,
    enableAutoFlap: args.enableAutoFlap,
  });

  runWarbirdsEnemyContactCollisionStage({
    stateRef: args.stateRef,
    getImg: args.getImg,
  });

  runWarbirdsCrashResolutionStage({
    stateRef: args.stateRef,
    play: args.play,
    pause: args.pause,
    debugPlayerCrash: args.debugPlayerCrash,
  });
}
