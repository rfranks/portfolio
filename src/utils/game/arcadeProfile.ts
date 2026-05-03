"use client";

import {
  ARCADE_DAILY_CHALLENGE_DEFINITIONS,
  ARCADE_DAILY_CHALLENGE_ROTATION,
  ARCADE_GAME_LABELS,
  ARCADE_PROFILE_STORAGE_KEY,
  ARCADE_PROFILE_VERSION,
  ARCADE_SCORE_TO_MEDALS,
  ARCADE_UNLOCK_DEFINITIONS,
} from "@/consts/game/arcadeProfile";
import {
  ARCADE_GAME_IDS,
  type ArcadeDailyChallenge,
  type ArcadeDailyChallengeId,
  type ArcadeGameId,
  type ArcadeGameProfile,
  type ArcadePersonalBests,
  type ArcadePlayStreak,
  type ArcadeProfile,
  type ArcadeSessionResult,
  type ArcadeStatMap,
} from "@/types/game/arcadeProfile";

const DAY_MS = 24 * 60 * 60 * 1000;

const EMPTY_GAME_PROFILE: ArcadeGameProfile = {
  bestScore: 0,
  highestAccuracyPct: 0,
  lastPlayedAt: null,
  medalsCollected: 0,
  sessionsCompleted: 0,
  sessionsPlayed: 0,
  stats: {},
  totalPlayMs: 0,
  totalScore: 0,
};

const EMPTY_PLAY_STREAK: ArcadePlayStreak = {
  bestDays: 0,
  currentDays: 0,
  lastPlayedDateKey: null,
};

const EMPTY_PERSONAL_BESTS: ArcadePersonalBests = {
  bestSessionAccuracyPct: 0,
  bestSessionMedals: 0,
  bestSessionScore: 0,
  bestSessionStreak: 0,
  longestSessionMs: 0,
};

const TRIPLE_THREAT_GAME_IDS: ArcadeGameId[] = ["warbirds", "zombiefish", "blasteroids"];

const cloneGameProfile = (gameProfile: ArcadeGameProfile): ArcadeGameProfile => ({
  ...gameProfile,
  stats: { ...gameProfile.stats },
});

const cloneGames = (
  games: Record<ArcadeGameId, ArcadeGameProfile>,
): Record<ArcadeGameId, ArcadeGameProfile> =>
  ARCADE_GAME_IDS.reduce(
    (acc, gameId) => {
      acc[gameId] = cloneGameProfile(games[gameId]);
      return acc;
    },
    {} as Record<ArcadeGameId, ArcadeGameProfile>,
  );

const cloneDailyChallenge = (dailyChallenge: ArcadeDailyChallenge): ArcadeDailyChallenge => ({
  ...dailyChallenge,
});

const clonePlayStreak = (streak: ArcadePlayStreak): ArcadePlayStreak => ({
  ...streak,
});

const clonePersonalBests = (personalBests: ArcadePersonalBests): ArcadePersonalBests => ({
  ...personalBests,
});

const cloneProfile = (profile: ArcadeProfile): ArcadeProfile => ({
  ...profile,
  games: cloneGames(profile.games),
  lifetime: { ...profile.lifetime },
  dailyChallenge: cloneDailyChallenge(profile.dailyChallenge),
  streak: clonePlayStreak(profile.streak),
  personalBests: clonePersonalBests(profile.personalBests),
  unlocks: { ...profile.unlocks },
});

export const isArcadeGameId = (value: string): value is ArcadeGameId =>
  (ARCADE_GAME_IDS as readonly string[]).includes(value);

const toFiniteNonNegative = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, value);
};

const toBoundedPct = (value: unknown): number => Math.min(100, toFiniteNonNegative(value));

const formatDatePart = (value: number): string => value.toString().padStart(2, "0");

const toLocalDateKeyFromMs = (timeMs: number): string => {
  const date = new Date(timeMs);
  return `${date.getFullYear()}-${formatDatePart(date.getMonth() + 1)}-${formatDatePart(date.getDate())}`;
};

