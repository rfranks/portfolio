import { TANK_EXPLOSION_SRC } from "@/consts/game/effects";
import { GROUND_VARIANTS, ROCK_SRCS, TREE_SOURCES, WATER_SRCS } from "@/consts/game/environment";
import { DUCK_OUTLINE_SRCS, DUCK_SRCS, DUCK_TARGET_SRCS } from "@/consts/game/objects";
import { NAPALM_FLAME_FRAME_SRCS, NAPALM_MISSILE_SRC, POWERUP_TYPES } from "@/consts/game/powerups";
import { SCORE_DIGIT_PATH } from "@/consts/game/ui";
import { AIRSHIP_COLORS, ENEMY_COLORS } from "@/consts/game/vehicles";
import type { PowerupType } from "@/types/game/objects";
import type { AssetImageSpec } from "@/utils/game/assetManifest";
import {
  resolveWarbirdsPowerupAssetPath,
  resolveWarbirdsPowerupFallbackAssetPaths,
} from "../_utils/powerupSprites";

type WarbirdsAssetManifest = {
  airshipFramesByColor: Record<string, readonly AssetImageSpec[]>;
  artilleryImg: AssetImageSpec;
  blackSmokeImgs: readonly AssetImageSpec[];
  brokenStickImg: AssetImageSpec;
  bulletHoleImg: AssetImageSpec;
  cannonballImg: AssetImageSpec;
  digitImgsByChar: Record<string, AssetImageSpec>;
  duckImgs: readonly AssetImageSpec[];
  duckOutlineImgs: readonly AssetImageSpec[];
  duckTargetImgs: readonly AssetImageSpec[];
  enemyImgs: readonly AssetImageSpec[];
  enemyFramesByBaseColor: Record<string, readonly AssetImageSpec[]>;
  explosionImgs: readonly AssetImageSpec[];
  fireImgs: readonly AssetImageSpec[];
  flameImgs: readonly AssetImageSpec[];
  groundImgs: readonly AssetImageSpec[];
  homingImg: AssetImageSpec;
  letterImgsByChar: Record<string, AssetImageSpec>;
  medalFrames: ReadonlyArray<readonly AssetImageSpec[]>;
  napalmImg: AssetImageSpec;
  numberImgsByChar: Record<string, AssetImageSpec>;
  planeFrames: readonly AssetImageSpec[];
  plusImg: AssetImageSpec;
  powerupImgsByType: Record<PowerupType, AssetImageSpec>;
  puffLargeImg: AssetImageSpec;
  puffSmallImg: AssetImageSpec;
  rockImgs: readonly AssetImageSpec[];
  shieldImg: AssetImageSpec;
  sparkImgs: readonly AssetImageSpec[];
  laserBeamImgs: readonly AssetImageSpec[];
  stickImg: AssetImageSpec;
  targetImgs: readonly AssetImageSpec[];
  treeImgs: readonly AssetImageSpec[];
  waterImgs: readonly AssetImageSpec[];
  whitePuffImgs: readonly AssetImageSpec[];
};

function rangeAsStrings(fromInclusive: number, toInclusive: number): string[] {
  const values: string[] = [];
  for (let value = fromInclusive; value <= toInclusive; value += 1) {
    values.push(String(value));
  }
  return values;
}

function buildDigitManifest(): Record<string, AssetImageSpec> {
  return Object.fromEntries(
    rangeAsStrings(0, 9).map((digit) => [digit, `${SCORE_DIGIT_PATH}${digit}.png`]),
  );
}

function buildLetterManifest(): Record<string, AssetImageSpec> {
  const letters: Record<string, AssetImageSpec> = {};
  for (let charCode = 65; charCode <= 90; charCode += 1) {
    const letter = String.fromCharCode(charCode);
    letters[letter] = `/assets/tappyplane/PNG/Letters/letter${letter}.png`;
  }
  return letters;
}

function buildNumberManifest(): Record<string, AssetImageSpec> {
  return Object.fromEntries(
    rangeAsStrings(0, 9).map((numberChar) => [
      numberChar,
      `/assets/tappyplane/PNG/Numbers/number${numberChar}.png`,
    ]),
  );
}

function buildMedalFramesManifest(): ReadonlyArray<readonly AssetImageSpec[]> {
  return Array.from({ length: 9 }, (_, index) => {
    const medalIndex = index + 1;
    return [
      `/assets/medals/PNG/flat_medal${medalIndex}.png`,
      `/assets/medals/PNG/flatshadow_medal${medalIndex}.png`,
      `/assets/medals/PNG/shaded_medal${medalIndex}.png`,
    ] satisfies readonly AssetImageSpec[];
  });
}

