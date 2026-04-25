import {
  applyArcadeSessionResult,
  applyArcadeSessionStart,
  createDefaultArcadeProfile,
  sanitizeArcadeProfile,
} from "@/utils/game/arcadeProfile";

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
    expect(sanitized.games.warbirds.stats.enemiesDowned).toBe(20);
    expect(sanitized.games.warbirds.stats.badValue).toBe(0);
    expect(sanitized.lifetime.totalScore).toBe(0);
    expect(sanitized.unlocks.first_sortie).toBe("2026-03-10T00:00:00.000Z");
  });
});
