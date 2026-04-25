import type {
  MediaRenderPerfSnapshot,
  MediaRenderPerfStatus,
} from "@/types/observability/mediaRenderPerf";
import type { RouteInteractionBudgetSnapshot } from "@/types/observability/routeInteractionBudgets";
import type {
  AggregateHealthSnapshot,
  BundleRouteSnapshot,
  HealthRouteStatusDetail,
  HealthSnapshotEnvelope,
  HealthSnapshotKey,
  HealthStatus,
} from "@/types/observability/healthSnapshots";

const HEALTH_SNAPSHOT_KEYS: readonly HealthSnapshotKey[] = [
  "bundleBudget",
  "fileBudgets",
  "schemaValidation",
  "testRunner",
  "a11yRunner",
  "typecheckRunner",
];

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function toHealthStatus(value: unknown): HealthStatus {
  if (value === "pass" || value === "warn" || value === "fail" || value === "unknown") {
    return value;
  }
  return "unknown";
}

export function healthStatusToChipColor(
  status: HealthStatus,
): "success" | "warning" | "error" | "default" {
  if (status === "pass") {
    return "success";
  }
  if (status === "warn") {
    return "warning";
  }
  if (status === "fail") {
    return "error";
  }
  return "default";
}

function parseSnapshotEnvelope(
  rawSnapshot: unknown,
  key: HealthSnapshotKey,
): HealthSnapshotEnvelope | null {
  const snapshot = asRecord(rawSnapshot);
  if (!snapshot) {
    return null;
  }

  return {
    key,
    status: toHealthStatus(snapshot.status),
    generatedAt: typeof snapshot.generatedAt === "string" ? snapshot.generatedAt : undefined,
    summary: typeof snapshot.summary === "string" ? snapshot.summary : undefined,
    details: asRecord(snapshot.details) ?? {},
  };
}

export function parseAggregateHealthSnapshot(value: unknown): AggregateHealthSnapshot | null {
  const snapshot = asRecord(value);
  if (!snapshot) {
    return null;
  }

  const checksSource = asRecord(snapshot.checks);
  const snapshotsSource = asRecord(snapshot.snapshots);
  const checks: Partial<Record<HealthSnapshotKey, HealthStatus>> = {};
  const snapshots: Partial<Record<HealthSnapshotKey, HealthSnapshotEnvelope>> = {};

  HEALTH_SNAPSHOT_KEYS.forEach((key) => {
    if (checksSource) {
      checks[key] = toHealthStatus(checksSource[key]);
    }

    if (snapshotsSource) {
      const parsedEnvelope = parseSnapshotEnvelope(snapshotsSource[key], key);
      if (parsedEnvelope) {
        snapshots[key] = parsedEnvelope;
      }
    }
  });

  return {
    generatedAt: typeof snapshot.generatedAt === "string" ? snapshot.generatedAt : undefined,
    overallStatus: toHealthStatus(snapshot.overallStatus),
    checks,
    snapshots,
  };
}

export function formatHealthTimestamp(value: string | undefined): string {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function readNestedStatus(details: Record<string, unknown>, key: string): HealthStatus {
  const nested = asRecord(details[key]);
  return toHealthStatus(nested?.status);
}

export function readNestedFiniteCount(
  details: Record<string, unknown>,
  key: string,
  countKey: string,
): number | null {
  const nested = asRecord(details[key]);
  const count = nested?.[countKey];
  if (typeof count === "number" && Number.isFinite(count)) {
    return count;
  }
  return null;
}

export function readBundleRouteMap(
  snapshot: AggregateHealthSnapshot | null,
): Map<string, BundleRouteSnapshot> {
  const map = new Map<string, BundleRouteSnapshot>();
  const details = snapshot?.snapshots.bundleBudget?.details ?? {};
  const routeArray = Array.isArray(details.routes) ? details.routes : [];

  routeArray.forEach((entry) => {
    const record = asRecord(entry);
    if (!record || typeof record.route !== "string" || typeof record.withinBudget !== "boolean") {
      return;
    }

    map.set(record.route, {
      route: record.route,
      withinBudget: record.withinBudget,
      totalKb:
        typeof record.totalKb === "number" && Number.isFinite(record.totalKb)
          ? record.totalKb
          : undefined,
      largestKb:
        typeof record.largestKb === "number" && Number.isFinite(record.largestKb)
          ? record.largestKb
          : undefined,
    });
  });

  return map;
}

export function deriveRouteInteractionBudgetStatus(
  snapshot: RouteInteractionBudgetSnapshot | null,
): HealthStatus {
  const routes = snapshot?.routes ?? [];
  if (routes.length === 0) {
    return "unknown";
  }

  const routesWithAnyFirstInteraction = routes.filter(
    (route) =>
      route.firstInteractionMs !== null ||
      route.firstMediaMs !== null ||
      route.firstPagerMs !== null,
  ).length;
  return routesWithAnyFirstInteraction === routes.length ? "pass" : "warn";
}

export function deriveMediaRenderPerfStatus(
  snapshot: MediaRenderPerfSnapshot | null,
): HealthStatus {
  const entries = snapshot?.entries ?? [];
  if (entries.length === 0) {
    return "unknown";
  }
  if (entries.some((entry) => entry.status === "fail")) {
    return "fail";
  }
  if (entries.some((entry) => entry.status === "warn")) {
    return "warn";
  }
  return "pass";
}

export function resolveRouteInteractionStatus(
  routeSnapshot: RouteInteractionBudgetSnapshot | null,
  href: string,
): HealthRouteStatusDetail {
  const route = routeSnapshot?.routes.find((entry) => entry.route === href);
  if (!route) {
    return { status: "unknown", detail: "No route interaction snapshot yet." };
  }

  const hasAnySignal =
    route.firstInteractionMs !== null || route.firstMediaMs !== null || route.firstPagerMs !== null;

  if (!hasAnySignal) {
    return {
      status: "warn",
      detail: "Route captured but no interaction/media/pager timings yet.",
    };
  }

  return {
    status: "pass",
    detail: `interaction ${route.firstInteractionMs ?? "—"}ms • media ${route.firstMediaMs ?? "—"}ms • pager ${route.firstPagerMs ?? "—"}ms`,
  };
}

export function resolveRouteMediaStatus(
  mediaSnapshot: MediaRenderPerfSnapshot | null,
  href: string,
): HealthRouteStatusDetail {
  const relatedEntries = (mediaSnapshot?.entries ?? []).filter((entry) => entry.lastRoute === href);
  if (!relatedEntries.length) {
    return { status: "unknown", detail: "No route-scoped media render measurements yet." };
  }

  const rank: Record<MediaRenderPerfStatus, number> = {
    fail: 4,
    warn: 3,
    unknown: 2,
    pass: 1,
  };
  const worst = relatedEntries.reduce((current, next) =>
    rank[next.status] > rank[current.status] ? next : current,
  );

  return {
    status: toHealthStatus(worst.status),
    detail: relatedEntries
      .map((entry) => `${entry.mediaType} ${Math.round(entry.lastMs)}ms`)
      .join(" • "),
  };
}
