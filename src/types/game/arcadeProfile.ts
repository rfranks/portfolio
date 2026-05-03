export const ARCADE_GAME_IDS = ["warbirds", "zombiefish", "blasteroids", "blackjack"] as const;

export type ArcadeGameId = (typeof ARCADE_GAME_IDS)[number];

export type ArcadeUnlockId =
  | "first_sortie"
  | "triple_threat"
  | "arcade_polyglot"
  | "medal_hunter"
  | "score_chaser"
  | "marathon_mode"
  | "ace_pilot"
  | "skeletal_sniper"
  | "asteroid_vanguard"
  | "high_roller"
  | "daily_dedication"
  | "streak_apprentice"
  | "streak_veteran";

export type ArcadeDailyChallengeId =
  | "arcade_any_session"
  | "arcade_medal_sweep"
  | "warbirds_high_sortie"
  | "zombiefish_precision"
  | "blasteroids_vanguard"
  | "blackjack_hot_hand";

export type ArcadeDailyChallengeMetric =
  | "sessionsPlayed"
  | "score"
  | "accuracyPct"
  | "medalsCollected"
  | "bestStreak";

export type ArcadeDailyChallenge = {
  completedAt: string | null;
  dateKey: string;
  description: string;
  gameId: ArcadeGameId | "any";
  id: ArcadeDailyChallengeId;
  label: string;
  metric: ArcadeDailyChallengeMetric;
  progress: number;
  target: number;
};

export type ArcadePlayStreak = {
  bestDays: number;
  currentDays: number;
  lastPlayedDateKey: string | null;
};

export type ArcadePersonalBests = {
  bestSessionAccuracyPct: number;
  bestSessionMedals: number;
  bestSessionScore: number;
  bestSessionStreak: number;
  longestSessionMs: number;
};

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
  dailyChallenge: ArcadeDailyChallenge;
  games: Record<ArcadeGameId, ArcadeGameProfile>;
  lifetime: {
    medalsCollected: number;
    sessionsCompleted: number;
    sessionsPlayed: number;
    totalPlayMs: number;
    totalScore: number;
  };
  personalBests: ArcadePersonalBests;
  streak: ArcadePlayStreak;
  unlocks: Partial<Record<ArcadeUnlockId, string>>;
  updatedAt: string;
  version: 2;
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
