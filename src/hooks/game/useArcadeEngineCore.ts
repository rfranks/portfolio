import { ARCADE_PROFILE_STORAGE_KEY } from "@/consts/game/arcadeProfile";
import { BASE_DIMS } from "@/consts/game/dimensions";
import useScaledClock, {
  clearScaledTimeout,
  clockRef,
  setScaledTimeout,
} from "@/hooks/time/useScaledClock";
import { useWindowSize } from "@/hooks/window/useWindowSize";
import type {
  ArcadeGameId,
  ArcadeGameProfile,
  ArcadeProfile,
  ArcadeSessionResult,
} from "@/types/game/arcadeProfile";
import type { Dims } from "@/types/game/ui";
import type { ScaledTimeoutHandle } from "@/types/hooks/time";
import {
  applyArcadeSessionResult,
  applyArcadeSessionStart,
  loadArcadeProfileFromStorage,
  saveArcadeProfileToStorage,
} from "@/utils/game/arcadeProfile";
import { createGameSimulationRuntime } from "@/utils/game/simulationRuntime";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

type UseArcadeEngineCoreOptions = {
  arcadeGameId?: ArcadeGameId;
  dims?: Dims;
  debugName: string;
  debugFps?: boolean;
  reportIntervalMs?: number;
  stopLoopOnUnmount?: boolean;
};

export type ArcadeProfileController = {
  finishSession: (result?: ArcadeSessionResult) => ArcadeProfile;
  gameId: ArcadeGameId | null;
  gameProfile: ArcadeGameProfile | null;
  isSessionActive: boolean;
  profile: ArcadeProfile;
  refreshProfile: () => ArcadeProfile;
  startSession: () => ArcadeProfile;
};

type UseArcadeEngineCoreResult = {
  arcadeProfile: ArcadeProfileController;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  dims: Dims;
  screenDims: Dims;
  simulationRuntime: ReturnType<typeof createGameSimulationRuntime<ScaledTimeoutHandle>>;
};

export function useArcadeEngineCore({
  arcadeGameId,
  dims = BASE_DIMS,
  debugName,
  debugFps = false,
  reportIntervalMs = 500,
  stopLoopOnUnmount = true,
}: UseArcadeEngineCoreOptions): UseArcadeEngineCoreResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const screenDims = useWindowSize();
  const [profile, setProfile] = useState<ArcadeProfile>(() => loadArcadeProfileFromStorage());
  const activeSessionStartedAtRef = useRef<number | null>(null);
  const profileRef = useRef<ArcadeProfile>(profile);

  useScaledClock();

  const simulationRuntime = useMemo(
    () =>
      createGameSimulationRuntime<ScaledTimeoutHandle>({
        frameRef: animationFrameRef,
        setTimeoutFn: setScaledTimeout,
        clearTimeoutFn: clearScaledTimeout,
      }),
    [],
  );

  const persistProfile = useCallback((nextProfile: ArcadeProfile): ArcadeProfile => {
    const saved = saveArcadeProfileToStorage(nextProfile);
    profileRef.current = saved;
    setProfile(saved);
    return saved;
  }, []);

  const refreshProfile = useCallback((): ArcadeProfile => {
    const refreshed = loadArcadeProfileFromStorage();
    profileRef.current = refreshed;
    setProfile(refreshed);
    return refreshed;
  }, []);

  const startSession = useCallback((): ArcadeProfile => {
    if (!arcadeGameId) {
      return profileRef.current;
    }
    if (activeSessionStartedAtRef.current !== null) {
      return profileRef.current;
    }

    const startedAtMs = Date.now();
    const nextProfile = applyArcadeSessionStart(profileRef.current, arcadeGameId, startedAtMs);
    activeSessionStartedAtRef.current = startedAtMs;
    return persistProfile(nextProfile);
  }, [arcadeGameId, persistProfile]);

  const finishSession = useCallback(
    (result: ArcadeSessionResult = {}): ArcadeProfile => {
      if (!arcadeGameId) {
        return profileRef.current;
      }

      const finishedAtMs = result.finishedAtMs ?? Date.now();
      const startedAtMs = activeSessionStartedAtRef.current;
      const durationMs =
        typeof result.durationMs === "number" && Number.isFinite(result.durationMs)
          ? result.durationMs
          : startedAtMs !== null
            ? Math.max(0, finishedAtMs - startedAtMs)
            : 0;
      const nextProfile = applyArcadeSessionResult(profileRef.current, arcadeGameId, {
        ...result,
        finishedAtMs,
        durationMs,
      });
      activeSessionStartedAtRef.current = null;
      return persistProfile(nextProfile);
    },
    [arcadeGameId, persistProfile],
  );

  useEffect(() => {
    if (!debugFps) return;
    const id = window.setInterval(() => {
      const { deltaMs, scale } = clockRef.current;
      const fps = 1000 / deltaMs;
      console.debug(`[${debugName}] fps: ${fps.toFixed(1)} scale: ${scale.toFixed(2)}`);
    }, reportIntervalMs);
    return () => window.clearInterval(id);
  }, [debugFps, debugName, reportIntervalMs]);

  useEffect(() => {
    if (!stopLoopOnUnmount) return;
    return () => {
      simulationRuntime.stopLoop();
    };
  }, [simulationRuntime, stopLoopOnUnmount]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ARCADE_PROFILE_STORAGE_KEY) {
        return;
      }
      refreshProfile();
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshProfile]);

  useEffect(() => {
    activeSessionStartedAtRef.current = null;
  }, [arcadeGameId]);

  const arcadeProfile = useMemo<ArcadeProfileController>(
    () => ({
      profile,
      gameId: arcadeGameId ?? null,
      gameProfile: arcadeGameId ? profile.games[arcadeGameId] : null,
      isSessionActive: activeSessionStartedAtRef.current !== null,
      refreshProfile,
      startSession,
      finishSession,
    }),
    [arcadeGameId, finishSession, profile, refreshProfile, startSession],
  );

  return {
    arcadeProfile,
    canvasRef,
    dims,
    screenDims,
    simulationRuntime,
  };
}