const parseDateKeyToMs = (dateKey: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day).getTime();
};

const getDateKeyDiffDays = (fromDateKey: string, toDateKey: string): number | null => {
  const fromMs = parseDateKeyToMs(fromDateKey);
  const toMs = parseDateKeyToMs(toDateKey);
  if (fromMs === null || toMs === null) {
    return null;
  }
  return Math.round((toMs - fromMs) / DAY_MS);
};

const getChallengeRotationSeed = (dateKey: string): number =>
  dateKey.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);

const resolveDailyChallengeIdForDate = (dateKey: string): ArcadeDailyChallengeId => {
  const seed = getChallengeRotationSeed(dateKey);
  return ARCADE_DAILY_CHALLENGE_ROTATION[seed % ARCADE_DAILY_CHALLENGE_ROTATION.length];
};

const createDailyChallengeForDate = (dateKey: string): ArcadeDailyChallenge => {
  const challengeId = resolveDailyChallengeIdForDate(dateKey);
  const challengeDefinition = ARCADE_DAILY_CHALLENGE_DEFINITIONS[challengeId];
  return {
    ...challengeDefinition,
    dateKey,
    progress: 0,
    completedAt: null,
  };
};

const createEmptyArcadeGames = (): Record<ArcadeGameId, ArcadeGameProfile> =>
  ARCADE_GAME_IDS.reduce(
    (acc, gameId) => {
      acc[gameId] = cloneGameProfile(EMPTY_GAME_PROFILE);
      return acc;
    },
    {} as Record<ArcadeGameId, ArcadeGameProfile>,
  );

const sanitizePlayStreak = (value: unknown): ArcadePlayStreak => {
  if (!value || typeof value !== "object") {
    return clonePlayStreak(EMPTY_PLAY_STREAK);
  }
  const candidate = value as Partial<ArcadePlayStreak>;
  return {
    currentDays: Math.floor(toFiniteNonNegative(candidate.currentDays)),
    bestDays: Math.floor(toFiniteNonNegative(candidate.bestDays)),
    lastPlayedDateKey:
      typeof candidate.lastPlayedDateKey === "string" &&
      parseDateKeyToMs(candidate.lastPlayedDateKey) !== null
        ? candidate.lastPlayedDateKey
        : null,
  };
};

const sanitizePersonalBests = (value: unknown): ArcadePersonalBests => {
  if (!value || typeof value !== "object") {
    return clonePersonalBests(EMPTY_PERSONAL_BESTS);
  }
  const candidate = value as Partial<ArcadePersonalBests>;
  return {
    bestSessionScore: toFiniteNonNegative(candidate.bestSessionScore),
    bestSessionAccuracyPct: toBoundedPct(candidate.bestSessionAccuracyPct),
    bestSessionMedals: toFiniteNonNegative(candidate.bestSessionMedals),
    longestSessionMs: toFiniteNonNegative(candidate.longestSessionMs),
    bestSessionStreak: toFiniteNonNegative(candidate.bestSessionStreak),
  };
};

const sanitizeDailyChallenge = (value: unknown, nowDateKey: string): ArcadeDailyChallenge => {
  const fallback = createDailyChallengeForDate(nowDateKey);
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<ArcadeDailyChallenge>;
  const candidateDateKey = typeof candidate.dateKey === "string" ? candidate.dateKey : nowDateKey;
  if (candidateDateKey !== nowDateKey) {
    return fallback;
  }

  const candidateId =
    typeof candidate.id === "string" &&
    Object.hasOwn(ARCADE_DAILY_CHALLENGE_DEFINITIONS, candidate.id)
      ? (candidate.id as ArcadeDailyChallengeId)
      : resolveDailyChallengeIdForDate(nowDateKey);
  const definition = ARCADE_DAILY_CHALLENGE_DEFINITIONS[candidateId];
  const progress = toFiniteNonNegative(candidate.progress);
  const target = toFiniteNonNegative(definition.target);
  const completedAt =
    typeof candidate.completedAt === "string" && candidate.completedAt.trim()
      ? candidate.completedAt
      : null;
  const normalizedProgress = Math.min(progress, target);

  return {
    ...definition,
    dateKey: nowDateKey,
    progress: normalizedProgress,
    completedAt: normalizedProgress >= target ? (completedAt ?? new Date().toISOString()) : null,
  };
};

