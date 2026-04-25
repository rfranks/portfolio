import type { MutableRefObject } from "react";
import { PLANE_HEIGHT } from "@/consts/game/vehicles";
import { SCRAMBLE_INTENSITY } from "@/consts/game/powerups";
import { SMOKE_TRAIL_COUNT } from "../../../_constants";
import type { GameState } from "../../../_types";

export function runWarbirdsPlayerMotionAndGroundStage(args: {
  stateRef: MutableRefObject<GameState>;
  gravity: number;
  groundY: number;
  onAutoFlap: () => void;
  enableAutoFlap: boolean;
}): void {
  args.stateRef.current.vy += args.gravity;
  args.stateRef.current.y += args.stateRef.current.vy;

  if (args.stateRef.current.isActive("turbulence", args.stateRef.current.frameCount)) {
    args.stateRef.current.vy += (Math.random() * 2 - 1) * 0.5;
    args.stateRef.current.y += (Math.random() * 2 - 1) * SCRAMBLE_INTENSITY;
    args.stateRef.current.planeAngle += (Math.random() * 2 - 1) * 0.2;
  }

  if (args.stateRef.current.y + PLANE_HEIGHT >= args.groundY) {
    if (args.enableAutoFlap) {
      args.onAutoFlap();
    } else {
      args.stateRef.current.y = args.groundY - PLANE_HEIGHT;
      if (!args.stateRef.current.crashHandled) {
        args.stateRef.current.groundCrashPuffsLeft = SMOKE_TRAIL_COUNT;
        args.stateRef.current.crashHandled = true;
      }
    }
  }
}
