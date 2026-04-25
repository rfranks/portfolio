import {
  MEDIA_RENDER_FIRST_RENDER_BUDGET_MS,
  MEDIA_RENDER_PERF_STORAGE_KEY,
} from "@/consts/observability/mediaRenderPerf";
import type {
  MediaRenderPerfSnapshot,
  MediaRenderPerfStatus,
  MediaRenderTrackedType,
  MediaRenderTypeSnapshot,
} from "@/types/observability/mediaRenderPerf";

const MEDIA_RENDER_TYPES: readonly MediaRenderTrackedType[] = ["image", "video", "pdf", "diagram"];

function isTrackedMediaType(value: string): value is MediaRenderTrackedType {
  return (MEDIA_RENDER_TYPES as readonly string[]).includes(value);
}

function resolveStatus(durationMs: number, budgetMs: number): MediaRenderPerfStatus {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return "unknown";
  }
  if (durationMs <= budgetMs) {
    return "pass";
  }
  if (durationMs <= budgetMs * 1.35) {
    return "warn";
  }
  return "fail";
}

function sortEntries(entries: MediaRenderTypeSnapshot[]): MediaRenderTypeSnapshot[] {
  const priority: Record<MediaRenderPerfStatus, number> = {
    fail: 4,
    warn: 3,
    unknown: 2,
    pass: 1,
  };
  return [...entries].sort((left, right) => {
    const statusDelta = priority[right.status] - priority[left.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }
    return left.mediaType.localeCompare(right.mediaType);
  });
}

export function loadMediaRenderPerfSnapshotFromStorage(): MediaRenderPerfSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(MEDIA_RENDER_PERF_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as MediaRenderPerfSnapshot;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.entries)) {
      return null;
    }

    const entries = parsed.entries
      .filter((entry) => entry && typeof entry === "object")
      .filter((entry) => isTrackedMediaType(entry.mediaType))
      .map((entry) => {
        const budgetMs = MEDIA_RENDER_FIRST_RENDER_BUDGET_MS[entry.mediaType];
        return {
          mediaType: entry.mediaType,
          count: Number.isFinite(entry.count) ? Math.max(0, entry.count) : 0,
          lastMs: Number.isFinite(entry.lastMs) ? Math.max(0, entry.lastMs) : 0,
          minMs: Number.isFinite(entry.minMs) ? Math.max(0, entry.minMs) : 0,
          maxMs: Number.isFinite(entry.maxMs) ? Math.max(0, entry.maxMs) : 0,
          avgMs: Number.isFinite(entry.avgMs) ? Math.max(0, entry.avgMs) : 0,
          budgetMs,
          status:
            entry.status === "pass" ||
            entry.status === "warn" ||
            entry.status === "fail" ||
            entry.status === "unknown"
              ? entry.status
              : "unknown",
          lastItemKey: typeof entry.lastItemKey === "string" ? entry.lastItemKey : null,
          lastRoute: typeof entry.lastRoute === "string" ? entry.lastRoute : null,
          lastRenderedAtIso:
            typeof entry.lastRenderedAtIso === "string" ? entry.lastRenderedAtIso : null,
        } satisfies MediaRenderTypeSnapshot;
      });

    return {
      generatedAt:
        typeof parsed.generatedAt === "string" && parsed.generatedAt.trim()
          ? parsed.generatedAt
          : new Date().toISOString(),
      entries: sortEntries(entries),
    };
  } catch {
    return null;
  }
}

export function saveMediaRenderPerfSnapshotToStorage(snapshot: MediaRenderPerfSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(MEDIA_RENDER_PERF_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore localStorage write failures
  }
}

export function updateMediaRenderPerfSnapshot(args: {
  current: MediaRenderPerfSnapshot | null;
  mediaType: string;
  durationMs: number;
  itemKey?: string | null;
  route?: string | null;
  atIso?: string;
}): MediaRenderPerfSnapshot | null {
  if (!isTrackedMediaType(args.mediaType)) {
    return args.current;
  }
  if (!Number.isFinite(args.durationMs) || args.durationMs <= 0) {
    return args.current;
  }

  const nextGeneratedAt = args.atIso ?? new Date().toISOString();
  const currentEntries = args.current?.entries ?? [];
  const budgetMs = MEDIA_RENDER_FIRST_RENDER_BUDGET_MS[args.mediaType];
  const currentEntry = currentEntries.find((entry) => entry.mediaType === args.mediaType);

  const nextEntry: MediaRenderTypeSnapshot = currentEntry
    ? {
        ...currentEntry,
        count: currentEntry.count + 1,
        lastMs: args.durationMs,
        minMs:
          currentEntry.count === 0
            ? args.durationMs
            : Math.min(currentEntry.minMs, args.durationMs),
        maxMs: Math.max(currentEntry.maxMs, args.durationMs),
        avgMs:
          (currentEntry.avgMs * currentEntry.count + args.durationMs) /
          Math.max(1, currentEntry.count + 1),
        budgetMs,
        status: resolveStatus(args.durationMs, budgetMs),
        lastItemKey: args.itemKey ?? null,
        lastRoute: args.route ?? null,
        lastRenderedAtIso: nextGeneratedAt,
      }
    : {
        mediaType: args.mediaType,
        count: 1,
        lastMs: args.durationMs,
        minMs: args.durationMs,
        maxMs: args.durationMs,
        avgMs: args.durationMs,
        budgetMs,
        status: resolveStatus(args.durationMs, budgetMs),
        lastItemKey: args.itemKey ?? null,
        lastRoute: args.route ?? null,
        lastRenderedAtIso: nextGeneratedAt,
      };

  const nextEntries = [
    ...currentEntries.filter((entry) => entry.mediaType !== args.mediaType),
    nextEntry,
  ];

  return {
    generatedAt: nextGeneratedAt,
    entries: sortEntries(nextEntries),
  };
}