const sanitizeStats = (value: unknown): ArcadeStatMap => {
  if (!value || typeof value !== "object") {
    return {};
  }
  const stats = value as Record<string, unknown>;
  const next: ArcadeStatMap = {};
  Object.entries(stats).forEach(([key, statValue]) => {
    if (!key.trim()) {
      return;
    }
    next[key] = toFiniteNonNegative(statValue);
  });
  return next;
};

const mergeStats = (base: ArcadeStatMap, updates?: ArcadeStatMap): ArcadeStatMap => {
  if (!updates) {
    return base;
  }
  const next: ArcadeStatMap = { ...base };
  Object.entries(updates).forEach(([key, value]) => {
    if (!key.trim()) {
      return;
    }
    next[key] = toFiniteNonNegative(next[key]) + toFiniteNonNegative(value);
  });
  return next;
};

const resolveAccuracyPct = (result: ArcadeSessionResult): number => {
  if (typeof result.accuracyPct === "number" && Number.isFinite(result.accuracyPct)) {
    return toBoundedPct(result.accuracyPct);
  }

  const shotsFired = toFiniteNonNegative(result.stats?.shotsFired);
  const hits = toFiniteNonNegative(result.stats?.hits);
  if (shotsFired <= 0) {
    return 0;
  }

  return Math.min(100, (hits / shotsFired) * 100);
};

const sanitizeGameProfile = (value: unknown): ArcadeGameProfile => {
  if (!value || typeof value !== "object") {
    return cloneGameProfile(EMPTY_GAME_PROFILE);
  }
  const candidate = value as Partial<ArcadeGameProfile>;
  return {
    bestScore: toFiniteNonNegative(candidate.bestScore),
    highestAccuracyPct: toBoundedPct(candidate.highestAccuracyPct),
    lastPlayedAt: typeof candidate.lastPlayedAt === "string" ? candidate.lastPlayedAt : null,
    medalsCollected: toFiniteNonNegative(candidate.medalsCollected),
    sessionsCompleted: toFiniteNonNegative(candidate.sessionsCompleted),
    sessionsPlayed: toFiniteNonNegative(candidate.sessionsPlayed),
    stats: sanitizeStats(candidate.stats),
    totalPlayMs: toFiniteNonNegative(candidate.totalPlayMs),
    totalScore: toFiniteNonNegative(candidate.totalScore),
  };
};

export const createDefaultArcadeProfile = (nowIso = new Date().toISOString()): ArcadeProfile => {
  const nowMs = Number.isFinite(Date.parse(nowIso)) ? Date.parse(nowIso) : Date.now();
  const dateKey = toLocalDateKeyFromMs(nowMs);
  return {
    version: ARCADE_PROFILE_VERSION,
    updatedAt: nowIso,
    unlocks: {},
    dailyChallenge: createDailyChallengeForDate(dateKey),
    streak: clonePlayStreak(EMPTY_PLAY_STREAK),
    personalBests: clonePersonalBests(EMPTY_PERSONAL_BESTS),
    lifetime: {
      sessionsPlayed: 0,
      sessionsCompleted: 0,
      totalPlayMs: 0,
      totalScore: 0,
      medalsCollected: 0,
    },
    games: createEmptyArcadeGames(),
  };
};

const resolveSessionMedals = (
  gameId: ArcadeGameId,
  score: number,
  explicitMedals?: number,
): number => {
  if (typeof explicitMedals === "number" && Number.isFinite(explicitMedals)) {
    return Math.max(0, Math.floor(explicitMedals));
  }

  const thresholds = ARCADE_SCORE_TO_MEDALS[gameId];
  if (score >= thresholds.gold) {
    return 3;
  }
  if (score >= thresholds.silver) {
    return 2;
  }
  if (score >= thresholds.bronze) {
    return 1;
  }
  return 0;
};

