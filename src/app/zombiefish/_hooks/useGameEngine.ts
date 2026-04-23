import { useRef, useState, useEffect, useCallback } from "react";
import { useWindowSize } from "@/hooks/window/useWindowSize";
import useScaledClock, {
  clockRef,
  setScaledTimeout,
  clearScaledTimeout,
  advanceClock,
} from "@/hooks/time/useScaledClock";
import { BASE_DIMS } from "@/consts/game/dimensions";
import { useGameAssets } from "./useGameAssets";
import { useGameAudio } from "./useGameAudio";
import { drawTextLabels, newTextLabel } from "@/utils/game/ui";
import {
  cancelAnimationFrameRef,
  clearManagedTimeout,
  findTopmostHitIndex,
  mapClientPointToWorld,
  pickRandom,
  pointInCircle,
  pointInRect,
  randomInRange,
  scheduleManagedSpawner,
  scheduleManagedTimeout,
  startManagedAnimationLoop,
} from "@/utils/game/engine2d";
import { drawRandomTerrainBackground } from "../_drawRandomTerrainBackground";

import type { GameState, GameUIState, Fish, Bubble, MissParticle } from "../_types";
import {
  FISH_SPEED_MIN,
  FISH_SPEED_MAX,
  FISH_SPAWN_INTERVAL_MIN,
  FISH_SPAWN_INTERVAL_MAX,
  SKELETON_SPEED,
  MAX_SKELETONS,
  MAX_FISH,
  MAX_SPECIAL_FISH,
  TIME_BONUS_BROWN_FISH,
  TIME_BONUS_GREY_LONG,
  DEFAULT_CURSOR,
  SHOT_CURSOR,
  TARGET_CURSOR,
  DEBUG_FPS_SCALE,
} from "../_constants";
import type { AssetMgr } from "@/types/game/ui";
import type { TextLabel } from "@/types/game/ui";
import type { AudioMgr } from "@/types/audio/audio";
import type { ClickEvent } from "@/types/game/events";
import { ScaledTimeoutHandle } from "@/types/hooks/time";

/* eslint-disable react-hooks/exhaustive-deps */

// Initial timer value (in seconds)
const GAME_TIME = 99;
const FPS = 60; // assumed frame rate for requestAnimationFrame
const FRAME_MS = 1000 / FPS;

const FISH_SIZE = 128;
const FISH_FRAME_DELAY = 6;
const FISH_FRAME_DURATION = FISH_FRAME_DELAY * FRAME_MS;
const MAX_SCHOOL_SIZE = 4;

// NES-style jingle sequence for background music
// Build a rising and falling "wave" pattern to feel bubbly and underwater.
// We step up in thirds, crest, then wash back down and repeat.
const NES_BGM_SEQUENCE = (() => {
  const rise = [0, 3, 6, 9].map((n) => `jingles_NES${n.toString().padStart(2, "0")}`);
  const fall = [...rise].reverse();
  const loop: string[] = [];
  for (let i = 0; i < 2; i++) {
    loop.push(...rise, "jingles_NES12", ...fall, "jingles_NES14");
  }
  return loop;
})();
// limit for how steep fish swim (cross-velocity relative to main)
const MAX_FISH_INCLINE = 0.5;
const SKELETON_CONVERT_DISTANCE = FISH_SIZE / 2;
const SKELETON_REPEL_DISTANCE = FISH_SIZE;
const SKELETON_REPEL_FORCE = 0.05;
const SKELETON_DETECTION_RADIUS = FISH_SIZE * 8;
const BUBBLE_BASE_SIZE = 64;
const BUBBLE_MIN = BUBBLE_BASE_SIZE * 0.5;
const BUBBLE_MAX = BUBBLE_BASE_SIZE * 1.5;
const BUBBLE_VX_MAX = 0.5;
const BUBBLE_VY_MIN = -1.5;
const BUBBLE_VY_MAX = -0.5;
const MAX_BUBBLES = 20;
const HURT_FRAMES = 10;
const CONVERT_FLASH_FRAMES = 5;
const MISS_GROWTH = 4;
const MISS_FADE = 0.05;

const WANDER_TIMER_MIN_MS = 1000;
const WANDER_TIMER_MAX_MS = 2000;
const HURT_DURATION_MS = HURT_FRAMES * FRAME_MS;
const CONVERT_FLASH_DURATION_MS = CONVERT_FLASH_FRAMES * FRAME_MS;

const STAT_LABEL_PY = 8;

const clampIncline = (vx: number, vy: number) => {
  if (Math.abs(vx) >= Math.abs(vy)) {
    const limit = Math.abs(vx) * MAX_FISH_INCLINE;
    return { vx, vy: Math.max(Math.min(vy, limit), -limit) };
  }
  const limit = Math.abs(vy) * MAX_FISH_INCLINE;
  return { vx: Math.max(Math.min(vx, limit), -limit), vy };
};

const orientFish = (vx: number, vy: number) => {
  let angle = Math.atan2(vy, vx);
  let flipped = false;
  if (angle > Math.PI / 2) {
    angle = Math.PI - angle;
    flipped = true;
  } else if (angle < -Math.PI / 2) {
    angle = -Math.PI - angle;
    flipped = true;
  }
  return { angle, flipped };
};

