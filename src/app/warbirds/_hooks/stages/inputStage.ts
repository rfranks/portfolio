import type { MutableRefObject, RefObject } from "react";
import type * as React from "react";
import {
  SPRAY_COUNT,
  SPRAY_DECREMENTS_AMMO,
  SPRAY_INTERVAL,
  SPRAY_SPREAD,
} from "@/consts/game/powerups";
import { mapClientPointToWorld } from "@/utils/game/engine2d";
import type { AudioMgr } from "@/types/audio/audio";
import type { ClickEvent } from "@/types/game/events";
import type { Dims } from "@/types/game/ui";
import { setScaledTimeout } from "@/hooks/time/useScaledClock";
import { DEFAULT_CURSOR, MAX_AMMO, SCORE_RELOAD, SHOT_CURSOR } from "../../_constants";
import type { GameState, GameUIState } from "../../_types";

export function createWarbirdsInputStage(args: {
  ui: GameUIState;
  stateRef: MutableRefObject<GameState>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  dims: Dims;
  makeText: (
    text: string,
    scale: number,
    fixed: boolean,
    fade: boolean,
    x?: number,
    y?: number,
    maxAge?: number,
  ) => void;
  doSingleShot: (x: number, y: number) => void;
  play: AudioMgr["play"];
  changeScore: (delta: number) => void;
}): {
  handleClick: (event: ClickEvent) => void;
  handleContext: (event: React.MouseEvent) => void;
} {
  const handleClick = (event: ClickEvent) => {
    if (args.ui.phase !== "playing" || args.ui.crashed || args.ui.ammo <= 0) {
      if (args.stateRef.current.ammo <= 1) {
        for (let index = 0; index < 3; index += 1) {
          setScaledTimeout(
            () => args.makeText("RELOAD", 2, true, true, 100, args.dims.height / 2, 30),
            index * 200,
          );
        }
      }
      return;
    }

    const sprayActive = args.stateRef.current.isActive("spray", args.stateRef.current.frameCount);
    const decrement = sprayActive
      ? Math.min(SPRAY_DECREMENTS_AMMO ? SPRAY_COUNT : 1, args.stateRef.current.ammo)
      : 1;
    args.stateRef.current.ammo = args.stateRef.current.isActive(
      "infiniteAmmo",
      args.stateRef.current.frameCount,
    )
      ? args.stateRef.current.ammo
      : Math.max(0, args.stateRef.current.ammo - decrement);

    const blindfoldActive = args.stateRef.current.isActive(
      "blindfold",
      args.stateRef.current.frameCount,
    );
    if (!blindfoldActive) {
      args.stateRef.current.cursor = SHOT_CURSOR;
      setScaledTimeout(() => {
        if (!args.stateRef.current.isActive("blindfold", args.stateRef.current.frameCount)) {
          args.stateRef.current.cursor = DEFAULT_CURSOR;
        }
      }, 100);
    }

    const bounds = args.canvasRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    const worldPoint = mapClientPointToWorld({
      clientX: event.clientX,
      clientY: event.clientY,
      bounds,
      worldWidth: args.dims.width,
      worldHeight: args.dims.height,
    });

    if (sprayActive) {
      for (let index = 0; index < SPRAY_COUNT; index += 1) {
        const dx = (Math.random() * 2 - 1) * SPRAY_SPREAD;
        const dy = (Math.random() * 2 - 1) * SPRAY_SPREAD;
        setScaledTimeout(
          () => args.doSingleShot(worldPoint.x + dx, worldPoint.y + dy),
          index * SPRAY_INTERVAL,
        );
      }
      return;
    }

    args.doSingleShot(worldPoint.x, worldPoint.y);
  };

  const handleContext = (event: React.MouseEvent) => {
    event.preventDefault();
    if (
      args.stateRef.current.phase !== "playing" ||
      args.stateRef.current.crashed ||
      args.stateRef.current.ammo >= MAX_AMMO
    ) {
      return;
    }

    args.play("reloadSfx");
    args.changeScore(SCORE_RELOAD);
    args.stateRef.current.ammo = MAX_AMMO;
    args.stateRef.current.floatingScores.push({
      x: Math.random() * args.dims.width,
      y: Math.random() * args.dims.height,
      vy: -1,
      amount: SCORE_RELOAD,
      age: 0,
      maxAge: 60,
    });
  };

  return {
    handleClick,
    handleContext,
  };
}