const resolveBestStreak = (result: ArcadeSessionResult): number =>
  toFiniteNonNegative(
    result.stats?.bestStreak ??
      result.stats?.streakPeak ??
      result.stats?.streak ??
      result.stats?.roundWinStreak,
  );

const ensureDailyChallengeForDate = (profile: ArcadeProfile, atMs: number): void => {
  const dateKey = toLocalDateKeyFromMs(atMs);
  profile.dailyChallenge = sanitizeDailyChallenge(profile.dailyChallenge, dateKey);
};

const applyPlayStreakForDate = (streak: ArcadePlayStreak, dateKey: string): ArcadePlayStreak => {
  if (!streak.lastPlayedDateKey) {
    return {
      currentDays: 1,
      bestDays: Math.max(streak.bestDays, 1),
      lastPlayedDateKey: dateKey,
    };
  }

  const diffDays = getDateKeyDiffDays(streak.lastPlayedDateKey, dateKey);
  if (diffDays === null || diffDays < 0) {
    return {
      currentDays: streak.currentDays,
      bestDays: streak.bestDays,
      lastPlayedDateKey: streak.lastPlayedDateKey,
    };
  }

  if (diffDays === 0) {
    return streak;
  }

  const currentDays = diffDays === 1 ? streak.currentDays + 1 : 1;
  return {
    currentDays,
    bestDays: Math.max(streak.bestDays, currentDays),
    lastPlayedDateKey: dateKey,
  };
};

const applyDailyChallengeProgress = (
  profile: ArcadeProfile,
  options: {
    accuracyPct: number;
    atIso: string;
    bestStreak: number;
    gameId: ArcadeGameId;
    medalsCollected: number;
    score: number;
    sessionsPlayed: number;
  },
): void => {
  const challenge = profile.dailyChallenge;
  if (challenge.completedAt) {
    return;
  }

  if (challenge.gameId !== "any" && challenge.gameId !== options.gameId) {
    return;
  }

  let nextProgress = challenge.progress;
  switch (challenge.metric) {
    case "sessionsPlayed": {
      nextProgress += toFiniteNonNegative(options.sessionsPlayed);
      break;
    }
    case "medalsCollected": {
      nextProgress += toFiniteNonNegative(options.medalsCollected);
      break;
    }
    case "score": {
      nextProgress = Math.max(nextProgress, toFiniteNonNegative(options.score));
      break;
    }
    case "accuracyPct": {
      nextProgress = Math.max(nextProgress, toBoundedPct(options.accuracyPct));
      break;
    }
    case "bestStreak": {
      nextProgress = Math.max(nextProgress, toFiniteNonNegative(options.bestStreak));
      break;
    }
    default: {
      nextProgress = challenge.progress;
    }
  }

  challenge.progress = Math.min(toFiniteNonNegative(nextProgress), challenge.target);
  if (challenge.progress >= challenge.target) {
    challenge.completedAt = options.atIso;
  }
};

const applyPersonalBests = (
  profile: ArcadeProfile,
  result: {
    accuracyPct: number;
    bestStreak: number;
    durationMs: number;
    medalsCollected: number;
    score: number;
  },
): void => {
  profile.personalBests.bestSessionScore = Math.max(
    profile.personalBests.bestSessionScore,
    toFiniteNonNegative(result.score),
  );
  profile.personalBests.bestSessionAccuracyPct = Math.max(
    profile.personalBests.bestSessionAccuracyPct,
    toBoundedPct(result.accuracyPct),
  );
  profile.personalBests.bestSessionMedals = Math.max(
    profile.personalBests.bestSessionMedals,
    toFiniteNonNegative(result.medalsCollected),
  );
  profile.personalBests.longestSessionMs = Math.max(
    profile.personalBests.longestSessionMs,
    toFiniteNonNegative(result.durationMs),
  );
  profile.personalBests.bestSessionStreak = Math.max(
    profile.personalBests.bestSessionStreak,
    toFiniteNonNegative(result.bestStreak),
  );
};