export default function useGameEngine() {
  // canvas and animation frame refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // assets
  const assetMgr = useGameAssets();
  const { getImg, ready } = assetMgr;
  const audio: AudioMgr = useGameAudio();

  // window dimensions
  const screenDims = useWindowSize();
  const dims = BASE_DIMS;

  // main game state stored in a ref so we can mutate without re-render
  const state = useRef<GameState>({
    phase: "title",
    timer: GAME_TIME,
    shots: 0,
    hits: 0,
    score: 0,
    accuracy: 0,
    cursor: DEFAULT_CURSOR,
    dims,
    fish: [],
    bubbles: [],
    textLabels: [],
    missParticles: [],
    conversions: 0,
    hitCounts: {},
    warningPlayed: false,
  });

  const nextFishId = useRef(1);
  const nextGroupId = useRef(1);
  const nextPairId = useRef(1);
  const nextBubbleId = useRef(1);
  const groupVelocityRef = useRef<Record<number, { vx: number; vy: number }>>({});
  const inactiveFish = useRef<Fish[]>([]);
  const inactiveBubbles = useRef<Bubble[]>([]);
  const bubbleSpawnRef = useRef(0);
  const cursorTimeoutRef = useRef<ScaledTimeoutHandle | null>(null);
  const frameRef = useRef(0); // track milliseconds for one-second ticks
  const fishSpawnTimeout = useRef<ScaledTimeoutHandle | null>(null);
  const reportIntervalMs = 500;
  useScaledClock();
  const backgroundSeed = useRef(Math.random() * 1000);
  const backgroundCanvas = useRef<HTMLCanvasElement | null>(null);
  const accuracyLabel = useRef<TextLabel | null>(null);
  const accuracyStatLabel = useRef<TextLabel | null>(null);
  const finalAccuracy = useRef(0);
  const displayAccuracy = useRef(0);
  const updateBestAccuracy = (score: number) => {
    const best = Number(localStorage.getItem("bestAccuracy") || 0);
    if (score > best) {
      localStorage.setItem("bestAccuracy", score.toString());
    }
  };
  const bestAccuracyLabel = useRef<TextLabel | null>(null);
  const timerLabel = useRef<TextLabel | null>(null);
  const scoreLabel = useRef<TextLabel | null>(null);
  const pausedLabel = useRef<TextLabel | null>(null);
  const gameoverShotsLabel = useRef<TextLabel | null>(null);
  const gameoverHitsLabel = useRef<TextLabel | null>(null);
  const gameoverTimeLabel = useRef<TextLabel | null>(null);
  const gameoverScoreLabel = useRef<TextLabel | null>(null);
  const timeTextBounds = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // ui state that triggers re-renders
  const [ui, setUI] = useState<GameUIState>({
    phase: "title",
    timer: GAME_TIME,
    shots: 0,
    hits: 0,
    score: 0,
    accuracy: 0,
    cursor: DEFAULT_CURSOR,
  });

  useEffect(() => {
    if (!DEBUG_FPS_SCALE) return;
    const id = setInterval(() => {
      const { deltaMs, scale } = clockRef.current;
      const fps = 1000 / deltaMs;
      console.debug(`[zombiefish] fps: ${fps.toFixed(1)} scale: ${scale.toFixed(2)}`);
    }, reportIntervalMs);
    return () => clearInterval(id);
  }, [reportIntervalMs]);

  // sync base dims once and resize canvas on window changes
  useEffect(() => {
    state.current.dims = dims;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width: screenW, height: screenH } = screenDims;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const scaleX = screenW / dims.width;
    const scaleY = screenH / dims.height;
    canvas.width = screenW * dpr;
    canvas.height = screenH * dpr;
    canvas.style.width = `${screenW}px`;
    canvas.style.height = `${screenH}px`;
    ctx.setTransform(scaleX * dpr, 0, 0, scaleY * dpr, 0, 0);
  }, [screenDims, dims]);

  const syncCursor = useCallback((cursor: string) => {
    state.current.cursor = cursor;
    setUI({
      phase: state.current.phase,
      timer: state.current.timer,
      shots: state.current.shots,
      hits: state.current.hits,
      score: state.current.score,
      accuracy: state.current.accuracy,
      cursor,
    });
  }, []);

  const makeText = useCallback(
    (text: string, x: number, y: number, color?: string) => {
      const lbl = newTextLabel(
        {
          text,
          scale: 1,
          fixed: true,
          fade: true,
          x,
          y,
          vy: -0.5,
          ...(color ? { color } : {}),
        },
        { getImg } as unknown as AssetMgr,
        state.current.dims,
      );
      state.current.textLabels.push(lbl);
    },
    [getImg],
  );

  const regenerateBackground = useCallback(() => {
    const { width, height } = state.current.dims;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const bgCtx = canvas.getContext("2d");
    if (bgCtx) {
      drawRandomTerrainBackground(bgCtx, getImg, width, height, backgroundSeed.current);
    }
    backgroundCanvas.current = canvas;
  }, [getImg]);

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const { width, height } = state.current.dims;
      const canvas = backgroundCanvas.current;
      if (!canvas || canvas.width !== width || canvas.height !== height) {
        regenerateBackground();
      }
      if (backgroundCanvas.current) {
        ctx.drawImage(backgroundCanvas.current, 0, 0);
      }
    },
    [regenerateBackground],
  );

  const updateDigitLabel = useCallback(
    (label: TextLabel | null, value: number, pad = 0, suffix = "") => {
      if (!label) return;
      const str = (pad > 0 ? value.toString().padStart(pad, "0") : value.toString()) + suffix;
      const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
      label.text = str;
      label.imgs = str.split("").map((ch) => digitImgs[ch]);
    },
    [getImg],
  );

  const updateScoreLabel = useCallback(
    (label: TextLabel | null, value: number) => {
      updateDigitLabel(label, value);
      if (!label) return;
      const width = label.imgs.reduce((w, img) => w + (img?.width || 0) * label.scale + 2, 0);
      const height = label.imgs.reduce(
        (h, img) => Math.max(h, (img?.height || 0) * label.scale),
        0,
      );
      label.x = dims.width - width - 16;
      label.y = dims.height - height - 16;
    },
    [updateDigitLabel, dims],
  );

  useEffect(() => {
    updateScoreLabel(scoreLabel.current, state.current.score);
  }, [updateScoreLabel]);

  const updateFish = useCallback(
    (deltaMs: number, scale: number) => {
      const cur = state.current;
      const { width, height } = cur.dims;

      // handle conversion flashes
      const flashImg = getImg("fishFlashImg") as HTMLImageElement | undefined;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      cur.fish.forEach((f) => {
        const frameMap = getImg(f.isSkeleton ? "skeletonFrames" : "fishFrames") as Record<
          string,
          HTMLImageElement[]
        >;
        const frames = frameMap[f.kind as keyof typeof frameMap];
        if (frames && frames.length > 0) {
          f.frameCounter += deltaMs;
          if (f.frameCounter >= FISH_FRAME_DURATION) {
            f.frameCounter = 0;
            f.frame = (f.frame + 1) % frames.length;
          }
        }

        if (f.pendingSkeleton) {
          if (ctx && flashImg) {
            ctx.drawImage(flashImg, f.x, f.y, FISH_SIZE, FISH_SIZE);
          }
          f.flashTimer = (f.flashTimer || 0) - deltaMs;
          if (f.flashTimer <= 0) {
            f.isSkeleton = true;
            f.health = 2;
            f.hurtTimer = 0;
            f.pendingSkeleton = undefined;
            f.flashTimer = undefined;
          }
        }
      });

      // For each group, compute the average velocity and apply it to members.
      const groups: Record<number, { vx: number; vy: number; members: Fish[] }> = {};
      cur.fish.forEach((f) => {
        if (f.groupId === undefined) return;
        const g = (groups[f.groupId] ||= { vx: 0, vy: 0, members: [] });
        g.vx += f.vx;
        g.vy += f.vy;
        g.members.push(f);
      });
      const prevGroupVel = groupVelocityRef.current;
      Object.entries(groups).forEach(([idStr, g]) => {
        const id = Number(idStr);
        const avgVx = g.vx / g.members.length;
        const avgVy = g.vy / g.members.length;
        const limited = clampIncline(avgVx, avgVy);
        const prev = prevGroupVel[id];
        const angleChanged =
          prev &&
          Math.abs(
            Math.atan2(
              limited.vx * prev.vy - limited.vy * prev.vx,
              limited.vx * prev.vx + limited.vy * prev.vy,
            ),
          ) > 0.2;
        g.members.forEach((f) => {
          f.vx = limited.vx;
          f.vy = limited.vy;
          if (angleChanged) {
            f.wanderTimer =
              Math.random() * (WANDER_TIMER_MAX_MS - WANDER_TIMER_MIN_MS) + WANDER_TIMER_MIN_MS;
          }
        });
        prevGroupVel[id] = { vx: limited.vx, vy: limited.vy };
      });
      // Remove velocities for groups that no longer exist.
      Object.keys(prevGroupVel).forEach((idStr) => {
        const id = Number(idStr);
        if (!groups[id]) delete prevGroupVel[id];
      });

      // Keep multi-segment fish aligned. For each pairId, ensure the "b" segment
      // trails the "a" segment at roughly one FISH_SIZE distance.
      const pairs: Record<number, { a?: Fish; b?: Fish }> = {};
      cur.fish.forEach((f) => {
        if (f.pairId === undefined) return;
        const p = (pairs[f.pairId] ||= {});
        if (f.kind === "grey_long_a") p.a = f;
        else if (f.kind === "grey_long_b") p.b = f;
      });
      Object.values(pairs).forEach(({ a, b }) => {
        if (!a || !b) return;
        // synchronize vertical velocity
        b.vy = a.vy;
        // small corrective horizontal velocity to maintain spacing
        const sign = a.vx >= 0 ? 1 : -1;
        const desiredX = a.x + FISH_SIZE * sign;
        const dx = desiredX - b.x;
        b.vx += dx * 0.05 * scale;
      });

      // skeleton behavior
      const immuneKinds = new Set(["brown", "grey_long_a", "grey_long_b"]);
      const detectionRadius2 = SKELETON_DETECTION_RADIUS * SKELETON_DETECTION_RADIUS;
      let skeletonCount = cur.fish.filter((f) => f.isSkeleton || f.pendingSkeleton).length;
      const skeletons = cur.fish.filter((f) => f.isSkeleton);
      skeletons.forEach((s, idx) => {
        let target: Fish | undefined;
        let targetDist2 = detectionRadius2;
        for (const t of cur.fish) {
          if (t.isSkeleton || t.pendingSkeleton) continue;
          if (immuneKinds.has(t.kind)) continue;
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < targetDist2) {
            targetDist2 = dist2;
            target = t;
          }
        }

        if (!target) {
          // No valid target nearby; stop pursuing
          s.vx = 0;
          s.vy = 0;
          return;
        }

        const dx = target.x - s.x;
        const dy = target.y - s.y;
        const dist = Math.sqrt(targetDist2);
        if (dist > 0) {
          s.vx = (dx / dist) * SKELETON_SPEED;
          s.vy = (dy / dist) * SKELETON_SPEED;
        }

        if (
          dist < SKELETON_CONVERT_DISTANCE &&
          skeletonCount < MAX_SKELETONS &&
          !target.pendingSkeleton
        ) {
          // Spawn a brief text effect before converting the fish
          makeText("POOF", target.x, target.y);
          target.pendingSkeleton = true;
          target.flashTimer = CONVERT_FLASH_DURATION_MS;
          target.vx = 0;
          target.vy = 0;
          target.frame = 0;
          target.frameCounter = 0;
          delete target.groupId;
          cur.conversions += 1;
          audio.play("convert");
          skeletonCount += 1;
        }

        // repel nearby skeletons
        for (let i = 0; i < skeletons.length; i++) {
          if (i === idx) continue;
          const other = skeletons[i];
          const rdx = other.x - s.x;
          const rdy = other.y - s.y;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
          if (rdist > 0 && rdist < SKELETON_REPEL_DISTANCE) {
            s.vx -= (rdx / rdist) * SKELETON_REPEL_FORCE * scale;
            s.vy -= (rdy / rdist) * SKELETON_REPEL_FORCE * scale;
          }
        }
        const limited = clampIncline(s.vx, s.vy);
        s.vx = limited.vx;
        s.vy = limited.vy;
      });

      // natural wandering for non-skeleton fish
      cur.fish.forEach((f) => {
        if (f.isSkeleton) return;
        f.wanderTimer -= deltaMs;
        if (f.wanderTimer <= 0) {
          const range = FISH_SPEED_MAX - FISH_SPEED_MIN;
          const speed = (Math.random() * range + FISH_SPEED_MIN) * difficultyFactor();
          let vx: number;
          let vy: number;
          if (Math.abs(f.vx) >= Math.abs(f.vy)) {
            // mostly horizontal – keep heading and add slight vertical drift
            const dir = f.vx >= 0 ? 1 : -1;
            vx = dir * speed;
            vy = (Math.random() * 2 - 1) * speed * 0.25;
          } else {
            // mostly vertical – keep heading and add slight horizontal drift
            const dir = f.vy >= 0 ? 1 : -1;
            vy = dir * speed;
            vx = (Math.random() * 2 - 1) * speed * 0.25;
          }
          const limited = clampIncline(vx, vy);
          f.vx = limited.vx;
          f.vy = limited.vy;
          // reset timer
          f.wanderTimer =
            Math.random() * (WANDER_TIMER_MAX_MS - WANDER_TIMER_MIN_MS) + WANDER_TIMER_MIN_MS;
        }
      });

      // move fish with a slight oscillation and update their angle
      cur.fish.forEach((f) => {
        if (f.hurtTimer > 0) f.hurtTimer -= deltaMs;
        const osc = Math.sin((frameRef.current / FRAME_MS + f.id) / 20) * 0.5;
        const limited = clampIncline(f.vx, f.vy + osc);
        f.x += limited.vx * scale;
        f.y += limited.vy * scale;
        const orient = orientFish(limited.vx, limited.vy);
        f.angle = orient.angle;
        f.flipped = orient.flipped;
        if (f.isSkeleton) {
          f.x = Math.max(0, Math.min(f.x, width - FISH_SIZE));
          f.y = Math.max(0, Math.min(f.y, height - FISH_SIZE));
        }
      });
    },
    [audio, makeText, getImg],
  );

  const spawnBubble = useCallback(() => {
    const { width, height } = state.current.dims;
    const kinds = ["bubble_a", "bubble_b", "bubble_c"];
    const kind = pickRandom(kinds);
    if (!kind) return;
    const size = randomInRange(BUBBLE_MIN, BUBBLE_MAX);
    const x = randomInRange(0, Math.max(0, width - size));
    const y = height + size;
    const vx = randomInRange(-BUBBLE_VX_MAX, BUBBLE_VX_MAX);
    const vy = randomInRange(BUBBLE_VY_MIN, BUBBLE_VY_MAX); // upward
    const amp = randomInRange(0.5, 2.5);
    const freq = randomInRange(0.01, 0.06);
    if (state.current.bubbles.length >= MAX_BUBBLES) return;
    const bubble = inactiveBubbles.current.pop() || ({} as Bubble);
    bubble.id = nextBubbleId.current++;
    bubble.kind = kind;
    bubble.x = x;
    bubble.y = y;
    bubble.vx = vx;
    bubble.vy = vy;
    bubble.size = size;
    bubble.amp = amp;
    bubble.freq = freq;
    state.current.bubbles.push(bubble);
  }, []);

  // main loop updates timer and fish
  const loop = useCallback(
    ({ deltaMs: frameDeltaMs }: { deltaMs: number }) => {
      advanceClock(frameDeltaMs);
      const { deltaMs, scale } = clockRef.current;
      const cur = state.current;
      if (timerLabel.current) {
        const lbl = timerLabel.current;
        const width = lbl.imgs.reduce(
          (sum, img) => sum + (img ? img.width * lbl.scale + 2 : lbl.spaceGap),
          0,
        );
        const height = lbl.imgs.reduce(
          (max, img) => Math.max(max, (img?.height || 0) * lbl.scale),
          0,
        );
        lbl.x = (cur.dims.width - width) / 2;
        timeTextBounds.current = {
          x: lbl.x,
          y: lbl.y - (lbl.py ?? 0),
          width,
          height: height + (lbl.py ?? 0) * 2,
        };
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        return;
      }

      if (cur.phase === "playing") {
        updateFish(deltaMs, scale);

        // spawn and animate bubbles
        bubbleSpawnRef.current -= deltaMs;
        if (bubbleSpawnRef.current <= 0) {
          spawnBubble();
          bubbleSpawnRef.current = randomInRange(30, 90) * FRAME_MS;
        }
        cur.bubbles.forEach((b) => {
          // Update position using velocity and per-bubble wiggle
          b.x += (b.vx + Math.sin((frameRef.current / FRAME_MS) * b.freq) * b.amp) * scale;
          b.y += b.vy * scale;
        });
        cur.bubbles = cur.bubbles.filter((b) => {
          const onScreen = b.y + b.size > 0 && b.x + b.size > 0 && b.x - b.size < cur.dims.width;
          if (!onScreen) inactiveBubbles.current.push(b);
          return onScreen;
        });

        // track frames and decrement the timer once per second
        frameRef.current += deltaMs;
        if (frameRef.current >= 1000) {
          frameRef.current -= 1000;
          cur.timer = Math.max(0, cur.timer - 1);
          audio.play("tick");
          updateDigitLabel(timerLabel.current, cur.timer, 2);
          if (cur.timer === 10 && !cur.warningPlayed) {
            audio.play("warning");
            cur.warningPlayed = true;
          }
        }

        // check for game over once timer hits zero
        if (cur.timer === 0) {
          cur.phase = "gameover";
          finalAccuracy.current = cur.shots > 0 ? Math.round((cur.hits / cur.shots) * 100) : 0;
          updateBestAccuracy(finalAccuracy.current);
          displayAccuracy.current = 0;
          audio.pauseAll();
          if (accuracyStatLabel.current) {
            cur.textLabels = cur.textLabels.filter((lbl) => lbl !== accuracyStatLabel.current);
            accuracyStatLabel.current = null;
          }

          // create accuracy label
          const pctImg = getImg("pctImg") as HTMLImageElement;
          const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
          const scale = 1;
          const initImgs = [digitImgs["0"], pctImg];
          const totalWidth = initImgs.reduce((w, img) => w + img.width * scale + 2, 0);
          const accLbl = newTextLabel(
            {
              text: "0",
              scale,
              fixed: true,
              fade: false,
              x: (cur.dims.width - totalWidth) / 2,
              y: cur.dims.height / 2,
              py: STAT_LABEL_PY,
            },
            assetMgr,
          );
          accLbl.text = "0%";
          accLbl.imgs = initImgs;
          accuracyLabel.current = accLbl;
          cur.textLabels.push(accLbl);

          // create game over stat labels
          const makeStat = (text: string, y: number) => {
            const lbl = newTextLabel(
              { text, scale: 1, fixed: true, fade: false, y, py: STAT_LABEL_PY },
              assetMgr,
              cur.dims,
            );
            cur.textLabels.push(lbl);
            return lbl;
          };

          const baseY = accLbl.y + 40;
          gameoverTimeLabel.current = makeStat(
            `TIME ${cur.timer.toString().padStart(2, "0")}`,
            baseY,
          );
          gameoverShotsLabel.current = makeStat(`SHOTS ${cur.shots}`, baseY + 40);
          gameoverHitsLabel.current = makeStat(`HITS ${cur.hits}`, baseY + 80);

          // create a label for each fish type hit
          let y = baseY + 120;
          Object.entries(cur.hitCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([kind, count]) => {
              const text = `${kind.replace(/_/g, " ")} ${count}`;
              makeStat(text, y);
              y += 40;
            });
          gameoverScoreLabel.current = makeStat(`SCORE ${cur.score}`, baseY + 120);
        }
        if (!bestAccuracyLabel.current) {
          const best = Number(localStorage.getItem("bestAccuracy") || 0);
          const pctImg = getImg("pctImg") as HTMLImageElement;
          const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
          const lbl = newTextLabel(
            {
              text: `${best}%`,
              scale: 1,
              fixed: true,
              fade: false,
              x: 16,
              y: 16,
              py: STAT_LABEL_PY,
            },
            assetMgr,
          );
          lbl.imgs = [
            ...best
              .toString()
              .split("")
              .map((ch) => digitImgs[ch]),
            pctImg,
          ];
          bestAccuracyLabel.current = lbl;
          cur.textLabels.push(lbl);
        }

        // cull fish that have moved completely off-screen
        const { width, height } = cur.dims;
        const margin = FISH_SIZE * 2;
        cur.fish = cur.fish.filter((f) => {
          const on =
            f.x > -margin && f.x < width + margin && f.y > -margin && f.y < height + margin;
          if (!on) inactiveFish.current.push(f);
          return on;
        });
      }

      // update miss particles
      cur.missParticles.forEach((p) => {
        p.radius += MISS_GROWTH * scale;
        p.alpha -= MISS_FADE * scale;
      });
      cur.missParticles = cur.missParticles.filter((p) => p.alpha > 0);

      // update accuracy label during gameover
      if (cur.phase === "gameover" && accuracyLabel.current) {
        const lbl = accuracyLabel.current;
        if (displayAccuracy.current < finalAccuracy.current) {
          const prev = Math.floor(displayAccuracy.current);
          displayAccuracy.current = Math.min(
            displayAccuracy.current + scale,
            finalAccuracy.current,
          );
          if (Math.floor(displayAccuracy.current) > prev) {
            audio.play("tick");
          }
          const pct = Math.floor(displayAccuracy.current);
          const str = pct.toString();
          const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
          const pctImg = getImg("pctImg") as HTMLImageElement;
          lbl.text = `${str}%`;
          lbl.imgs = [...str.split("").map((ch) => digitImgs[ch]), pctImg];
        }

        // pulse the accuracy label slightly each frame
        lbl.scale = 1 + 0.05 * Math.sin((frameRef.current / FRAME_MS) * 0.1);
        const totalWidth = lbl.imgs.reduce((w, img) => w + (img?.width || 0) * lbl.scale + 2, 0);
        lbl.x = (cur.dims.width - totalWidth) / 2;
      }

      // cull fish that have moved completely off-screen
      if (cur.phase === "playing") {
        const { width, height } = cur.dims;
        const margin = FISH_SIZE * 2;
        cur.fish = cur.fish.filter((f) => {
          const on =
            f.x > -margin && f.x < width + margin && f.y > -margin && f.y < height + margin;
          if (!on) inactiveFish.current.push(f);
          return on;
        });
      }

      if (cur.phase === "paused") {
        if (!pausedLabel.current) {
          pausedLabel.current = newTextLabel(
            { text: "PAUSED", scale: 2, fixed: true, fade: false },
            assetMgr,
            cur.dims,
          );
          cur.textLabels.push(pausedLabel.current);
        }
      } else if (pausedLabel.current) {
        cur.textLabels = cur.textLabels.filter((l) => l !== pausedLabel.current);
        pausedLabel.current = null;
      }

      // draw bubbles, fish and text labels
      if (canvas && ctx) {
        ctx.clearRect(0, 0, cur.dims.width, cur.dims.height);

        drawBackground(ctx);

        // draw timer bar at top of screen
        const barWidth = (cur.timer / GAME_TIME) * cur.dims.width;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, barWidth, 8);

        // draw bubbles beneath fish
        const bubbleImgs = getImg("bubbleImgs") as Record<string, HTMLImageElement>;
        cur.bubbles.forEach((b) => {
          const img = bubbleImgs[b.kind as keyof typeof bubbleImgs];
          if (!img) return;
          // scale according to the bubble's size before drawing
          ctx.drawImage(img, b.x, b.y, b.size, b.size);
        });

        cur.missParticles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${p.alpha})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        });

        cur.fish.forEach((f) => {
          const frameMap = getImg(f.isSkeleton ? "skeletonFrames" : "fishFrames") as Record<
            string,
            HTMLImageElement[]
          >;
          const frames = frameMap[f.kind as keyof typeof frameMap];
          if (!frames || frames.length === 0) return;
          const img = frames[f.frame];
          if (!img) return;
          ctx.save();
          let pivotX = f.x + FISH_SIZE / 2;
          const pivotY = f.y + FISH_SIZE / 2;
          let drawX = -FISH_SIZE / 2;
          const drawY = -FISH_SIZE / 2;
          if (f.kind === "grey_long_a" || f.kind === "grey_long_b") {
            pivotX = f.x + (f.kind === "grey_long_a" ? FISH_SIZE : 0);
            drawX = f.kind === "grey_long_a" ? -FISH_SIZE : 0;
          }
          // Rotate the fish based on its precomputed orientation
          ctx.translate(pivotX, pivotY);
          ctx.rotate(f.angle);
          if (f.flipped) {
            ctx.scale(-1, 1);
          }
          if (f.highlight) {
            const fishImgs = getImg("fishImgs") as Record<string, HTMLImageElement>;
            const outline = fishImgs[`${f.kind}_outline` as keyof typeof fishImgs];
            if (outline) {
              ctx.globalAlpha = (Math.sin(frameRef.current / FRAME_MS / 10) + 1) / 2;
              ctx.drawImage(outline, drawX, drawY, FISH_SIZE, FISH_SIZE);
              ctx.globalAlpha = 1;
            }
          }
          ctx.drawImage(img, drawX, drawY, FISH_SIZE, FISH_SIZE);
          if (f.pendingSkeleton || (f.isSkeleton && f.hurtTimer > 0)) {
            const flash = getImg("fishFlashImg") as HTMLImageElement;
            if (flash) {
              ctx.drawImage(flash, drawX, drawY, FISH_SIZE, FISH_SIZE);
            }
          }
          ctx.restore();
        });

        cur.textLabels = drawTextLabels({
          textLabels: cur.textLabels,
          ctx,
          cull: true,
        });
      }

      cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;

      if (accuracyStatLabel.current && cur.phase === "playing") {
        const lbl = accuracyStatLabel.current;
        const pct = Math.round(cur.accuracy);
        const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;
        const pctImg = getImg("pctImg") as HTMLImageElement;
        lbl.text = `${pct}%`;
        lbl.imgs = [
          ...pct
            .toString()
            .split("")
            .map((ch) => digitImgs[ch]),
          pctImg,
        ];
        const totalWidth = lbl.imgs.reduce((w, img) => w + (img?.width || 0) * lbl.scale + 2, 0);
        lbl.x = cur.dims.width - totalWidth - 16;
      }

      setUI({
        phase: cur.phase,
        timer: cur.timer,
        shots: cur.shots,
        hits: cur.hits,
        score: cur.score,
        accuracy: cur.accuracy,
        cursor: cur.cursor,
      });
    },
    [updateFish, getImg, assetMgr, spawnBubble, updateDigitLabel],
  );

  // start the game
  const startSplash = useCallback(() => {
    const cur = state.current;
    cur.phase = "playing";
    cur.timer = GAME_TIME;
    cur.shots = 0;
    cur.hits = 0;
    cur.score = 0;
    cur.accuracy = 0;
    inactiveFish.current.push(...cur.fish);
    cur.fish = [];
    inactiveBubbles.current.push(...cur.bubbles);
    cur.bubbles = [];
    cur.missParticles = [];
    cur.warningPlayed = false;

    frameRef.current = 0;
    accuracyLabel.current = null;
    accuracyStatLabel.current = null;
    bestAccuracyLabel.current = null;
    finalAccuracy.current = 0;
    displayAccuracy.current = 0;
    backgroundSeed.current = Math.random() * 1000;
    backgroundCanvas.current = null;
    pausedLabel.current = null;
    gameoverShotsLabel.current = null;
    gameoverHitsLabel.current = null;
    gameoverTimeLabel.current = null;
    gameoverScoreLabel.current = null;

    const digitImgs = getImg("digitImgs") as Record<string, HTMLImageElement>;

    audio.playSequence(NES_BGM_SEQUENCE, { loop: true });

    const labelWidth = (lbl: TextLabel) =>
      lbl.imgs.reduce((sum, img) => sum + (img ? img.width + 2 : lbl.spaceGap), 0);

    const timer = newTextLabel(
      {
        text: `${cur.timer.toString().padStart(2, "0")}`,
        scale: 1,
        fixed: true,
        fade: false,
        x: 0,
        y: 16,
        py: STAT_LABEL_PY,
      },
      assetMgr,
    );
    updateDigitLabel(timer, cur.timer, 2);
    timer.x = (cur.dims.width - labelWidth(timer)) / 2;
    timerLabel.current = timer;
    timeTextBounds.current = {
      x: timer.x,
      y: timer.y - (timer?.py || 0),
      width: labelWidth(timer),
      height:
        timer.imgs.reduce((max, img) => Math.max(max, (img?.height || 0) * timer.scale), 0) +
        (timer?.py || 0) * 2,
    };

    scoreLabel.current = newTextLabel(
      {
        text: cur.score.toString(),
        scale: 1,
        fixed: true,
        fade: false,
      },
      assetMgr,
    );
    updateScoreLabel(scoreLabel.current, cur.score);

    const pctImg = getImg("pctImg") as HTMLImageElement;
    const accLbl = newTextLabel(
      {
        text: "0%",
        scale: 1,
        fixed: true,
        fade: false,
        x: 0,
        y: 16,
        py: STAT_LABEL_PY,
      },
      assetMgr,
    );
    accLbl.imgs = [digitImgs["0"], pctImg];
    accLbl.x =
      cur.dims.width -
      accLbl.imgs.reduce((w, img) => w + (img?.width || 0) * accLbl.scale + 2, 0) -
      16;
    accuracyStatLabel.current = accLbl;
    bubbleSpawnRef.current = 0;

    state.current.textLabels = [timerLabel.current!, scoreLabel.current!, accLbl];
    cur.cursor = DEFAULT_CURSOR;
    setUI({
      phase: cur.phase,
      timer: cur.timer,
      shots: cur.shots,
      hits: cur.hits,
      score: cur.score,
      accuracy: cur.accuracy,
      cursor: cur.cursor,
    });

    startManagedAnimationLoop({
      frameRef: animationFrameRef,
      onFrame: loop,
    });
  }, [loop, assetMgr, getImg, updateDigitLabel]);

  // reset back to title screen
  const resetGame = useCallback(() => {
    const cur = state.current;

    clearManagedTimeout(fishSpawnTimeout, clearScaledTimeout);

    cur.phase = "title";
    cur.timer = GAME_TIME;
    cur.shots = 0;
    cur.hits = 0;
    cur.score = 0;
    cur.accuracy = 0;
    cur.conversions = 0;
    cur.hitCounts = {};
    inactiveFish.current.push(...cur.fish);
    cur.fish = [];
    cur.cursor = DEFAULT_CURSOR;
    inactiveBubbles.current.push(...cur.bubbles);
    cur.bubbles = [];
    cur.missParticles = [];
    cur.warningPlayed = false;

    accuracyLabel.current = null;
    accuracyStatLabel.current = null;
    bestAccuracyLabel.current = null;
    finalAccuracy.current = 0;
    displayAccuracy.current = 0;
    frameRef.current = 0;
    timerLabel.current = null;
    scoreLabel.current = null;
    gameoverShotsLabel.current = null;
    gameoverHitsLabel.current = null;
    gameoverTimeLabel.current = null;
    gameoverScoreLabel.current = null;
    state.current.textLabels = [];
    bubbleSpawnRef.current = 0;
    nextFishId.current = 1;
    nextGroupId.current = 1;
    nextPairId.current = 1;
    nextBubbleId.current = 1;
    backgroundSeed.current = Math.random() * 1000;
    backgroundCanvas.current = null;
    pausedLabel.current = null;

    setUI({
      phase: cur.phase,
      timer: cur.timer,
      shots: cur.shots,
      hits: cur.hits,
      score: cur.score,
      accuracy: cur.accuracy,
      cursor: cur.cursor,
    });
    cancelAnimationFrameRef(animationFrameRef);
    clearManagedTimeout(cursorTimeoutRef, clearScaledTimeout);
    audio.pauseAll();
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const cur = state.current;
      if (e.code === "Escape" && (cur.phase === "playing" || cur.phase === "paused")) {
        cur.phase = cur.phase === "playing" ? "paused" : "playing";
        setUI({
          phase: cur.phase,
          timer: cur.timer,
          shots: cur.shots,
          hits: cur.hits,
          score: cur.score,
          accuracy: cur.accuracy,
          cursor: cur.cursor,
        });
        return;
      }
      if (cur.phase === "gameover" && e.code === "Space") {
        resetGame();
        startSplash();
      } else if (state.current.phase === "title") {
        startSplash();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [resetGame, startSplash]);

  // handle mouse move – change cursor when hovering over fish
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const cur = state.current;
      if (cur.phase !== "playing" || cur.cursor === SHOT_CURSOR) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = mapClientPointToWorld({
        clientX: e.clientX,
        clientY: e.clientY,
        bounds: canvas.getBoundingClientRect(),
        worldWidth: cur.dims.width,
        worldHeight: cur.dims.height,
      });

      const hovering = cur.fish.some((f) =>
        pointInRect({ x, y }, { x: f.x, y: f.y, width: FISH_SIZE, height: FISH_SIZE }),
      );

      const nextCursor = hovering ? TARGET_CURSOR : DEFAULT_CURSOR;
      if (nextCursor !== cur.cursor) {
        syncCursor(nextCursor);
      }
    },
    [syncCursor],
  );

  // handle left click – detect and affect fish
  const handleClick = useCallback(
    (e: ClickEvent) => {
      e.preventDefault?.();
      const cur = state.current;
      if (cur.phase === "gameover") {
        resetGame();
        startSplash();
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        setUI({
          phase: cur.phase,
          timer: cur.timer,
          shots: cur.shots,
          hits: cur.hits,
          score: cur.score,
          accuracy: cur.accuracy,
          cursor: cur.cursor,
        });
        return;
      }
      const clickPoint = mapClientPointToWorld({
        clientX: e.clientX,
        clientY: e.clientY,
        bounds: canvas.getBoundingClientRect(),
        worldWidth: cur.dims.width,
        worldHeight: cur.dims.height,
      });
      const { x: canvasX, y: canvasY } = clickPoint;

      const bounds = timeTextBounds.current;
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
          setUI({
            phase: cur.phase,
            timer: cur.timer,
            shots: cur.shots,
            hits: cur.hits,
            score: cur.score,
            accuracy: cur.accuracy,
            cursor: cur.cursor,
          });
        }
        return;
      }

      if (cur.phase !== "playing") return;

      syncCursor(SHOT_CURSOR);
      scheduleManagedTimeout({
        handleRef: cursorTimeoutRef,
        callback: () => {
          syncCursor(DEFAULT_CURSOR);
        },
        delayMs: 100,
        setTimeoutFn: setScaledTimeout,
        clearTimeoutFn: clearScaledTimeout,
      });

      cur.shots += 1;
      audio.play("shoot");

      // check bubbles first so they are popped before fish hits
      const bubbleHitIndex = findTopmostHitIndex(cur.bubbles, (bubble) =>
        pointInCircle(clickPoint, {
          x: bubble.x + bubble.size / 2,
          y: bubble.y + bubble.size / 2,
          radius: bubble.size / 2,
        }),
      );
      if (bubbleHitIndex >= 0) {
        const [removedBubble] = cur.bubbles.splice(bubbleHitIndex, 1);
        if (removedBubble) inactiveBubbles.current.push(removedBubble);
        audio.play("pop");
        cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;
        setUI({
          phase: cur.phase,
          timer: cur.timer,
          shots: cur.shots,
          hits: cur.hits,
          score: cur.score,
          accuracy: cur.accuracy,
          cursor: cur.cursor,
        });
        return;
      }

      // iterate fish in reverse draw order so topmost fish are hit first
      let hit = false;
      const fishHitIndex = findTopmostHitIndex(cur.fish, (fish) =>
        pointInRect(clickPoint, { x: fish.x, y: fish.y, width: FISH_SIZE, height: FISH_SIZE }),
      );
      if (fishHitIndex >= 0) {
        const f = cur.fish[fishHitIndex];
        cur.hits += 1;
        cur.hitCounts[f.kind] = (cur.hitCounts[f.kind] || 0) + 1;
        audio.play("hit");
        hit = true;
        const scoreMap: Record<string, number> = {
          brown: 50,
          grey_long_a: 5,
          grey_long_b: 5,
        };
        const base = f.isSkeleton ? 20 : (scoreMap[f.kind] ?? 10);
        const gain = base + cur.conversions;
        cur.score += gain;
        updateScoreLabel(scoreLabel.current, cur.score);
        if (f.kind === "brown") {
          cur.timer += TIME_BONUS_BROWN_FISH;
          updateDigitLabel(timerLabel.current, cur.timer, 2);
          makeText(`+${TIME_BONUS_BROWN_FISH}`, f.x, f.y, "#0f0");
          const [removed] = cur.fish.splice(fishHitIndex, 1);
          if (removed) inactiveFish.current.push(removed);
          audio.play("bonus");
        } else if (f.kind === "grey_long_a" || f.kind === "grey_long_b") {
          cur.timer += TIME_BONUS_GREY_LONG;
          updateDigitLabel(timerLabel.current, cur.timer, 2);
          makeText(`+${TIME_BONUS_GREY_LONG}`, f.x, f.y, "#f00");
          const pid = f.pairId;
          if (pid !== undefined) {
            const removed = cur.fish.filter((fish) => fish.pairId === pid);
            cur.fish = cur.fish.filter((fish) => fish.pairId !== pid);
            inactiveFish.current.push(...removed);
          } else {
            const [removed] = cur.fish.splice(fishHitIndex, 1);
            if (removed) inactiveFish.current.push(removed);
          }
          audio.play("bonus");
        } else {
          const skeletonCount = cur.fish.filter(
            (fish) => fish.isSkeleton || fish.pendingSkeleton,
          ).length;
          if (!f.isSkeleton) {
            if (Math.random() < 0.5 && skeletonCount < MAX_SKELETONS) {
              f.isSkeleton = true;
              f.health = 1;
              f.hurtTimer = 0;
              f.frame = 0;
              f.frameCounter = 0;
              delete f.groupId;
              audio.play("skeleton");
            } else {
              const [removed] = cur.fish.splice(fishHitIndex, 1);
              if (removed) inactiveFish.current.push(removed);
              audio.play("death");
            }
          } else {
            f.health -= 1;
            if (f.health > 0) {
              f.hurtTimer = HURT_DURATION_MS;
              audio.play("skeleton");
            } else {
              const [removed] = cur.fish.splice(fishHitIndex, 1);
              if (removed) inactiveFish.current.push(removed);
              audio.play("death");
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
        } as MissParticle);
      }

      cur.accuracy = cur.shots > 0 ? (cur.hits / cur.shots) * 100 : 0;
      setUI({
        phase: cur.phase,
        timer: cur.timer,
        shots: cur.shots,
        hits: cur.hits,
        score: cur.score,
        accuracy: cur.accuracy,
        cursor: cur.cursor,
      });
    },
    [audio, makeText, updateDigitLabel, resetGame, startSplash],
  );

  // suppress context menu
  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // factor that ramps up difficulty as time runs out
  function difficultyFactor() {
    return 1 + (1 - state.current.timer / GAME_TIME);
  }

  // spawn a group of fish just outside the viewport edges
  const spawnFish = useCallback((kind: string, count: number): Fish[] => {
    if (kind === "skeleton") return [];
    const spawned: Fish[] = [];
    const { width, height } = state.current.dims;
    // keep school member velocity variance tied to the configured speed range
    const speedVariance = (FISH_SPEED_MAX - FISH_SPEED_MIN) / 4;

    const specialSingles = ["brown"] as string[];
    const specialPairs: Record<string, string[]> = {
      grey_long: ["grey_long_a", "grey_long_b"],
    };
    const specialPairParts = Object.values(specialPairs).flat();
    const isSpecial = specialSingles.includes(kind) || !!specialPairs[kind];

    const specialsOnScreen = state.current.fish.filter(
      (f) => specialSingles.includes(f.kind) || specialPairParts.includes(f.kind),
    ).length;
    const basicsOnScreen = state.current.fish.filter(
      (f) =>
        !f.isSkeleton && !specialSingles.includes(f.kind) && !specialPairParts.includes(f.kind),
    ).length;

    if (isSpecial) {
      if (specialsOnScreen >= MAX_SPECIAL_FISH) return [];
      const needed = specialPairs[kind]?.length ?? 1;
      if (specialsOnScreen + needed > MAX_SPECIAL_FISH) return [];
      count = 1;
    } else {
      const available = MAX_FISH - basicsOnScreen;
      if (available <= 0) return [];
      count = Math.min(count, available);
    }
    count = Math.min(count, MAX_SCHOOL_SIZE);

    const reuseFish = () => inactiveFish.current.pop() || ({} as Fish);

    // decide spawning edge with a bias toward left/right entrances
    // omit top/bottom edges to avoid vertically swimming fish
    const edges = [0, 0, 0, 1, 1, 1] as const;
    const edge = pickRandom(edges) ?? 0; // 0:left,1:right
    const startX = edge === 0 ? -FISH_SIZE : width + FISH_SIZE;

    // generate a velocity based on the entry edge
    const genVelocity = () => {
      const factor = difficultyFactor();
      const range = FISH_SPEED_MAX - FISH_SPEED_MIN;
      const main = (Math.random() * range + FISH_SPEED_MIN) * factor;
      const cross = (Math.random() * range - range / 2) * factor;
      let vx: number;
      let vy: number;
      if (edge === 0) {
        vx = main;
        vy = cross;
      } else {
        vx = -main;
        vy = cross;
      }
      return clampIncline(vx, vy);
    };

    // helper to create a fish
    const makeFish = (
      k: string,
      x: number,
      y: number,
      vx: number,
      vy: number,
      groupId?: number,
      highlight = false,
    ) => {
      const f = reuseFish();
      f.id = nextFishId.current++;
      f.kind = k;
      f.x = x;
      f.y = y;
      f.vx = vx;
      f.vy = vy;
      const orient = orientFish(vx, vy);
      f.angle = orient.angle;
      f.flipped = orient.flipped;
      f.frame = 0;
      f.frameCounter = 0;
      f.health = 0;
      f.hurtTimer = 0;
      f.isSkeleton = false;
      f.groupId = groupId;
      f.pairId = undefined;
      f.highlight = highlight ? true : undefined;
      f.pendingSkeleton = undefined;
      f.flashTimer = undefined;
      f.wanderTimer =
        Math.random() * (WANDER_TIMER_MAX_MS - WANDER_TIMER_MIN_MS) + WANDER_TIMER_MIN_MS;
      return f;
    };

    if (specialPairs[kind]) {
      // grey_long spawns as two pieces that move together
      const pairId = nextPairId.current++;
      const { vx, vy } = genVelocity(); // keep pair aligned
      const pairStart = edge === 0 ? -2 * FISH_SIZE : width - FISH_SIZE;
      const y = Math.random() * height;
      specialPairs[kind].forEach((name, idx) => {
        const x = pairStart + idx * FISH_SIZE;
        const f = makeFish(name, x, y, vx, vy);
        f.pairId = pairId;
        spawned.push(f);
      });
    } else {
      // non-special fish
      const baseX = startX;
      const baseY = Math.random() * height;
      const baseVel = genVelocity();
      const groupId =
        count > 1 && !specialSingles.includes(kind) ? nextGroupId.current++ : undefined;

      for (let i = 0; i < count; i++) {
        let px = baseX;
        let py = baseY;
        let vx = baseVel.vx;
        let vy = baseVel.vy;

        if (groupId !== undefined && i > 0) {
          py += (Math.random() - 0.5) * FISH_SIZE;
          px += edge === 0 ? -Math.random() * (FISH_SIZE / 2) : Math.random() * (FISH_SIZE / 2);
          vx += (Math.random() - 0.5) * speedVariance;
          vy += (Math.random() - 0.5) * speedVariance;
          const limited = clampIncline(vx, vy);
          vx = limited.vx;
          vy = limited.vy;
        } else {
          py = Math.random() * height;
        }

        const fish = makeFish(kind, px, py, vx, vy, groupId, isSpecial && i === 0);
        spawned.push(fish);
      }
    }

    state.current.fish.push(...spawned);
    return spawned;
  }, []);

  // spawn scheduler
  useEffect(() => {
    if (ui.phase !== "playing") return;
    const basicKinds = ["blue", "green", "orange", "pink", "red"];
    scheduleManagedSpawner({
      handleRef: fishSpawnTimeout,
      shouldContinue: () => state.current.phase === "playing",
      getDelayMs: () => {
        const { timer, conversions } = state.current;
        const difficultyFactor = 1 + (1 - timer / GAME_TIME) + conversions * 0.1;
        // FISH_SPAWN_INTERVAL_* are expressed in frames; convert to ms
        const min = FISH_SPAWN_INTERVAL_MIN * FRAME_MS;
        const max = FISH_SPAWN_INTERVAL_MAX * FRAME_MS;
        const baseDelay = randomInRange(min, max);
        return Math.max(baseDelay / difficultyFactor, 250);
      },
      spawn: () => {
        const kind = pickRandom(basicKinds) ?? "blue";
        const count = Math.floor(Math.random() * 5) + 1;
        spawnFish(kind, count);

        const roll = Math.random();
        if (roll < 0.1) {
          spawnFish("brown", 1);
        } else if (roll < 0.15) {
          spawnFish("grey_long", 1);
        }
      },
      setTimeoutFn: setScaledTimeout,
      clearTimeoutFn: clearScaledTimeout,
    });

    return () => {
      clearManagedTimeout(fishSpawnTimeout, clearScaledTimeout);
    };
  }, [ui.phase, spawnFish]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrameRef(animationFrameRef);
    };
  }, []);

  return {
    ui,
    canvasRef,
    handleMouseMove,
    handleClick,
    handleContext,
    resetGame,
    startSplash,
    getImg,
    ready,
    spawnFish,
  };
}