function buildEnemyFramesManifest(): Record<string, readonly AssetImageSpec[]> {
  return Object.fromEntries(
    ENEMY_COLORS.map((baseSrc) => [
      baseSrc,
      [1, 2, 3].map((index) => baseSrc.replace(/1\.png$/, `${index}.png`)),
    ]),
  );
}

function buildAirshipFramesManifest(): Record<string, readonly AssetImageSpec[]> {
  return Object.fromEntries(
    AIRSHIP_COLORS.map((color) => [
      color,
      [1, 2, 3].map((index) => `/assets/airships/airship_${color}_${index}.png`),
    ]),
  );
}

function buildPowerupManifest(): Record<PowerupType, AssetImageSpec> {
  const manifest = {} as Record<PowerupType, AssetImageSpec>;
  POWERUP_TYPES.forEach((type) => {
    manifest[type] = {
      src: resolveWarbirdsPowerupAssetPath(type),
      fallbackSrcs: resolveWarbirdsPowerupFallbackAssetPaths(type),
    };
  });
  return manifest;
}

export function createWarbirdsAssetManifest(): WarbirdsAssetManifest {
  return {
    airshipFramesByColor: buildAirshipFramesManifest(),
    artilleryImg: "/assets/tanks/PNG/Retina/tank_bulletFly6.png",
    blackSmokeImgs: Array.from({ length: 25 }, (_, index) => {
      const suffix = String(index).padStart(2, "0");
      return `/assets/smoke/PNG/Black smoke/blackSmoke${suffix}.png`;
    }),
    brokenStickImg: "/assets/shooting-gallery/PNG/Objects/stick_wood_broken.png",
    bulletHoleImg: "/assets/shooting-gallery/PNG/Objects/shot_brown_large.png",
    cannonballImg: "/assets/pirates/PNG/Retina/Ship parts/cannonBall.png",
    digitImgsByChar: buildDigitManifest(),
    duckImgs: DUCK_SRCS,
    duckOutlineImgs: DUCK_OUTLINE_SRCS,
    duckTargetImgs: DUCK_TARGET_SRCS,
    enemyImgs: ENEMY_COLORS,
    enemyFramesByBaseColor: buildEnemyFramesManifest(),
    explosionImgs: TANK_EXPLOSION_SRC,
    fireImgs: [
      "/assets/pirates/PNG/Retina/Effects/fire1.png",
      "/assets/pirates/PNG/Retina/Effects/fire2.png",
    ],
    flameImgs: NAPALM_FLAME_FRAME_SRCS,
    groundImgs: GROUND_VARIANTS,
    homingImg: "/assets/tanks/PNG/Retina/tank_bullet3.png",
    letterImgsByChar: buildLetterManifest(),
    medalFrames: buildMedalFramesManifest(),
    napalmImg: NAPALM_MISSILE_SRC,
    numberImgsByChar: buildNumberManifest(),
    planeFrames: [1, 2, 3].map((index) => `/assets/tappyplane/PNG/Planes/planeYellow${index}.png`),
    plusImg: "/assets/shooting-gallery/PNG/HUD/text_plus_small.png",
    powerupImgsByType: buildPowerupManifest(),
    puffLargeImg: "/assets/tappyplane/PNG/puffLarge.png",
    puffSmallImg: "/assets/tappyplane/PNG/puffSmall.png",
    rockImgs: ROCK_SRCS,
    shieldImg: "/assets/particles/PNG (Transparent)/circle_03.png",
    sparkImgs: Array.from(
      { length: 7 },
      (_, index) => `/assets/particles/PNG (Transparent)/spark_0${index + 1}.png`,
    ),
    laserBeamImgs: [
      "/assets/space-shooter-redux/PNG/Lasers/laserRed04.png",
      "/assets/space-shooter-redux/PNG/Lasers/laserRed04.png",
    ],
    stickImg: "/assets/shooting-gallery/PNG/Objects/stick_wood.png",
    targetImgs: [
      "/assets/shooting-gallery/PNG/Objects/target_red1.png",
      "/assets/shooting-gallery/PNG/Objects/target_red2.png",
      "/assets/shooting-gallery/PNG/Objects/target_red3.png",
    ],
    treeImgs: TREE_SOURCES,
    waterImgs: WATER_SRCS,
    whitePuffImgs: Array.from({ length: 25 }, (_, index) => {
      const suffix = String(index).padStart(2, "0");
      return `/assets/smoke/PNG/White puff/whitePuff${suffix}.png`;
    }),
  };
}