const applyUnlocks = (profile: ArcadeProfile, nowIso: string): void => {
  const unlock = (id: keyof ArcadeProfile["unlocks"], shouldUnlock: boolean) => {
    if (!shouldUnlock || profile.unlocks[id]) {
      return;
    }
    profile.unlocks[id] = nowIso;
  };

  const hasPlayedAllGames = ARCADE_GAME_IDS.every(
    (gameId) => profile.games[gameId].sessionsPlayed > 0,
  );
  const hasPlayedTripleThreat = TRIPLE_THREAT_GAME_IDS.every(
    (gameId) => profile.games[gameId].sessionsPlayed > 0,
  );

  unlock("first_sortie", profile.lifetime.sessionsPlayed > 0);
  unlock("triple_threat", hasPlayedTripleThreat);
  unlock("arcade_polyglot", hasPlayedAllGames);
  unlock("medal_hunter", profile.lifetime.medalsCollected >= 25);
  unlock("score_chaser", profile.lifetime.totalScore >= 25_000);
  unlock("marathon_mode", profile.lifetime.totalPlayMs >= 30 * 60 * 1000);
  unlock("ace_pilot", profile.games.warbirds.bestScore >= 7_500);
  unlock("skeletal_sniper", profile.games.zombiefish.highestAccuracyPct >= 75);
  unlock("asteroid_vanguard", profile.games.blasteroids.bestScore >= 4_000);
  unlock("high_roller", profile.games.blackjack.bestScore >= 300);
  unlock("daily_dedication", Boolean(profile.dailyChallenge.completedAt));
  unlock("streak_apprentice", profile.streak.bestDays >= 3);
  unlock("streak_veteran", profile.streak.bestDays >= 7);
};

export const sanitizeArcadeProfile = (value: unknown): ArcadeProfile => {
  const nowMs = Date.now();
  const nowDateKey = toLocalDateKeyFromMs(nowMs);
  const fallback = createDefaultArcadeProfile();
  if (!value || typeof value !== "object") {
    return fallback;
  }
  const candidate = value as Partial<ArcadeProfile>;

  const games = candidate.games as Partial<Record<ArcadeGameId, unknown>> | undefined;
  const lifetime = candidate.lifetime as Partial<ArcadeProfile["lifetime"]> | undefined;
  const unlocks =
    candidate.unlocks && typeof candidate.unlocks === "object"
      ? (candidate.unlocks as Partial<Record<keyof ArcadeProfile["unlocks"], unknown>>)
      : {};

  const profile: ArcadeProfile = {
    version: ARCADE_PROFILE_VERSION,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : fallback.updatedAt,
    unlocks: {},
    dailyChallenge: sanitizeDailyChallenge(candidate.dailyChallenge, nowDateKey),
    streak: sanitizePlayStreak(candidate.streak),
    personalBests: sanitizePersonalBests(candidate.personalBests),
    lifetime: {
      sessionsPlayed: toFiniteNonNegative(lifetime?.sessionsPlayed),
      sessionsCompleted: toFiniteNonNegative(lifetime?.sessionsCompleted),
      totalPlayMs: toFiniteNonNegative(lifetime?.totalPlayMs),
      totalScore: toFiniteNonNegative(lifetime?.totalScore),
      medalsCollected: toFiniteNonNegative(lifetime?.medalsCollected),
    },
    games: {
      warbirds: sanitizeGameProfile(games?.warbirds),
      zombiefish: sanitizeGameProfile(games?.zombiefish),
      blasteroids: sanitizeGameProfile(games?.blasteroids),
      blackjack: sanitizeGameProfile(games?.blackjack),
    },
  };

  Object.entries(unlocks).forEach(([key, unlockedAt]) => {
    if (!(key in ARCADE_UNLOCK_DEFINITIONS)) {
      return;
    }
    if (typeof unlockedAt === "string" && unlockedAt.trim()) {
      profile.unlocks[key as keyof ArcadeProfile["unlocks"]] = unlockedAt;
    }
  });

  profile.streak.bestDays = Math.max(profile.streak.bestDays, profile.streak.currentDays);

  return profile;
};

