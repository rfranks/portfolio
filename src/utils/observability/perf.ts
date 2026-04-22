import { createLogger } from "@/utils/observability/logger";

const perfLogger = createLogger("perf");

export function markStart(markName: string): void {
  if (typeof performance === "undefined") {
    return;
  }

  performance.mark(`${markName}:start`);
}

export function markEnd(markName: string): number | null {
  if (typeof performance === "undefined") {
    return null;
  }

  const start = `${markName}:start`;
  const end = `${markName}:end`;
  const measure = `${markName}:duration`;

  performance.mark(end);

  try {
    performance.measure(measure, start, end);
    const entries = performance.getEntriesByName(measure);
    const latest = entries[entries.length - 1];
    const duration = latest?.duration ?? null;

    if (duration !== null) {
      perfLogger.debug(`${markName} ${Math.round(duration)}ms`);
    }

    performance.clearMarks(start);
    performance.clearMarks(end);
    performance.clearMeasures(measure);

    return duration;
  } catch {
    return null;
  }
}
