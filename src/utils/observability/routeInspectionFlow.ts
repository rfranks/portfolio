import type { TimelineEventKind } from "@/types/observability/navigationTelemetry";
import { SESSION_REPLAY_EVENT_KIND_ORDER } from "@/utils/observability/sessionReplayLite";

export type RouteInspectionFlowSource = "capability" | "health";

export type RouteInspectionFlowQuery = {
  route: string | null;
  source: RouteInspectionFlowSource | null;
  kinds: TimelineEventKind[];
};

const ROUTE_QUERY_KEY = "route";
const SOURCE_QUERY_KEY = "source";
const KINDS_QUERY_KEY = "kinds";

const DEFAULT_EVENT_KINDS = [...SESSION_REPLAY_EVENT_KIND_ORDER];

const isRouteInspectionFlowSource = (value: unknown): value is RouteInspectionFlowSource =>
  value === "capability" || value === "health";

const asNonEmptyString = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export function normalizeRouteInspectionRoute(route: string | null | undefined): string | null {
  const value = asNonEmptyString(route);
  if (!value) {
    return null;
  }

  return value.startsWith("/") ? value : `/${value}`;
}

function normalizeRouteInspectionKinds(
  kinds: readonly TimelineEventKind[] | null | undefined,
): TimelineEventKind[] {
  if (!kinds?.length) {
    return [];
  }

  const kindSet = new Set<TimelineEventKind>();
  SESSION_REPLAY_EVENT_KIND_ORDER.forEach((kind) => {
    if (kinds.includes(kind)) {
      kindSet.add(kind);
    }
  });

  return Array.from(kindSet);
}

function parseRouteInspectionKindsToken(value: string | null): TimelineEventKind[] {
  const token = asNonEmptyString(value);
  if (!token) {
    return [];
  }

  const requestedKinds = token.split(",").map((entry) => entry.trim());
  return normalizeRouteInspectionKinds(
    requestedKinds.filter((entry): entry is TimelineEventKind =>
      SESSION_REPLAY_EVENT_KIND_ORDER.includes(entry as TimelineEventKind),
    ),
  );
}

function serializeRouteInspectionKindsToken(kinds: readonly TimelineEventKind[]): string | null {
  const normalizedKinds = normalizeRouteInspectionKinds(kinds);
  if (!normalizedKinds.length) {
    return null;
  }

  const defaultSet = new Set(DEFAULT_EVENT_KINDS);
  const sameAsDefault =
    normalizedKinds.length === DEFAULT_EVENT_KINDS.length &&
    normalizedKinds.every((kind) => defaultSet.has(kind));

  if (sameAsDefault) {
    return null;
  }

  return normalizedKinds.join(",");
}

export function parseRouteInspectionFlowSearch(search: string): RouteInspectionFlowQuery {
  const params = new URLSearchParams(search);
  const route = normalizeRouteInspectionRoute(params.get(ROUTE_QUERY_KEY));
  const sourceToken = asNonEmptyString(params.get(SOURCE_QUERY_KEY));
  const source = isRouteInspectionFlowSource(sourceToken) ? sourceToken : null;
  const kinds = parseRouteInspectionKindsToken(params.get(KINDS_QUERY_KEY));

  return {
    route,
    source,
    kinds,
  };
}

export function buildRouteInspectionFlowSearch(params: {
  route?: string | null;
  source?: RouteInspectionFlowSource | null;
  kinds?: readonly TimelineEventKind[] | null;
}): string {
  const searchParams = new URLSearchParams();
  const route = normalizeRouteInspectionRoute(params.route);
  if (route) {
    searchParams.set(ROUTE_QUERY_KEY, route);
  }

  if (params.source) {
    searchParams.set(SOURCE_QUERY_KEY, params.source);
  }

  const kindsToken = serializeRouteInspectionKindsToken(params.kinds ?? []);
  if (kindsToken) {
    searchParams.set(KINDS_QUERY_KEY, kindsToken);
  }

  return searchParams.toString();
}

function buildRouteInspectionHref(
  pathname: string,
  params: {
    route?: string | null;
    source?: RouteInspectionFlowSource | null;
    kinds?: readonly TimelineEventKind[] | null;
  },
): string {
  const search = buildRouteInspectionFlowSearch(params);
  return search ? `${pathname}?${search}` : pathname;
}

export function buildHealthInspectionHref(params: {
  healthRoute: string;
  route?: string | null;
  source?: RouteInspectionFlowSource | null;
}): string {
  return buildRouteInspectionHref(params.healthRoute, {
    route: params.route,
    source: params.source,
  });
}

export function buildReplayInspectionHref(params: {
  replayRoute: string;
  route?: string | null;
  source?: RouteInspectionFlowSource | null;
  kinds?: readonly TimelineEventKind[] | null;
}): string {
  return buildRouteInspectionHref(params.replayRoute, {
    route: params.route,
    source: params.source,
    kinds: params.kinds,
  });
}