export const loadArcadeProfileFromStorage = (): ArcadeProfile => {
  if (typeof window === "undefined") {
    return createDefaultArcadeProfile();
  }

  try {
    const raw = window.localStorage.getItem(ARCADE_PROFILE_STORAGE_KEY);
    if (!raw) {
      return createDefaultArcadeProfile();
    }
    return sanitizeArcadeProfile(JSON.parse(raw));
  } catch {
    return createDefaultArcadeProfile();
  }
};

export const saveArcadeProfileToStorage = (profile: ArcadeProfile): ArcadeProfile => {
  const normalized = sanitizeArcadeProfile({
    ...profile,
    version: ARCADE_PROFILE_VERSION,
    updatedAt: new Date().toISOString(),
  });

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ARCADE_PROFILE_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // no-op: storage may be blocked in private mode
    }
  }

  return normalized;
};

export const applyArcadeSessionStart = (
  profile: ArcadeProfile,
  gameId: ArcadeGameId,
  startedAtMs = Date.now(),
): ArcadeProfile => {
  const next = cloneProfile(profile);
  const startedAtIso = new Date(startedAtMs).toISOString();
  const startedDateKey = toLocalDateKeyFromMs(startedAtMs);
  const game = next.games[gameId];

  ensureDailyChallengeForDate(next, startedAtMs);
  game.sessionsPlayed += 1;
  game.lastPlayedAt = startedAtIso;
  next.lifetime.sessionsPlayed += 1;
  next.streak = applyPlayStreakForDate(next.streak, startedDateKey);
  applyDailyChallengeProgress(next, {
    gameId,
    sessionsPlayed: 1,
    medalsCollected: 0,
    score: 0,
    accuracyPct: 0,
    bestStreak: 0,
    atIso: startedAtIso,
  });
  next.updatedAt = startedAtIso;

  applyUnlocks(next, startedAtIso);
  return next;
};

export const applyArcadeSessionResult = (
  profile: ArcadeProfile,
  gameId: ArcadeGameId,
  result: ArcadeSessionResult = {},
): ArcadeProfile => {
  const next = cloneProfile(profile);
  const finishedAtMs = result.finishedAtMs ?? Date.now();
  const finishedAtIso = new Date(finishedAtMs).toISOString();
  const game = next.games[gameId];
  const score = toFiniteNonNegative(result.score);
  const durationMs = toFiniteNonNegative(result.durationMs);
  const accuracyPct = resolveAccuracyPct(result);
  const medalsCollected = resolveSessionMedals(gameId, score, result.medalsCollected);
  const bestStreak = resolveBestStreak(result);
  const completed = result.completed ?? true;

  ensureDailyChallengeForDate(next, finishedAtMs);

  if (completed) {
    game.sessionsCompleted += 1;
    next.lifetime.sessionsCompleted += 1;
  }

  game.lastPlayedAt = finishedAtIso;
  game.totalPlayMs += durationMs;
  game.totalScore += score;
  game.bestScore = Math.max(game.bestScore, score);
  game.medalsCollected += medalsCollected;
  game.highestAccuracyPct = Math.max(game.highestAccuracyPct, accuracyPct);
  game.stats = mergeStats(game.stats, result.stats);

  next.lifetime.totalPlayMs += durationMs;
  next.lifetime.totalScore += score;
  next.lifetime.medalsCollected += medalsCollected;
  applyDailyChallengeProgress(next, {
    gameId,
    sessionsPlayed: 0,
    medalsCollected,
    score,
    accuracyPct,
    bestStreak,
    atIso: finishedAtIso,
  });
  applyPersonalBests(next, {
    score,
    accuracyPct,
    medalsCollected,
    durationMs,
    bestStreak,
  });
  next.updatedAt = finishedAtIso;

  applyUnlocks(next, finishedAtIso);
  return next;
};

export const getArcadeGameLabel = (gameId: ArcadeGameId): string => ARCADE_GAME_LABELS[gameId];
