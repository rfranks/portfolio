import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { clockRef, advanceClock } from "@/hooks/time/useScaledClock";
import { useArcadeEngineCore } from "@/hooks/game/useArcadeEngineCore";
import { useArcadeUiSnapshotSync } from "@/hooks/game/useArcadeUiSnapshotSync";
import { useGameAssets } from "./useGameAssets";
import { useGameAudio } from "./useGameAudio";
import { drawTextLabels, newTextLabel } from "@/utils/game/ui";
import { randomInRange } from "@/utils/game/engine2d";
import { drawRandomTerrainBackground } from "../_drawRandomTerrainBackground";
import {
  FISH_SIZE,
  FRAME_MS,
  GAME_TIME,
  MISS_FADE,
  MISS_GROWTH,
  NES_BGM_SEQUENCE,
  STAT_LABEL_PY,
} from "../_utils/gameConfig";

import type { GameState, GameUIState, Fish, Bubble } from "../_types";
import { DEFAULT_CURSOR, DEBUG_FPS_SCALE } from "../_constants";
import type { AssetMgr } from "@/types/game/ui";
import type { TextLabel } from "@/types/game/ui";
import type { AudioMgr } from "@/types/audio/audio";
import { ScaledTimeoutHandle } from "@/types/hooks/time";
import { configureZombiefishCanvasRenderingStage } from "./stages/renderingStage";
import { createZombiefishInputStage } from "./stages/inputStage";
import {
  runZombiefishFishSimulationStage,
  spawnZombiefishBubbleStage,
  spawnZombiefishFishStage,
} from "./stages/simulation/fishStage";
import { startZombiefishSpawnSimulationStage } from "./stages/simulationStage";
import { isZombiefishUiSnapshotEqual, selectZombiefishUiSnapshot } from "./game-engine/uiSnapshot";

/* eslint-disable react-hooks/exhaustive-deps */

