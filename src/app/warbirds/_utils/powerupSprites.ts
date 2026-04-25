import type { PowerupType } from "@/types/game/objects";

const POWERUP_ASSET_FILE_OVERRIDES: Partial<Record<PowerupType, string>> = {
  coin2x: "coin_2x",
  infiniteAmmo: "infinite_ammo",
  machineGuns: "machine_guns",
  shrink: "shrink_effect",
};

const POWERUP_DEFAULT_FALLBACK_ASSET_FILE = "shield";
const POWERUP_FALLBACK_ASSET_FILES = [POWERUP_DEFAULT_FALLBACK_ASSET_FILE, "hourglass", "bomb"];

const toPowerupAssetPath = (assetFile: string) => `/assets/powerups/${assetFile}.png`;

export const WARBIRDS_POWERUP_DEFAULT_FALLBACK_ASSET_PATH = toPowerupAssetPath(
  POWERUP_DEFAULT_FALLBACK_ASSET_FILE,
);

export function resolveWarbirdsPowerupAssetFile(type: PowerupType): string {
  return POWERUP_ASSET_FILE_OVERRIDES[type] ?? type;
}

export function resolveWarbirdsPowerupAssetPath(type: PowerupType): string {
  return toPowerupAssetPath(resolveWarbirdsPowerupAssetFile(type));
}

export function resolveWarbirdsPowerupFallbackAssetPaths(type: PowerupType): string[] {
  const primaryAssetFile = resolveWarbirdsPowerupAssetFile(type);
  const uniqueFallbackFiles = new Set<string>();

  POWERUP_FALLBACK_ASSET_FILES.forEach((assetFile) => {
    if (assetFile !== primaryAssetFile) {
      uniqueFallbackFiles.add(assetFile);
    }
  });

  return Array.from(uniqueFallbackFiles).map(toPowerupAssetPath);
}
