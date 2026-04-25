"use client";

import {
  ARCADE_GAME_LABELS,
  ARCADE_PROFILE_STORAGE_KEY,
  ARCADE_PROFILE_VERSION,
  ARCADE_SCORE_TO_MEDALS,
  ARCADE_UNLOCK_DEFINITIONS,
} from "@/consts/game/arcadeProfile";
import {
  ARCADE_GAME_IDS,
  type ArcadeGameId,
  type ArcadeGameProfile,
  type ArcadeProfile,
  type ArcadeSessionResult,
  type ArcadeStatMap,
} from "@/types/game/arcadeProfile";

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

const cloneGameProfile = (gameProfile: ArcadeGameProfile): ArcadeGameProfile => ({
  ...gameProfile,
  stats: { ...gameProfile.stats },
});

const cloneProfile = (profile: ArcadeProfile): ArcadeProfile => ({
  ...profile,
  games: {
    warbirds: cloneGameProfile(profile.games.warbirds),
    zombiefish: cloneGameProfile(profile.games.zombiefish),
    blasteroids: cloneGameProfile(profile.games.blasteroids),
  },
  lifetime: { ...profile.lifetime },
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
    return Math.min(100, toFiniteNonNegative(result.accuracyPct));
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
    highestAccuracyPct: Math.min(100, toFiniteNonNegative(candidate.highestAccuracyPct)),
    lastPlayedAt: typeof candidate.lastPlayedAt === "string" ? candidate.lastPlayedAt : null,
    medalsCollected: toFiniteNonNegative(candidate.medalsCollected),
    sessionsCompleted: toFiniteNonNegative(candidate.sessionsCompleted),
    sessionsPlayed: toFiniteNonNegative(candidate.sessionsPlayed),
    stats: sanitizeStats(candidate.stats),
    totalPlayMs: toFiniteNonNegative(candidate.totalPlayMs),
    totalScore: toFiniteNonNegative(candidate.totalScore),
  };
};

export const createDefaultArcadeProfile = (nowIso = new Date().toISOString()): ArcadeProfile => ({
  version: ARCADE_PROFILE_VERSION,
  updatedAt: nowIso,
  unlocks: {},
  lifetime: {
    sessionsPlayed: 0,
    sessionsCompleted: 0,
    totalPlayMs: 0,
    totalScore: 0,
    medalsCollected: 0,
  },
  games: {
    warbirds: cloneGameProfile(EMPTY_GAME_PROFILE),
    zombiefish: cloneGameProfile(EMPTY_GAME_PROFILE),
    blasteroids: cloneGameProfile(EMPTY_GAME_PROFILE),
  },
});

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

  unlock("first_sortie", profile.lifetime.sessionsPlayed > 0);
  unlock("triple_threat", hasPlayedAllGames);
  unlock("medal_hunter", profile.lifetime.medalsCollected >= 25);
  unlock("score_chaser", profile.lifetime.totalScore >= 25_000);
  unlock("marathon_mode", profile.lifetime.totalPlayMs >= 30 * 60 * 1000);
  unlock("ace_pilot", profile.games.warbirds.bestScore >= 7_500);
  unlock("skeletal_sniper", profile.games.zombiefish.highestAccuracyPct >= 75);
  unlock("asteroid_vanguard", profile.games.blasteroids.bestScore >= 4_000);
};

export const sanitizeArcadeProfile = (value: unknown): ArcadeProfile => {
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
  const game = next.games[gameId];

  game.sessionsPlayed += 1;
  game.lastPlayedAt = startedAtIso;
  next.lifetime.sessionsPlayed += 1;
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
  const completed = result.completed ?? true;

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
  next.updatedAt = finishedAtIso;

  applyUnlocks(next, finishedAtIso);
  return next;
};

export const getArcadeGameLabel = (gameId: ArcadeGameId): string => ARCADE_GAME_LABELS[gameId];
