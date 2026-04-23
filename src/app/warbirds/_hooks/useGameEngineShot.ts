import { setScaledTimeout } from "@/hooks/time/useScaledClock";
import { SCORE_DIGIT_HEIGHT } from "@/consts/game/ui";
import {
  POWERUP_TYPES,
  SUPER_POWERUP_TYPES,
  ANTI_POWERUP_TYPES,
  DUCK_MAGNIFY_SCALE,
  DUCKSIGHT_MAGNIFY_SCALE,
  POWERUP_DURATION,
  MACHINE_GUN_BURST_COUNT,
} from "@/consts/game/powerups";
import {
  PLANE_WIDTH,
  PLANE_HEIGHT,
  AIRSHIP_BOB_FREQUENCY,
  AIRSHIP_BOB_AMPLITUDE,
  AIRSHIP_SIZE,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
} from "@/consts/game/vehicles";
import {
  FLAP_STRENGTH,
  PLANE_OFFSET_X,
  ENABLE_AUTO_FLAP,
  CLICK_RADIUS_MULTIPLIER,
  SCORE_FLAP,
  SCORE_DUCK,
  SCORE_RELOAD,
  MEDAL_SIZE,
  MEDAL_SCORE,
  SCORE_HIT,
  ENEMY_MEDAL_SPAWN_PROB,
  POWERUP_DEBUG,
  SMOKE_TRAIL_COUNT,
  MIN_STREAK,
} from "../_constants";
import type { GameState } from "../_types";
import type { AudioMgr } from "@/types/audio/audio";
import type { AssetMgr } from "@/types/game/ui";
import type { PowerupType, AntiPowerupType } from "@/types/game/objects";
import { pointInRect } from "@/utils/game/engine2d";
import type { MutableRefObject } from "react";

type RunSingleShotParams = {
  sx: number;
  sy: number;
  state: MutableRefObject<GameState>;
  play: AudioMgr["play"];
  getImg: AssetMgr["getImg"];
  changeScore: (delta: number) => void;
  spawnNapalmEllipse: (cx: number, cy: number, killsPlayer: boolean) => void;
  spawnCrashSmokeOne: (x: number, y: number) => void;
  makeText: (
    text: string,
    scale: number,
    fixed: boolean,
    fade: boolean,
    x?: number,
    y?: number,
    maxAge?: number,
  ) => void;
  dims: { width: number; height: number };
};

