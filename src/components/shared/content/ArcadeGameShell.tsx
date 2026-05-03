"use client";

import * as React from "react";
import { ARCADE_UNLOCK_DEFINITIONS } from "@/consts/game/arcadeProfile";
import type { ArcadeGameId, ArcadeProfile } from "@/types/game/arcadeProfile";
import { getArcadeGameLabel } from "@/utils/game/arcadeProfile";

export interface ArcadeGameShellProps {
  arcadeGameId?: ArcadeGameId;
  arcadeProfile?: ArcadeProfile | null;
  assetsReady: boolean;
  children: React.ReactNode;
  onStart: () => void;
  renderTitleSplash: (args: {
    arcadeGameId: ArcadeGameId | null;
    arcadeProfile: ArcadeProfile | null;
    assetsReady: boolean;
    onStart: () => void;
    startRequested: boolean;
  }) => React.ReactNode;
  showProfilePanel?: boolean;
  showTitleSplash: boolean;
}

export default function ArcadeGameShell({
  arcadeGameId,
  arcadeProfile,
  showTitleSplash,
  assetsReady,
  onStart,
  renderTitleSplash,
  children,
  showProfilePanel = true,
}: ArcadeGameShellProps) {
  const [startRequested, setStartRequested] = React.useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = React.useState(false);

  const handleStart = React.useCallback(() => {
    if (assetsReady) {
      onStart();
      return;
    }
    setStartRequested(true);
  }, [assetsReady, onStart]);

  React.useEffect(() => {
    if (assetsReady && startRequested) {
      onStart();
      setStartRequested(false);
    }
  }, [assetsReady, onStart, startRequested]);

  const unlockedCount = React.useMemo(
    () => (arcadeProfile ? Object.keys(arcadeProfile.unlocks).length : 0),
    [arcadeProfile],
  );

  const activeGameProfile =
    arcadeProfile && arcadeGameId ? arcadeProfile.games[arcadeGameId] : null;
  const activeGameStats = React.useMemo(() => {
    if (!activeGameProfile) {
      return [];
    }
    return Object.entries(activeGameProfile.stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [activeGameProfile]);
  const titleOverlayChallengePct = React.useMemo(() => {
    if (!arcadeProfile) {
      return 0;
    }
    const target = arcadeProfile.dailyChallenge.target;
    return target > 0 ? Math.min(100, (arcadeProfile.dailyChallenge.progress / target) * 100) : 0;
  }, [arcadeProfile]);
  const titleOverlayChallengeGameLabel = React.useMemo(() => {
    if (!arcadeProfile) {
      return "";
    }
    if (arcadeProfile.dailyChallenge.gameId === "any") {
      return "Any Arcade App";
    }
    return getArcadeGameLabel(arcadeProfile.dailyChallenge.gameId);
  }, [arcadeProfile]);
  const shouldShowTitleProgressHud = Boolean(
    showTitleSplash &&
    arcadeProfile &&
    arcadeGameId &&
    (arcadeGameId === "warbirds" || arcadeGameId === "zombiefish"),
  );

  if (showTitleSplash) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100dvh",
          height: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {renderTitleSplash({
          onStart: handleStart,
          assetsReady,
          startRequested,
          arcadeGameId: arcadeGameId ?? null,
          arcadeProfile: arcadeProfile ?? null,
        })}
        {shouldShowTitleProgressHud ? (
          <aside
            aria-label="Arcade progression"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: "min(290px, calc(100vw - 24px))",
              borderRadius: 12,
              padding: "10px 12px",
              color: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.45)",
              background:
                "linear-gradient(180deg, rgba(8, 14, 26, 0.86), rgba(15, 27, 50, 0.84) 72%, rgba(20, 38, 74, 0.84))",
              boxShadow: "0 12px 26px rgba(0, 0, 0, 0.34)",
              backdropFilter: "blur(8px)",
              zIndex: 4,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.08em", opacity: 0.78 }}>
              ARCADE PROGRESSION
            </div>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 2 }}>
              Daily: {arcadeProfile?.dailyChallenge.label}
            </div>
            <div style={{ fontSize: 11.5, marginTop: 4, opacity: 0.9 }}>
              {titleOverlayChallengeGameLabel} • {arcadeProfile?.dailyChallenge.description}
            </div>
            <div style={{ fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>
              Progress: {Math.round(arcadeProfile?.dailyChallenge.progress ?? 0).toLocaleString()} /{" "}
              {Math.round(arcadeProfile?.dailyChallenge.target ?? 0).toLocaleString()} (
              {Math.round(titleOverlayChallengePct)}%)
            </div>
            <div style={{ fontSize: 11.5, marginTop: 4 }}>
              Streak: {arcadeProfile?.streak.currentDays ?? 0} day(s) • Best{" "}
              {arcadeProfile?.streak.bestDays ?? 0}
            </div>
            <div style={{ fontSize: 11.5, marginTop: 2 }}>
              PB (Session): +
              {Math.round(arcadeProfile?.personalBests.bestSessionScore ?? 0).toLocaleString()}
            </div>
          </aside>
        ) : null}
      </div>
    );
  }

  const shouldShowProfilePanel = showProfilePanel && Boolean(arcadeProfile && arcadeGameId);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>{children}</div>
      {shouldShowProfilePanel ? (
        <>
          <button
            type="button"
            onClick={() => setProfilePanelOpen((current) => !current)}
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              border: "1px solid rgba(255, 255, 255, 0.38)",
              background: "rgba(7, 14, 23, 0.72)",
              color: "#f8fafc",
              borderRadius: 999,
              fontSize: profilePanelOpen ? 12 : 20,
              fontWeight: 700,
              letterSpacing: "0.02em",
              zIndex: 4,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: profilePanelOpen ? 64 : 40,
              width: profilePanelOpen ? "auto" : 40,
              height: 40,
              padding: profilePanelOpen ? "0 14px" : 0,
            }}
            aria-expanded={profilePanelOpen}
            aria-controls="arcade-profile-panel"
            aria-label={profilePanelOpen ? "Hide profile" : "Arcade profile"}
          >
            {profilePanelOpen ? "Hide" : "🎮"}
          </button>
          {profilePanelOpen ? (
            <aside
              id="arcade-profile-panel"
              aria-label="Arcade profile"
              style={{
                position: "absolute",
                bottom: 60,
                right: 12,
                width: "min(360px, calc(100vw - 24px))",
                maxHeight: "calc(100dvh - 84px)",
                overflowY: "auto",
                borderRadius: 14,
                padding: 14,
                background:
                  "linear-gradient(180deg, rgba(6, 13, 24, 0.93), rgba(11, 26, 46, 0.92))",
                color: "#f8fafc",
                border: "1px solid rgba(148, 163, 184, 0.38)",
                boxShadow: "0 12px 28px rgba(2, 6, 23, 0.45)",
                zIndex: 4,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>
                {arcadeGameId ? getArcadeGameLabel(arcadeGameId) : "Arcade"} Profile
              </div>
              <div style={{ fontSize: 12, opacity: 0.86, marginBottom: 10 }}>
                Shared progression across Warbirds, Zombiefish, Blasteroids, and Blackjack.
              </div>
              {activeGameProfile ? (
                <div style={{ display: "grid", gap: 6, fontSize: 12, marginBottom: 12 }}>
                  <div>High score: {Math.round(activeGameProfile.bestScore).toLocaleString()}</div>
                  <div>
                    Medals: {Math.round(activeGameProfile.medalsCollected).toLocaleString()}
                  </div>
                  <div>
                    Sessions: {Math.round(activeGameProfile.sessionsPlayed)} played /{" "}
                    {Math.round(activeGameProfile.sessionsCompleted)} completed
                  </div>
                  <div>Best accuracy: {activeGameProfile.highestAccuracyPct.toFixed(1)}%</div>
                </div>
              ) : null}
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
                Unlocks ({unlockedCount}/{Object.keys(ARCADE_UNLOCK_DEFINITIONS).length})
              </div>
              <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                {Object.entries(ARCADE_UNLOCK_DEFINITIONS).map(([unlockId, definition]) => {
                  const unlockedAt =
                    arcadeProfile?.unlocks[unlockId as keyof ArcadeProfile["unlocks"]];
                  return (
                    <div
                      key={unlockId}
                      style={{
                        borderRadius: 10,
                        padding: "8px 9px",
                        background: unlockedAt
                          ? "rgba(34, 197, 94, 0.18)"
                          : "rgba(148, 163, 184, 0.14)",
                        border: unlockedAt
                          ? "1px solid rgba(34, 197, 94, 0.5)"
                          : "1px solid rgba(148, 163, 184, 0.32)",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700 }}>
                        {unlockedAt ? "Unlocked" : "Locked"}: {definition.label}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.88 }}>{definition.description}</div>
                    </div>
                  );
                })}
              </div>
              {activeGameStats.length > 0 ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
                    Per-game stats
                  </div>
                  <div style={{ display: "grid", gap: 4, fontSize: 12 }}>
                    {activeGameStats.map(([statKey, statValue]) => (
                      <div key={statKey}>
                        {statKey}: {Math.round(statValue).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </aside>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