export default function useGameEngine() {
  const { arcadeProfile, canvasRef, screenDims, dims, simulationRuntime } = useArcadeEngineCore({
    arcadeGameId: "zombiefish",
    debugName: "zombiefish",
    debugFps: DEBUG_FPS_SCALE,
  });
  const startArcadeSession = arcadeProfile.startSession;
  const finishArcadeSession = arcadeProfile.finishSession;

  // assets
  const assetMgr = useGameAssets();
  const { getImg, ready } = assetMgr;
  const audio: AudioMgr = useGameAudio();

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
  const backgroundSeed = useRef(Math.random() * 1000);
  const backgroundCanvas = useRef<HTMLCanvasElement | null>(null);
  const accuracyLabel = useRef<TextLabel | null>(null);
  const accuracyStatLabel = useRef<TextLabel | null>(null);
  const finalAccuracy = useRef(0);
  const displayAccuracy = useRef(0);
  const sessionCompletedRef = useRef(false);
  const arcadeSessionActiveRef = useRef(arcadeProfile.isSessionActive);
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

  const syncUIFromState = useArcadeUiSnapshotSync({
    stateRef: state,
    setUI,
    selectSnapshot: selectZombiefishUiSnapshot,
    isEqual: isZombiefishUiSnapshotEqual,
  });

  // sync base dims once and resize canvas on window changes
  useEffect(() => {
    state.current.dims = dims;
  }, []);

  useEffect(() => {
    arcadeSessionActiveRef.current = arcadeProfile.isSessionActive;
  }, [arcadeProfile.isSessionActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    configureZombiefishCanvasRenderingStage({
      canvas,
      ctx,
      screenWidth: screenDims.width,
      screenHeight: screenDims.height,
      dims,
    });
  }, [screenDims, dims]);

  const syncCursor = useCallback(
    (cursor: string) => {
      state.current.cursor = cursor;
      syncUIFromState();
    },
    [syncUIFromState],
  );

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

  const resolveZombiefishSessionStats = useCallback(
    (cur: GameState = state.current) => ({
      shotsFired: cur.shots,
      hits: cur.hits,
      conversions: cur.conversions,
      fishTagged: Object.values(cur.hitCounts).reduce((total, count) => total + count, 0),
      bestStreak: cur.conversions,
    }),
    [],
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
      runZombiefishFishSimulationStage({
        stateRef: state,
        groupVelocityRef,
        frameRef,
        canvasRef,
        getImg,
        makeText,
        play: audio.play,
        deltaMs,
        scale,
      });
    },
    [audio, makeText, getImg],
  );

  const spawnBubble = useCallback(() => {
    spawnZombiefishBubbleStage({
      stateRef: state,
      inactiveBubblesRef: inactiveBubbles,
      nextBubbleIdRef: nextBubbleId,
    });
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
          if (!sessionCompletedRef.current) {
            sessionCompletedRef.current = true;
            finishArcadeSession({
              completed: true,
              score: cur.score,
              accuracyPct: finalAccuracy.current,
              stats: resolveZombiefishSessionStats(cur),
            });
            arcadeSessionActiveRef.current = false;
          }
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
          const best = Math.round(
            Math.max(
              finalAccuracy.current,
              arcadeProfile.profile.games.zombiefish.highestAccuracyPct,
            ),
          );
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

      syncUIFromState();
    },
    [
      updateFish,
      getImg,
      assetMgr,
      spawnBubble,
      updateDigitLabel,
      arcadeProfile.profile,
      audio,
      finishArcadeSession,
      resolveZombiefishSessionStats,
    ],
  );

  // start the game
  const startSplash = useCallback(() => {
    if (arcadeSessionActiveRef.current && !sessionCompletedRef.current) {
      finishArcadeSession({
        completed: false,
        score: state.current.score,
        accuracyPct: state.current.accuracy,
        stats: resolveZombiefishSessionStats(),
      });
    }
    startArcadeSession();
    arcadeSessionActiveRef.current = true;
    sessionCompletedRef.current = false;

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
    syncUIFromState();

    simulationRuntime.startLoop(loop);
  }, [
    finishArcadeSession,
    loop,
    assetMgr,
    getImg,
    startArcadeSession,
    updateDigitLabel,
    simulationRuntime,
    resolveZombiefishSessionStats,
  ]);

  // reset back to title screen
  const resetGame = useCallback(() => {
    const cur = state.current;

    if (arcadeSessionActiveRef.current && !sessionCompletedRef.current) {
      finishArcadeSession({
        completed: false,
        score: cur.score,
        accuracyPct: cur.accuracy,
        stats: resolveZombiefishSessionStats(cur),
      });
      sessionCompletedRef.current = true;
      arcadeSessionActiveRef.current = false;
    }

    simulationRuntime.clearTimeout(fishSpawnTimeout);

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

    syncUIFromState();
    simulationRuntime.stopLoop();
    simulationRuntime.clearTimeout(cursorTimeoutRef);
    audio.pauseAll();
  }, [finishArcadeSession, simulationRuntime, audio, resolveZombiefishSessionStats]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const cur = state.current;
      if (e.code === "Escape" && (cur.phase === "playing" || cur.phase === "paused")) {
        cur.phase = cur.phase === "playing" ? "paused" : "playing";
        syncUIFromState();
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

  useEffect(() => {
    return () => {
      if (!arcadeSessionActiveRef.current || sessionCompletedRef.current) {
        return;
      }
      finishArcadeSession({
        completed: false,
        score: state.current.score,
        accuracyPct: state.current.accuracy,
        stats: resolveZombiefishSessionStats(),
      });
    };
  }, [finishArcadeSession, resolveZombiefishSessionStats]);

  const spawnFish = useCallback(
    (kind: string, count: number): Fish[] =>
      spawnZombiefishFishStage({
        stateRef: state,
        inactiveFishRef: inactiveFish,
        nextFishIdRef: nextFishId,
        nextGroupIdRef: nextGroupId,
        nextPairIdRef: nextPairId,
        kind,
        count,
      }),
    [],
  );

  const { handleMouseMove, handleClick, handleContext } = useMemo(
    () =>
      createZombiefishInputStage({
        stateRef: state,
        canvasRef,
        inactiveFishRef: inactiveFish,
        inactiveBubblesRef: inactiveBubbles,
        cursorTimeoutRef,
        timeTextBoundsRef: timeTextBounds,
        simulationRuntime,
        audio,
        syncCursor,
        syncUiFromState: syncUIFromState,
        updateDigitLabel,
        updateScoreLabel,
        timerLabelRef: timerLabel,
        scoreLabelRef: scoreLabel,
        makeText,
        resetGame,
        startSplash,
      }),
    [
      audio,
      canvasRef,
      cursorTimeoutRef,
      inactiveBubbles,
      inactiveFish,
      makeText,
      resetGame,
      scoreLabel,
      simulationRuntime,
      startSplash,
      state,
      syncCursor,
      syncUIFromState,
      timeTextBounds,
      timerLabel,
      updateDigitLabel,
      updateScoreLabel,
    ],
  );

  useEffect(() => {
    if (ui.phase !== "playing") {
      return;
    }
    return startZombiefishSpawnSimulationStage({
      stateRef: state,
      fishSpawnTimeoutRef: fishSpawnTimeout,
      simulationRuntime,
      spawnFish,
    });
  }, [ui.phase, simulationRuntime, spawnFish]);

  return {
    arcadeProfile,
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
