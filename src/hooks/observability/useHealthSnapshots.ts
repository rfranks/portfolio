import * as React from "react";
import { withBasePath } from "@/utils/basePath";
import { parseAggregateHealthSnapshot } from "@/utils/observability/healthSnapshots";
import { loadRouteInteractionBudgetSnapshotFromStorage } from "@/utils/observability/routeInteractionBudgets";
import { loadMediaRenderPerfSnapshotFromStorage } from "@/utils/observability/mediaRenderPerf";
import type { AggregateHealthSnapshot } from "@/types/observability/healthSnapshots";
import type { RouteInteractionBudgetSnapshot } from "@/types/observability/routeInteractionBudgets";
import type { MediaRenderPerfSnapshot } from "@/types/observability/mediaRenderPerf";

const DEFAULT_HEALTH_SNAPSHOT_URL = withBasePath("/personal/data/health/app-health.snapshot.json");

export type UseHealthSnapshotsResult = {
  aggregateSnapshot: AggregateHealthSnapshot | null;
  routeInteractionSnapshot: RouteInteractionBudgetSnapshot | null;
  mediaRenderPerfSnapshot: MediaRenderPerfSnapshot | null;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
};

export function useHealthSnapshots(): UseHealthSnapshotsResult {
  const [aggregateSnapshot, setAggregateSnapshot] = React.useState<AggregateHealthSnapshot | null>(
    null,
  );
  const [routeInteractionSnapshot, setRouteInteractionSnapshot] =
    React.useState<RouteInteractionBudgetSnapshot | null>(null);
  const [mediaRenderPerfSnapshot, setMediaRenderPerfSnapshot] =
    React.useState<MediaRenderPerfSnapshot | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    setRouteInteractionSnapshot(loadRouteInteractionBudgetSnapshotFromStorage());
    setMediaRenderPerfSnapshot(loadMediaRenderPerfSnapshotFromStorage());

    try {
      const response = await fetch(`${DEFAULT_HEALTH_SNAPSHOT_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Unable to load health snapshot (${response.status})`);
      }

      const payload: unknown = await response.json();
      const parsed = parseAggregateHealthSnapshot(payload);
      if (!parsed) {
        throw new Error("Unable to parse health snapshot payload.");
      }
      setAggregateSnapshot(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      setAggregateSnapshot(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    aggregateSnapshot,
    routeInteractionSnapshot,
    mediaRenderPerfSnapshot,
    isLoading,
    errorMessage,
    refresh,
  };
}
