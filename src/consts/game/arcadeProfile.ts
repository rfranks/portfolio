import type { ArcadeGameId, ArcadeUnlockId } from "@/types/game/arcadeProfile";

export const ARCADE_PROFILE_STORAGE_KEY = "portfolio.arcade.profile.v1";

export const ARCADE_PROFILE_VERSION = 1 as const;

export const ARCADE_GAME_LABELS: Record<ArcadeGameId, string> = {
  warbirds: "Warbirds",
  zombiefish: "Zombiefish",
  blasteroids: "Blasteroids",
};

export const ARCADE_UNLOCK_DEFINITIONS: Record<
  ArcadeUnlockId,
  { description: string; label: string }
> = {
  first_sortie: {
    label: "First Sortie",
    description: "Play any arcade game at least once.",
  },
  triple_threat: {
    label: "Triple Threat",
    description: "Play Warbirds, Zombiefish, and Blasteroids.",
  },
  medal_hunter: {
    label: "Medal Hunter",
    description: "Collect 25 medals across arcade sessions.",
  },
  score_chaser: {
    label: "Score Chaser",
    description: "Earn 25,000 lifetime score across arcade games.",
  },
  marathon_mode: {
    label: "Marathon Mode",
    description: "Play for a total of 30 minutes.",
  },
  ace_pilot: {
    label: "Ace Pilot",
    description: "Reach a 7,500 score in Warbirds.",
  },
  skeletal_sniper: {
    label: "Skeletal Sniper",
    description: "Hit 75% accuracy in Zombiefish.",
  },
  asteroid_vanguard: {
    label: "Asteroid Vanguard",
    description: "Reach a 4,000 score in Blasteroids.",
  },
};

export const ARCADE_SCORE_TO_MEDALS: Record<
  ArcadeGameId,
  { bronze: number; gold: number; silver: number }
> = {
  warbirds: { bronze: 1200, silver: 3000, gold: 6000 },
  zombiefish: { bronze: 250, silver: 650, gold: 1200 },
  blasteroids: { bronze: 1200, silver: 2800, gold: 5000 },
};
