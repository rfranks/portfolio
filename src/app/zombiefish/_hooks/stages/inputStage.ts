import type { MutableRefObject, RefObject } from "react";
import type * as React from "react";
import type { AudioMgr } from "@/types/audio/audio";
import type { ClickEvent } from "@/types/game/events";
import type { ScaledTimeoutHandle } from "@/types/hooks/time";
import {
  findTopmostHitIndex,
  mapClientPointToWorld,
  pointInCircle,
  pointInRect,
} from "@/utils/game/engine2d";
import type { Bubble, Fish, GameState } from "../../_types";
import {
  DEFAULT_CURSOR,
  MAX_SKELETONS,
  SHOT_CURSOR,
  TARGET_CURSOR,
  TIME_BONUS_BROWN_FISH,
  TIME_BONUS_GREY_LONG,
} from "../../_constants";
import { FISH_SIZE, HURT_DURATION_MS } from "../../_utils/gameConfig";
import type { TextLabel } from "@/types/game/ui";

type ZombiefishInputStageArgs = {
  stateRef: MutableRefObject<GameState>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  inactiveFishRef: MutableRefObject<Fish[]>;
  inactiveBubblesRef: MutableRefObject<Bubble[]>;
  cursorTimeoutRef: MutableRefObject<ScaledTimeoutHandle | null>;
  timeTextBoundsRef: MutableRefObject<{ x: number; y: number; width: number; height: number }>;
  simulationRuntime: {
    scheduleTimeout: (params: {
      handleRef: MutableRefObject<ScaledTimeoutHandle | null>;
      callback: () => void;
      delayMs: number;
    }) => void;
  };
  audio: Pick<AudioMgr, "play">;
  syncCursor: (cursor: string) => void;
  syncUiFromState: () => void;
  updateDigitLabel: (label: TextLabel | null, value: number, pad?: number, suffix?: string) => void;
  updateScoreLabel: (label: TextLabel | null, value: number) => void;
  timerLabelRef: MutableRefObject<TextLabel | null>;
  scoreLabelRef: MutableRefObject<TextLabel | null>;
  makeText: (text: string, x: number, y: number, color?: string) => void;
  resetGame: () => void;
  startSplash: () => void;
};

