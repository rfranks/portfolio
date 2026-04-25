export const ARCADE_GAME_IDS = ["warbirds", "zombiefish", "blasteroids"] as const;

export type ArcadeGameId = (typeof ARCADE_GAME_IDS)[number];

export type ArcadeUnlockId =
  | "first_sortie"
  | "triple_threat"
  | "medal_hunter"
  | "score_chaser"
  | "marathon_mode"
  | "ace_pilot"
  | "skeletal_sniper"
  | "asteroid_vanguard";

export type ArcadeStatMap = Record<string, number>;

export type ArcadeGameProfile = {
  bestScore: number;
  highestAccuracyPct: number;
  lastPlayedAt: string | null;
  medalsCollected: number;
  sessionsCompleted: number;
  sessionsPlayed: number;
  stats: ArcadeStatMap;
  totalPlayMs: number;
  totalScore: number;
};

export type ArcadeProfile = {
  games: Record<ArcadeGameId, ArcadeGameProfile>;
  lifetime: {
    medalsCollected: number;
    sessionsCompleted: number;
    sessionsPlayed: number;
    totalPlayMs: number;
    totalScore: number;
  };
  unlocks: Partial<Record<ArcadeUnlockId, string>>;
  updatedAt: string;
  version: 1;
};

export type ArcadeSessionResult = {
  accuracyPct?: number;
  completed?: boolean;
  durationMs?: number;
  finishedAtMs?: number;
  medalsCollected?: number;
  score?: number;
  stats?: ArcadeStatMap;
};
