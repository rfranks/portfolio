import type { TimelineEvent } from "@/types/observability/navigationTelemetry";
import type {
  RouteInteractionBudget,
  RouteInteractionBudgetSnapshot,
} from "@/types/observability/routeInteractionBudgets";

export const ROUTE_INTERACTION_BUDGET_STORAGE_KEY = "portfolio:route-interaction-budgets";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const asNullableNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function createEmptyRouteInteractionBudget(route: string): RouteInteractionBudget {
  return {
    route,
    firstPagerMs: null,
    firstMediaMs: null,
    firstDiagramMs: null,
    firstInteractionMs: null,
    totalCapturedEvents: 0,
  };
}

export function loadRouteInteractionBudgetSnapshotFromStorage(): RouteInteractionBudgetSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(ROUTE_INTERACTION_BUDGET_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed.routes)) {
      return null;
    }

    const routes = parsed.routes
      .map((entry): RouteInteractionBudget | null => {
        if (!isRecord(entry) || typeof entry.route !== "string") {
          return null;
        }

        return {
          route: entry.route,
          firstPagerMs: asNullableNumber(entry.firstPagerMs),
          firstMediaMs: asNullableNumber(entry.firstMediaMs),
          firstDiagramMs: asNullableNumber(entry.firstDiagramMs),
          firstInteractionMs: asNullableNumber(entry.firstInteractionMs),
          totalCapturedEvents:
            typeof entry.totalCapturedEvents === "number" &&
            Number.isFinite(entry.totalCapturedEvents)
              ? Math.max(0, Math.round(entry.totalCapturedEvents))
              : 0,
        };
      })
      .filter((entry): entry is RouteInteractionBudget => entry !== null);

    return {
      generatedAt:
        typeof parsed.generatedAt === "string" ? parsed.generatedAt : new Date().toISOString(),
      routes,
    };
  } catch {
    return null;
  }
}

export function saveRouteInteractionBudgetSnapshotToStorage(
  snapshot: RouteInteractionBudgetSnapshot,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ROUTE_INTERACTION_BUDGET_STORAGE_KEY, JSON.stringify(snapshot));
}

export function updateRouteInteractionBudgetFromTimelineEvent(params: {
  current: RouteInteractionBudgetSnapshot | null;
  event: TimelineEvent;
}): RouteInteractionBudgetSnapshot {
  const route = params.event.route || "/";
  const currentRoutes = params.current?.routes ?? [];
  const nextRoutes = [...currentRoutes];
  const routeIndex = nextRoutes.findIndex((entry) => entry.route === route);
  const existing =
    routeIndex >= 0 ? nextRoutes[routeIndex] : createEmptyRouteInteractionBudget(route);
  const nextEntry: RouteInteractionBudget = {
    ...existing,
    totalCapturedEvents: existing.totalCapturedEvents + 1,
  };

  if (params.event.kind === "pager" && nextEntry.firstPagerMs === null) {
    nextEntry.firstPagerMs = params.event.relativeMs;
  }
  if (params.event.kind === "media" && nextEntry.firstMediaMs === null) {
    nextEntry.firstMediaMs = params.event.relativeMs;
  }
  if (
    (params.event.kind === "media" || params.event.kind === "pager") &&
    params.event.action.toLowerCase().includes("diagram") &&
    nextEntry.firstDiagramMs === null
  ) {
    nextEntry.firstDiagramMs = params.event.relativeMs;
  }
  if (params.event.kind === "interaction" && nextEntry.firstInteractionMs === null) {
    nextEntry.firstInteractionMs = params.event.relativeMs;
  }

  if (routeIndex >= 0) {
    nextRoutes[routeIndex] = nextEntry;
  } else {
    nextRoutes.push(nextEntry);
  }

  return {
    generatedAt: new Date().toISOString(),
    routes: nextRoutes.sort((left, right) => left.route.localeCompare(right.route)),
  };
}