export function createZombiefishInputStage(args: ZombiefishInputStageArgs): {
  handleMouseMove: (event: React.MouseEvent) => void;
  handleClick: (event: ClickEvent) => void;
  handleContext: (event: React.MouseEvent) => void;
} {
  const handleMouseMove = (event: React.MouseEvent) => {
    const cur = args.stateRef.current;
    if (cur.phase !== "playing" || cur.cursor === SHOT_CURSOR) return;

    const canvas = args.canvasRef.current;
    if (!canvas) return;
    const { x, y } = mapClientPointToWorld({
      clientX: event.clientX,
      clientY: event.clientY,
      bounds: canvas.getBoundingClientRect(),
      worldWidth: cur.dims.width,
      worldHeight: cur.dims.height,
    });

    const hovering = cur.fish.some((fish) =>
      pointInRect({ x, y }, { x: fish.x, y: fish.y, width: FISH_SIZE, height: FISH_SIZE }),
    );

    const nextCursor = hovering ? TARGET_CURSOR : DEFAULT_CURSOR;
    if (nextCursor !== cur.cursor) {
      args.syncCursor(nextCursor);
    }
  };

  const handleClick = (event: ClickEvent) => {
    event.preventDefault?.();
    const cur = args.stateRef.current;
    if (cur.phase === "gameover") {
      args.resetGame();
      args.startSplash();
      return;
    }

    const canvas = args.canvasRef.current;
    if (!canvas) {
      args.syncUiFromState();
      return;
    }
    const clickPoint = mapClientPointToWorld({
      clientX: event.clientX,
      clientY: event.clientY,
      bounds: canvas.getBoundingClientRect(),
      worldWidth: cur.dims.width,
      worldHeight: cur.dims.height,
    });
    const { x: canvasX, y: canvasY } = clickPoint;

    const bounds = args.timeTextBoundsRef.current;
    if (
      pointInRect(clickPoint, {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      })
    ) {
      if (cur.phase === "playing" || cur.phase === "paused") {
        cur.phase = cur.phase === "playing" ? "paused" : "playing";
        args.syncUiFromState();
      }
      return;
    }

    if (cur.phase !== "playing") return;

    args.syncCursor(SHOT_CURSOR);
    args.simulationRuntime.scheduleTimeout({
      handleRef: args.cursorTimeoutRef,
      callback: () => {
        args.syncCursor(DEFAULT_CURSOR);
      },
      delayMs: 100,
    });

    cur.shots += 1;
    args.audio.play("shoot");

    const bubbleHitIndex = findTopmostHitIndex(cur.bubbles, (bubble) =>
      pointInCircle(clickPoint, {
        x: bubble.x + bubble.size / 2,
        y: bubble.y + bubble.size / 2,
        radius: bubble.size / 2,
      }),
    );
    if (bubbleHitIndex >= 0) {
      const [removedBubble] = cur.bubbles.splice(bubbleHitIndex, 1);
      if (removedBubble) args.inactiveBubblesRef.current.push(removedBubble);
      args.audio.play("pop");
      cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;
      args.syncUiFromState();
      return;
    }

    let hit = false;
    const fishHitIndex = findTopmostHitIndex(cur.fish, (fish) =>
      pointInRect(clickPoint, { x: fish.x, y: fish.y, width: FISH_SIZE, height: FISH_SIZE }),
    );
    if (fishHitIndex >= 0) {
      const fish = cur.fish[fishHitIndex];
      cur.hits += 1;
      cur.hitCounts[fish.kind] = (cur.hitCounts[fish.kind] || 0) + 1;
      args.audio.play("hit");
      hit = true;
      const scoreMap: Record<string, number> = {
        brown: 50,
        grey_long_a: 5,
        grey_long_b: 5,
      };
      const base = fish.isSkeleton ? 20 : (scoreMap[fish.kind] ?? 10);
      const gain = base + cur.conversions;
      cur.score += gain;
      args.updateScoreLabel(args.scoreLabelRef.current, cur.score);
      if (fish.kind === "brown") {
        cur.timer += TIME_BONUS_BROWN_FISH;
        args.updateDigitLabel(args.timerLabelRef.current, cur.timer, 2);
        args.makeText(`+${TIME_BONUS_BROWN_FISH}`, fish.x, fish.y, "#0f0");
        const [removed] = cur.fish.splice(fishHitIndex, 1);
        if (removed) args.inactiveFishRef.current.push(removed);
        args.audio.play("bonus");
      } else if (fish.kind === "grey_long_a" || fish.kind === "grey_long_b") {
        cur.timer += TIME_BONUS_GREY_LONG;
        args.updateDigitLabel(args.timerLabelRef.current, cur.timer, 2);
        args.makeText(`+${TIME_BONUS_GREY_LONG}`, fish.x, fish.y, "#f00");
        const pairId = fish.pairId;
        if (pairId !== undefined) {
          const removed = cur.fish.filter((candidate) => candidate.pairId === pairId);
          cur.fish = cur.fish.filter((candidate) => candidate.pairId !== pairId);
          args.inactiveFishRef.current.push(...removed);
        } else {
          const [removed] = cur.fish.splice(fishHitIndex, 1);
          if (removed) args.inactiveFishRef.current.push(removed);
        }
        args.audio.play("bonus");
      } else {
        const skeletonCount = cur.fish.filter(
          (candidate) => candidate.isSkeleton || candidate.pendingSkeleton,
        ).length;
        if (!fish.isSkeleton) {
          if (Math.random() < 0.5 && skeletonCount < MAX_SKELETONS) {
            fish.isSkeleton = true;
            fish.health = 1;
            fish.hurtTimer = 0;
            fish.frame = 0;
            fish.frameCounter = 0;
            delete fish.groupId;
            args.audio.play("skeleton");
          } else {
            const [removed] = cur.fish.splice(fishHitIndex, 1);
            if (removed) args.inactiveFishRef.current.push(removed);
            args.audio.play("death");
          }
        } else {
          fish.health -= 1;
          if (fish.health > 0) {
            fish.hurtTimer = HURT_DURATION_MS;
            args.audio.play("skeleton");
          } else {
            const [removed] = cur.fish.splice(fishHitIndex, 1);
            if (removed) args.inactiveFishRef.current.push(removed);
            args.audio.play("death");
          }
        }
      }
    }

    if (!hit) {
      cur.missParticles.push({
        x: canvasX,
        y: canvasY,
        radius: 0,
        alpha: 1,
      });
    }

    cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;
    args.syncUiFromState();
  };

  const handleContext = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return {
    handleMouseMove,
    handleClick,
    handleContext,
  };
}
