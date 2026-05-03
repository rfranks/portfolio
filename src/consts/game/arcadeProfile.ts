import type {
  ArcadeDailyChallenge,
  ArcadeDailyChallengeId,
  ArcadeGameId,
  ArcadeUnlockId,
} from "@/types/game/arcadeProfile";
import { portfolioApps } from "@/consts/resumeData";

export const ARCADE_PROFILE_STORAGE_KEY = "portfolio.arcade.profile.v1";

export const ARCADE_PROFILE_VERSION = 2 as const;

const ARCADE_GAME_ROUTE_KEY_BY_ID = {
  warbirds: "warbirds",
  zombiefish: "zombiefish",
  blasteroids: "blasteroids",
  blackjack: "blackjack",
} as const satisfies Record<ArcadeGameId, "warbirds" | "zombiefish" | "blasteroids" | "blackjack">;

export const ARCADE_GAME_LABELS: Record<ArcadeGameId, string> = Object.fromEntries(
  Object.entries(ARCADE_GAME_ROUTE_KEY_BY_ID).map(([gameId, routeKey]) => [
    gameId,
    portfolioApps[routeKey].documentTitle,
  ]),
) as Record<ArcadeGameId, string>;

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
    description: `Play ${ARCADE_GAME_LABELS.warbirds}, ${ARCADE_GAME_LABELS.zombiefish}, and ${ARCADE_GAME_LABELS.blasteroids}.`,
  },
  arcade_polyglot: {
    label: "Arcade Polyglot",
    description: `Play all four arcade apps, including ${ARCADE_GAME_LABELS.blackjack}.`,
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
    description: `Reach a 7,500 score in ${ARCADE_GAME_LABELS.warbirds}.`,
  },
  skeletal_sniper: {
    label: "Skeletal Sniper",
    description: `Hit 75% accuracy in ${ARCADE_GAME_LABELS.zombiefish}.`,
  },
  asteroid_vanguard: {
    label: "Asteroid Vanguard",
    description: `Reach a 4,000 score in ${ARCADE_GAME_LABELS.blasteroids}.`,
  },
  high_roller: {
    label: "High Roller",
    description: `Earn 300+ score in a ${ARCADE_GAME_LABELS.blackjack} round.`,
  },
  daily_dedication: {
    label: "Daily Dedication",
    description: "Complete your active daily challenge.",
  },
  streak_apprentice: {
    label: "Streak Apprentice",
    description: "Maintain a 3-day arcade streak.",
  },
  streak_veteran: {
    label: "Streak Veteran",
    description: "Maintain a 7-day arcade streak.",
  },
};

export const ARCADE_SCORE_TO_MEDALS: Record<
  ArcadeGameId,
  { bronze: number; gold: number; silver: number }
> = {
  warbirds: { bronze: 1200, silver: 3000, gold: 6000 },
  zombiefish: { bronze: 250, silver: 650, gold: 1200 },
  blasteroids: { bronze: 1200, silver: 2800, gold: 5000 },
  blackjack: { bronze: 75, silver: 200, gold: 400 },
};

type ArcadeDailyChallengeDefinition = Pick<
  ArcadeDailyChallenge,
  "description" | "gameId" | "id" | "label" | "metric" | "target"
>;

export const ARCADE_DAILY_CHALLENGE_DEFINITIONS: Record<
  ArcadeDailyChallengeId,
  ArcadeDailyChallengeDefinition
> = {
  arcade_any_session: {
    id: "arcade_any_session",
    gameId: "any",
    metric: "sessionsPlayed",
    target: 1,
    label: "Warm-Up Session",
    description: "Play any arcade game once today.",
  },
  arcade_medal_sweep: {
    id: "arcade_medal_sweep",
    gameId: "any",
    metric: "medalsCollected",
    target: 2,
    label: "Medal Sweep",
    description: "Collect two medals across arcade sessions today.",
  },
  warbirds_high_sortie: {
    id: "warbirds_high_sortie",
    gameId: "warbirds",
    metric: "score",
    target: 3200,
    label: `${ARCADE_GAME_LABELS.warbirds} High Sortie`,
    description: `Score at least 3,200 points in a single ${ARCADE_GAME_LABELS.warbirds} run.`,
  },
  zombiefish_precision: {
    id: "zombiefish_precision",
    gameId: "zombiefish",
    metric: "accuracyPct",
    target: 70,
    label: `${ARCADE_GAME_LABELS.zombiefish} Precision`,
    description: `Reach 70% accuracy in a ${ARCADE_GAME_LABELS.zombiefish} session.`,
  },
  blasteroids_vanguard: {
    id: "blasteroids_vanguard",
    gameId: "blasteroids",
    metric: "score",
    target: 2800,
    label: `${ARCADE_GAME_LABELS.blasteroids} Vanguard`,
    description: `Score at least 2,800 points in ${ARCADE_GAME_LABELS.blasteroids}.`,
  },
  blackjack_hot_hand: {
    id: "blackjack_hot_hand",
    gameId: "blackjack",
    metric: "score",
    target: 180,
    label: `${ARCADE_GAME_LABELS.blackjack} Hot Hand`,
    description: `Finish a ${ARCADE_GAME_LABELS.blackjack} round with +180 or more net score.`,
  },
};

export const ARCADE_DAILY_CHALLENGE_ROTATION: ArcadeDailyChallengeId[] = [
  "arcade_any_session",
  "warbirds_high_sortie",
  "zombiefish_precision",
  "blackjack_hot_hand",
  "arcade_medal_sweep",
  "blasteroids_vanguard",
];
