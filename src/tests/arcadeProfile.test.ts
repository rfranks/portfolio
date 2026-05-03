import {
  applyArcadeSessionResult,
  applyArcadeSessionStart,
  createDefaultArcadeProfile,
  sanitizeArcadeProfile,
} from "@/utils/game/arcadeProfile";

const toLocalDateKey = (timeMs: number): string => {
  const date = new Date(timeMs);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
    .getDate()
    .toString()
    .padStart(2, "0")}`;
};

describe("arcadeProfile utilities", () => {
  it("starts sessions and unlocks first_sortie", () => {
    const profile = createDefaultArcadeProfile("2026-01-01T00:00:00.000Z");
    const next = applyArcadeSessionStart(profile, "warbirds", 1_700_000_000_000);

    expect(next.games.warbirds.sessionsPlayed).toBe(1);
    expect(next.lifetime.sessionsPlayed).toBe(1);
    expect(next.unlocks.first_sortie).toBeTruthy();
  });

  it("records completed session scores, medals, accuracy, and stats", () => {
    const profile = applyArcadeSessionStart(createDefaultArcadeProfile(), "warbirds", 1_000);
    const next = applyArcadeSessionResult(profile, "warbirds", {
      completed: true,
      durationMs: 4_500,
      finishedAtMs: 5_500,
      score: 8_200,
      medalsCollected: 6,
      accuracyPct: 92,
      stats: {
        enemiesDowned: 42,
        ducksCollected: 7,
      },
    });

    expect(next.games.warbirds.sessionsCompleted).toBe(1);
    expect(next.games.warbirds.totalPlayMs).toBe(4_500);
    expect(next.games.warbirds.bestScore).toBe(8_200);
    expect(next.games.warbirds.medalsCollected).toBe(6);
    expect(next.games.warbirds.highestAccuracyPct).toBe(92);
    expect(next.games.warbirds.stats.enemiesDowned).toBe(42);
    expect(next.lifetime.totalScore).toBe(8_200);
    expect(next.unlocks.ace_pilot).toBeTruthy();
  });

  it("derives accuracy from shot stats when accuracyPct is omitted", () => {
    const profile = applyArcadeSessionStart(createDefaultArcadeProfile(), "warbirds", 1_000);
    const next = applyArcadeSessionResult(profile, "warbirds", {
      completed: true,
      durationMs: 1_250,
      finishedAtMs: 2_250,
      score: 1_200,
      stats: {
        shotsFired: 40,
        hits: 25,
      },
    });

    expect(next.games.warbirds.highestAccuracyPct).toBeCloseTo(62.5);
  });

  it("unlocks triple_threat when all three games are played", () => {
    let profile = createDefaultArcadeProfile();
    profile = applyArcadeSessionStart(profile, "warbirds", 100);
    profile = applyArcadeSessionStart(profile, "zombiefish", 200);
    profile = applyArcadeSessionStart(profile, "blasteroids", 300);

    expect(profile.unlocks.triple_threat).toBeTruthy();
  });

  it("derives medals from score thresholds when medals are not provided", () => {
    const started = applyArcadeSessionStart(createDefaultArcadeProfile(), "zombiefish", 100);
    const next = applyArcadeSessionResult(started, "zombiefish", {
      completed: true,
      score: 700,
      durationMs: 1_250,
      finishedAtMs: 1_350,
    });

    expect(next.games.zombiefish.medalsCollected).toBe(2);
    expect(next.lifetime.medalsCollected).toBe(2);
  });

  it("tracks consecutive play streaks across days", () => {
    const dayOne = new Date(2026, 3, 10, 12).getTime();
    const dayTwo = dayOne + 24 * 60 * 60 * 1000;
    const dayFour = dayOne + 4 * 24 * 60 * 60 * 1000;

    let profile = createDefaultArcadeProfile(new Date(dayOne).toISOString());
    profile = applyArcadeSessionStart(profile, "warbirds", dayOne);
    profile = applyArcadeSessionStart(profile, "zombiefish", dayTwo);

    expect(profile.streak.currentDays).toBe(2);
    expect(profile.streak.bestDays).toBe(2);

    profile = applyArcadeSessionStart(profile, "blackjack", dayFour);
    expect(profile.streak.currentDays).toBe(1);
    expect(profile.streak.bestDays).toBe(2);
  });

  it("completes session-based daily challenge progress", () => {
    const startedAtMs = new Date(2026, 3, 15, 12).getTime();
    const profile = createDefaultArcadeProfile(new Date(startedAtMs).toISOString());
    const withSessionChallenge = {
      ...profile,
      dailyChallenge: {
        id: "arcade_any_session" as const,
        gameId: "any" as const,
        metric: "sessionsPlayed" as const,
        target: 1,
        progress: 0,
        label: "Warm-Up Session",
        description: "Play any arcade game once today.",
        completedAt: null,
        dateKey: toLocalDateKey(startedAtMs),
      },
    };

    const next = applyArcadeSessionStart(withSessionChallenge, "warbirds", startedAtMs);
    expect(next.dailyChallenge.progress).toBe(1);
    expect(next.dailyChallenge.completedAt).toBeTruthy();
    expect(next.unlocks.daily_dedication).toBeTruthy();
  });

  it("tracks blackjack round scores and personal bests", () => {
    const startedAtMs = new Date(2026, 3, 20, 12).getTime();
    let profile = createDefaultArcadeProfile(new Date(startedAtMs).toISOString());
    profile = {
      ...profile,
      dailyChallenge: {
        id: "blackjack_hot_hand" as const,
        gameId: "blackjack" as const,
        metric: "score" as const,
        target: 180,
        progress: 0,
        label: "Blackjack Hot Hand",
        description: "Finish a Blackjack round with +180 or more net score.",
        completedAt: null,
        dateKey: toLocalDateKey(startedAtMs),
      },
    };

    profile = applyArcadeSessionStart(profile, "blackjack", startedAtMs);
    const next = applyArcadeSessionResult(profile, "blackjack", {
      completed: true,
      score: 360,
      durationMs: 2500,
      finishedAtMs: startedAtMs + 2500,
      stats: {
        roundWinStreak: 4,
      },
    });

    expect(next.games.blackjack.bestScore).toBe(360);
    expect(next.personalBests.bestSessionScore).toBe(360);
    expect(next.personalBests.bestSessionStreak).toBe(4);
    expect(next.dailyChallenge.progress).toBe(180);
    expect(next.dailyChallenge.completedAt).toBeTruthy();
    expect(next.unlocks.high_roller).toBeTruthy();
  });

  it("sanitizes malformed persisted profile data", () => {
    const sanitized = sanitizeArcadeProfile({
      games: {
        warbirds: {
          bestScore: "not-a-number",
          stats: {
            enemiesDowned: 20,
            badValue: "oops",
          },
        },
      },
      lifetime: {
        totalScore: "oops",
      },
      unlocks: {
        first_sortie: "2026-03-10T00:00:00.000Z",
        bogus_unlock: "invalid",
      },
    });

    expect(sanitized.games.warbirds.bestScore).toBe(0);
    expect(sanitized.games.blackjack.bestScore).toBe(0);
    expect(sanitized.games.warbirds.stats.enemiesDowned).toBe(20);
    expect(sanitized.games.warbirds.stats.badValue).toBe(0);
    expect(sanitized.lifetime.totalScore).toBe(0);
    expect(sanitized.unlocks.first_sortie).toBe("2026-03-10T00:00:00.000Z");
    expect(typeof sanitized.dailyChallenge.id).toBe("string");
  });
});
