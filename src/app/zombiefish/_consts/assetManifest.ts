import type { AssetImageSpec } from "@/utils/game/assetManifest";

type SpriteSheetManifest = {
  src: AssetImageSpec;
  frameSize: number;
  fishCoordsByKind: Record<string, readonly [number, number][]>;
  skeletonCoordsByKind: Record<string, readonly [number, number][]>;
};

type ZombiefishAssetManifest = {
  spritesheet: SpriteSheetManifest;
  fishImgsByType: Record<string, AssetImageSpec>;
  fishFlashImg: AssetImageSpec;
  bubbleImgsByType: Record<string, AssetImageSpec>;
  seaGrassImgsByType: Record<string, AssetImageSpec>;
  seaweedImgsByType: Record<string, AssetImageSpec>;
  surfaceImgs: readonly AssetImageSpec[];
  cloudImgs: readonly AssetImageSpec[];
  terrainDirtImgsByType: Record<string, AssetImageSpec>;
  terrainSandImgsByType: Record<string, AssetImageSpec>;
  terrainWaterImgsByType: Record<string, AssetImageSpec>;
  digitImgsByChar: Record<string, AssetImageSpec>;
  letterImgsByChar: Record<string, AssetImageSpec>;
  dotImg: AssetImageSpec;
  pctImg: AssetImageSpec;
  plusImg: AssetImageSpec;
};

function rangeAsStrings(fromInclusive: number, toInclusive: number): string[] {
  const values: string[] = [];
  for (let value = fromInclusive; value <= toInclusive; value += 1) {
    values.push(String(value));
  }
  return values;
}

function buildFishTypeManifest(): Record<string, AssetImageSpec> {
  const fishTypes = [
    "blue",
    "brown",
    "brown_outline",
    "green",
    "grey",
    "grey_long_a",
    "grey_long_a_outline",
    "grey_long_b",
    "grey_long_b_outline",
    "orange",
    "pink",
    "red",
  ];

  return Object.fromEntries(
    fishTypes.map((name) => [name, `/assets/fish/PNG/Objects/Fish/fish_${name}.png`]),
  );
}

function buildSeaweedManifest(): Record<string, AssetImageSpec> {
  const names: string[] = [];

  "abcd".split("").forEach((letter) => {
    names.push(`seaweed_green_${letter}`);
    names.push(`seaweed_green_${letter}_outline`);
  });

  "ab".split("").forEach((letter) => {
    names.push(`seaweed_orange_${letter}`);
    names.push(`seaweed_orange_${letter}_outline`);
  });

  "abcd".split("").forEach((letter) => {
    names.push(`seaweed_pink_${letter}`);
    names.push(`seaweed_pink_${letter}_outline`);
  });

  return Object.fromEntries(
    names.map((name) => [name, `/assets/fish/PNG/Objects/Seaweed/${name}.png`]),
  );
}

function buildTerrainManifest(folder: "Dirt" | "Sand"): Record<string, AssetImageSpec> {
  const topLetters = "abcdefgh".split("");
  const baseNames = [
    `terrain_${folder.toLowerCase()}_a`,
    `terrain_${folder.toLowerCase()}_b`,
    `terrain_${folder.toLowerCase()}_c`,
    `terrain_${folder.toLowerCase()}_d`,
  ];

  const topNames = topLetters.flatMap((letter) => [
    `terrain_${folder.toLowerCase()}_top_${letter}`,
    `terrain_${folder.toLowerCase()}_top_${letter}_outline`,
  ]);

  return Object.fromEntries(
    [...baseNames, ...topNames].map((name) => [
      name,
      `/assets/fish/PNG/Terrain/${folder}/${name}.png`,
    ]),
  );
}

function buildDigitManifest(): Record<string, AssetImageSpec> {
  const entries = rangeAsStrings(0, 9).map((digit) => [
    digit,
    `/assets/fish/PNG/HUDText/hud_number_${digit}.png`,
  ]);

  entries.push([":", "/assets/fish/PNG/HUDText/hud_colon.png"]);
  return Object.fromEntries(entries);
}

function buildLetterManifest(): Record<string, AssetImageSpec> {
  const letters: Record<string, AssetImageSpec> = {};
  for (let charCode = 65; charCode <= 90; charCode += 1) {
    const letter = String.fromCharCode(charCode);
    letters[letter] = `/assets/tappyplane/PNG/Letters/letter${letter}.png`;
  }
  return letters;
}

export function createZombiefishAssetManifest(): ZombiefishAssetManifest {
  return {
    spritesheet: {
      src: "/assets/fish/Spritesheet/spritesheet.png",
      frameSize: 128,
      fishCoordsByKind: {
        blue: [[1152, 256]],
        brown: [[1024, 1280]],
        green: [[1024, 1024]],
        grey: [[1024, 512]],
        grey_long_a: [[1024, 384]],
        grey_long_b: [[1024, 128]],
        orange: [[896, 1280]],
        pink: [[896, 768]],
        red: [[896, 256]],
      },
      skeletonCoordsByKind: {
        blue: [[1152, 0]],
        green: [[1024, 768]],
        orange: [[896, 1024]],
        pink: [[896, 512]],
        red: [[896, 0]],
      },
    },
    fishImgsByType: buildFishTypeManifest(),
    fishFlashImg: "/assets/smoke/PNG/Flash/flash00.png",
    bubbleImgsByType: {
      bubble_a: "/assets/fish/PNG/Objects/Bubbles/bubble_a.png",
      bubble_b: "/assets/fish/PNG/Objects/Bubbles/bubble_b.png",
      bubble_c: "/assets/fish/PNG/Objects/Bubbles/bubble_c.png",
    },
    seaGrassImgsByType: {
      seaweed_grass_a: "/assets/fish/PNG/Objects/SeaGrass/seaweed_grass_a.png",
      seaweed_grass_a_outline: "/assets/fish/PNG/Objects/SeaGrass/seaweed_grass_a_outline.png",
      seaweed_grass_b: "/assets/fish/PNG/Objects/SeaGrass/seaweed_grass_b.png",
      seaweed_grass_b_outline: "/assets/fish/PNG/Objects/SeaGrass/seaweed_grass_b_outline.png",
    },
    seaweedImgsByType: buildSeaweedManifest(),
    surfaceImgs: [
      "/assets/shooting-gallery/PNG/Stall/water1.png",
      "/assets/shooting-gallery/PNG/Stall/water2.png",
    ],
    cloudImgs: [
      "/assets/shooting-gallery/PNG/Stall/cloud1.png",
      "/assets/shooting-gallery/PNG/Stall/cloud2.png",
    ],
    terrainDirtImgsByType: buildTerrainManifest("Dirt"),
    terrainSandImgsByType: buildTerrainManifest("Sand"),
    terrainWaterImgsByType: {
      water_terrain: "/assets/fish/PNG/Terrain/Water/water_terrain.png",
      water_terrain_top: "/assets/fish/PNG/Terrain/Water/water_terrain_top.png",
    },
    digitImgsByChar: buildDigitManifest(),
    letterImgsByChar: buildLetterManifest(),
    dotImg: "/assets/fish/PNG/HUDText/hud_dot.png",
    pctImg: "/assets/fish/PNG/HUDText/hud_percent.png",
    plusImg: "/assets/fish/PNG/HUDText/hud_plus.png",
  };
}
