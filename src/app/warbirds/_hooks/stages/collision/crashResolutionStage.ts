import type { MutableRefObject } from "react";
import type { AudioMgr } from "@/types/audio/audio";
import type { PowerupType } from "@/types/game/objects";
import type { GameState } from "../../../_types";

export function runWarbirdsCrashResolutionStage(args: {
  stateRef: MutableRefObject<GameState>;
  play: AudioMgr["play"];
  pause: AudioMgr["pause"];
  debugPlayerCrash: boolean;
}): void {
  if (
    !args.stateRef.current.crashed ||
    args.debugPlayerCrash ||
    args.stateRef.current.isActive("ghost", args.stateRef.current.frameCount)
  ) {
    return;
  }

  if (
    args.stateRef.current.isActive("shield", args.stateRef.current.frameCount) ||
    args.stateRef.current.isActive("supershield", args.stateRef.current.frameCount)
  ) {
    if (args.stateRef.current.isActive("shield", args.stateRef.current.frameCount)) {
      args.stateRef.current.activePowerups.shield.expires = 0;
    }
    args.stateRef.current.shieldFlash = 10;
    args.stateRef.current.crashed = false;
    args.play("shieldSfx");
    return;
  }

  args.stateRef.current.crashed = true;
  Object.keys(args.stateRef.current.activePowerups).forEach((key) => {
    args.stateRef.current.activePowerups[key as PowerupType].expires = 0;
  });
  args.play("crashSfx");
  args.pause("flightSfx");
}