export function runWarbirdsSingleShot(params: RunSingleShotParams): void {
  const {
    sx,
    sy,
    state,
    play,
    getImg,
    changeScore,
    spawnNapalmEllipse,
    spawnCrashSmokeOne,
    makeText,
    dims,
  } = params;

  play("shotSfx");
  const shotPoint = { x: sx, y: sy };

  const powerupImgs = getImg("powerupImgs") as Record<string, HTMLImageElement>;
  // flap on plane if clicked there
  let didFlap = false;

  let flapStrength = FLAP_STRENGTH;

  // first, your new anti-powerups
  if (state.current.isActive("heavy", state.current.frameCount)) flapStrength *= 0.5; // half as strong
  if (state.current.isActive("sticky", state.current.frameCount)) flapStrength = 0; // no lift at all

  // then, wings still double whatever you have left
  if (state.current.isActive("wings", state.current.frameCount)) flapStrength *= 2;

  const cx = PLANE_OFFSET_X + PLANE_WIDTH / 2;
  const cy = state.current.y + PLANE_HEIGHT / 2;
  if (
    !ENABLE_AUTO_FLAP &&
    Math.abs(sx - cx) <= PLANE_WIDTH * CLICK_RADIUS_MULTIPLIER &&
    Math.abs(sy - cy) <= PLANE_HEIGHT * CLICK_RADIUS_MULTIPLIER
  ) {
    didFlap = true;
    state.current.vy = flapStrength;
    state.current.planeAngle = -0.5;
    state.current.puffs.push({
      x: cx - 16,
      y: cy - 16,
      img: getImg("puffLargeImg") as HTMLImageElement,
      vy: 0,
      age: 0,
      maxAge: 20,
    });
    setScaledTimeout(() => {
      state.current.puffs.push({
        x: cx - 16,
        y: cy - 16,
        img: getImg("puffSmallImg") as HTMLImageElement,
        vy: 0,
        age: 0,
        maxAge: 15,
      });
    }, 100);
    changeScore(SCORE_FLAP);
    state.current.floatingScores.push({
      x: cx,
      y: cy,
      vy: -1,
      amount: SCORE_FLAP,
      age: 0,
      maxAge: 60,
    });
    play("flapSfx");
  }

  let hit = false;

  // ─── AIRSHIP SHOOTING ─────────────────────────────────────────────────────
  for (let i = 0; i < state.current.airships.length; i++) {
    const a = state.current.airships[i];
    const bob =
      Math.sin(state.current.frameCount * AIRSHIP_BOB_FREQUENCY + a.bobOffset) *
      AIRSHIP_BOB_AMPLITUDE;
    const ay = a.baseY + bob;

    if (
      pointInRect(shotPoint, {
        x: a.x,
        y: ay,
        width: AIRSHIP_SIZE,
        height: AIRSHIP_SIZE,
      })
    ) {
      hit = true;

      state.current.airships.splice(i, 1);

      if (a.color === "green") {
        // drop a super powerup
        const t = SUPER_POWERUP_TYPES[Math.floor(Math.random() * SUPER_POWERUP_TYPES.length)];
        state.current.powerups.push({
          x: a.x,
          y: ay,
          img: powerupImgs[t],
          type: t,
        });
      } else {
        // red airship: spawn a napalm explosion
        spawnNapalmEllipse(a.x + AIRSHIP_SIZE / 2, ay + AIRSHIP_SIZE / 2, true);

        // and drop a negative powerup
        const bad = ANTI_POWERUP_TYPES[Math.floor(Math.random() * ANTI_POWERUP_TYPES.length)];
        state.current.powerups.push({
          x: a.x,
          y: ay,
          img: powerupImgs[bad],
          type: bad,
        });
      }

      break;
    }
  }

  // DUCK SHOOTING
  for (let i = 0; i < state.current.ducks.length; i++) {
    const d = state.current.ducks[i];
    const scale = state.current.isActive("megaducks", state.current.frameCount)
      ? DUCK_MAGNIFY_SCALE
      : state.current.isActive("ducksight", state.current.frameCount)
        ? DUCKSIGHT_MAGNIFY_SCALE
        : 1;
    // compute the scaled size
    const w = d.width * scale;
    const h = d.height * scale;
    // offset the box so it's still centered on the duck’s original center
    const offsetX = (w - d.width) / 2;
    const offsetY = (h - d.height) / 2;
    const bx = d.x - offsetX;
    const by = d.y - offsetY;

    if (!d.hit && pointInRect(shotPoint, { x: bx, y: by, width: w, height: h })) {
      play("duckSfx");

      changeScore(SCORE_DUCK);

      // update the duck state
      d.hit = true;
      d.fadeAge = 0;
      d.fadeMax = 60;
      d.targetImg = (getImg("duckTargetImgs") as HTMLImageElement[])[d.srcIdx];

      // update the next state
      state.current.floatingScores.push({
        x: d.x + d.width / 2,
        y: d.y + d.height / 2,
        vy: -1,
        amount: SCORE_DUCK,
        age: 0,
        maxAge: 60,
      });

      state.current.shotLakes.add(d.waterRef);

      state.current.duckCount += 1;

      // flag the hit
      hit = true;

      break;
    }
  }

  // POWERUP COLLECTION
  for (let i = 0; i < state.current.powerups.length; i++) {
    const p = state.current.powerups[i];
    if (!p.collected && pointInRect(shotPoint, { x: p.x, y: p.y, width: 128, height: 128 })) {
      p.collected = true;
      if (["bomb"].includes(p.type)) {
        // bomb powerup is instant
        play("bombSfx");

        state.current.activePowerups.bomb.expires = state.current.frameCount + 1;
      } else if (ANTI_POWERUP_TYPES.includes(p.type as AntiPowerupType)) {
        if (["sticky", "heavy", "windy", "turbulence", "blindfold"].includes(p.type)) {
          // sticky and heavy powerups expire at POWERUP_DURATION
          state.current.activePowerups[p.type].expires =
            state.current.frameCount + POWERUP_DURATION;
          if (p.type === "turbulence") {
            makeText("Turbulence!", 1, true, true, dims.width - 800, dims.height * 0.8, 120);
          } else if (p.type === "blindfold") {
            makeText("Blinded!", 1, true, true, dims.width - 800, dims.height * 0.8, 120);
          }
        } else {
          // other anti-powerups expire immediately
          state.current.activePowerups[p.type].expires = state.current.frameCount + 30;
        }
      } else if (p.type === "machineGuns") {
        state.current.activePowerups.machineGuns.expires =
          state.current.frameCount + POWERUP_DURATION;
        // reset burst count and cooldown
        state.current.burstRemaining = MACHINE_GUN_BURST_COUNT;
        state.current.burstCooldown = 0;
      } else if (p.type === "autoReload") {
        state.current.activePowerups.autoReload.expires =
          state.current.frameCount + POWERUP_DURATION;
        play("powerupSfx");
      } else if (p.type === "shrink") {
        state.current.activePowerups.shrink.expires = state.current.frameCount + POWERUP_DURATION;
        play("shrinkSfx");
      } else if (p.type === "freeze") {
        state.current.activePowerups.freeze.expires = state.current.frameCount + POWERUP_DURATION;
        play("freezeSfx");
      } else {
        state.current.activePowerups[p.type].expires = state.current.frameCount + POWERUP_DURATION;
        play("powerupSfx");
      }

      // special sound for skulls
      if (p.type === "skull") {
        play("skullSfx");

        // expire all powerups
        Object.keys(state.current.activePowerups).forEach((key) => {
          if (key === "skull") return; // skip skull
          state.current.activePowerups[key as PowerupType].expires = 0;
        });

        changeScore(-500);

        makeText("Skull! Lose 500", 1, true, true, dims.width - 800, dims.height * 0.8, 120);
      } else if (p.type === "gunjam") {
        state.current.activePowerups.gunjam.expires = state.current.frameCount + POWERUP_DURATION;

        changeScore(-SCORE_RELOAD);

        play("reloadSfx");

        makeText("Gunjam Lose 25", 1, true, true, dims.width - 800, dims.height * 0.8, 120);
        state.current.ammo = 0;
      }

      hit = true;
      state.current.powerups.splice(i, 1);
      break;
    }
  }

  // MEDAL PICKING
  for (let i = 0; i < state.current.medals.length; i++) {
    const m = state.current.medals[i];
    if (pointInRect(shotPoint, { x: m.x, y: m.y, width: MEDAL_SIZE, height: MEDAL_SIZE })) {
      play("medalSfx");

      changeScore(MEDAL_SCORE);

      state.current.floatingScores.push({
        x: m.x + MEDAL_SIZE / 2,
        y: m.y + MEDAL_SIZE / 2,
        vy: -1,
        amount: MEDAL_SCORE,
        age: 0,
        maxAge: 60,
      });
      state.current.medals.splice(i, 1);
      state.current.medalCount += 1;

      hit = true;

      break;
    }
  }

  const targetImg = (getImg("targetImgs") as HTMLImageElement[])[0];
  const targetWidth = targetImg.width;
  const targetHeight = targetImg.height;

  // ENEMY SHOOTING
  for (const e of state.current.enemies) {
    const targetYOffset = e.hasStick ? 0 : ENEMY_HEIGHT - targetHeight;

    if (
      e.alive &&
      e.hasStick &&
      !e.stickBroken &&
      pointInRect(shotPoint, {
        x: e.x + ENEMY_WIDTH / 2 - targetWidth / 2,
        y: e.y + targetYOffset,
        width: targetWidth,
        height: targetHeight,
      })
    ) {
      hit = true;
      e.stickBroken = true;
      e.targetHit = true;
      play("enemyHitSfx");
      changeScore(e.targetScore);

      // add a floating score
      state.current.floatingScores.push({
        x: e.x + ENEMY_WIDTH / 2,
        y: e.y + targetYOffset + targetHeight / 2,
        vy: -1,
        amount: e.targetScore,
        age: 0,
        maxAge: 60,
      });
    }

    if (
      !hit &&
      e.alive &&
      pointInRect(shotPoint, {
        x: e.x,
        y: e.y,
        width: ENEMY_WIDTH,
        height: ENEMY_HEIGHT,
      })
    ) {
      hit = true;
      e.alive = false;

      play("enemyHitSfx");

      changeScore(SCORE_HIT);

      const cxE = e.x + ENEMY_WIDTH / 2;
      const cyE = e.y + ENEMY_HEIGHT / 2;

      state.current.enemyCount += 1;

      // medal or powerup spawn
      if (Math.random() < ENEMY_MEDAL_SPAWN_PROB) {
        const medalId = Math.floor(Math.random() * 9);
        const medalFrames = getImg("medalFrames") as HTMLImageElement[][];
        const frames = medalFrames[medalId];
        state.current.medals.push({
          x: cxE - MEDAL_SIZE / 2,
          y: cyE - MEDAL_SIZE / 2,
          vx: -state.current.groundSpeed(),
          frames,
          frameIndex: 0,
          frameCounter: 0,
          frameDuration: 8 * (1000 / 60),
          id: medalId + 1,
        });
      } else if (Math.random() < 0.5) {
        const types: PowerupType[] = POWERUP_TYPES;
        let t =
          POWERUP_DEBUG.length > 0
            ? POWERUP_DEBUG[Math.floor(Math.random() * POWERUP_DEBUG.length)]
            : types[Math.floor(Math.random() * types.length)];

        // increase the chance of an anti-powerup
        // if the type is not an anti-powerup, randomly change it to one
        // with a 50% chance
        // this is to encourage players to avoid anti-powerups
        if (
          POWERUP_DEBUG.length === 0 &&
          !ANTI_POWERUP_TYPES.includes(t as AntiPowerupType) &&
          Math.random() < 0.5
        ) {
          t = ANTI_POWERUP_TYPES[Math.floor(Math.random() * ANTI_POWERUP_TYPES.length)];
        }

        state.current.powerups.push({
          x: cxE - 16,
          y: cyE - 16,
          img: powerupImgs[t],
          type: t,
        });
      }

      state.current.floatingScores.push({
        x: cxE,
        y: cyE,
        vy: -1,
        amount: SCORE_HIT,
        age: 0,
        maxAge: 60,
      });

      const explosionImgs = getImg("explosionImgs") as HTMLImageElement[];

      // crash effect
      const effect = Math.floor(Math.random() * 3);
      if (effect === 0) {
        for (let i = 0; i < SMOKE_TRAIL_COUNT; i++)
          setScaledTimeout(() => spawnCrashSmokeOne(cxE, cyE), i * 100);
      } else if (effect === 1) {
        const size = 32 * 3;
        explosionImgs.forEach((img, idx) =>
          setScaledTimeout(
            () =>
              state.current.puffs.push({
                x: cxE - 16,
                y: cyE - 16,
                img,
                vy: 0,
                age: 0,
                maxAge: 10,
                size,
              }),
            idx * 50,
          ),
        );
      } else {
        state.current.puffs.push({
          x: cxE - 48,
          y: cyE - 48,
          img: explosionImgs[0],
          vy: 0,
          age: 0,
          maxAge: 10,
          size: 32 * 3,
        });
        state.current.falling.push({
          x: e.x,
          y: e.y,
          vy: 0,
          img: e.frames[0],
        });
      }
      break;
    }
  }

  // MISS → bullet hole & penalty
  if (!hit && !didFlap) {
    changeScore(-25);
    state.current.streak = 0;
    state.current.bulletHoles.push({ x: sx, y: sy, age: 0, maxAge: 180 });
  }

  // STREAK pop-up
  if (hit || didFlap) {
    state.current.streak += 1;

    if (state.current.streak >= MIN_STREAK) {
      makeText(
        `Streak: ${state.current.streak}`,
        1,
        true,
        true,
        dims.width - 800,
        16 + 2 * SCORE_DIGIT_HEIGHT + 8,
        120,
      );
    }
  }
}
