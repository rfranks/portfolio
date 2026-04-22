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

export type LongTaskSample = {
  name: string;
  duration: number;
  startTime: number;
};

export function observeLongTasks(
  onLongTask: (sample: LongTaskSample) => void,
  minDurationMs = 80,
): () => void {
  if (
    typeof PerformanceObserver === "undefined" ||
    typeof performance === "undefined" ||
    minDurationMs <= 0
  ) {
    return () => {};
  }

  let observer: PerformanceObserver | null = null;
  try {
    observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration < minDurationMs) {
          return;
        }

        onLongTask({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
        });
      });
    });

    observer.observe({ type: "longtask", buffered: true } as PerformanceObserverInit);
  } catch {
    observer?.disconnect();
    return () => {};
  }

  return () => observer?.disconnect();
}

export function measureAfterNextPaint(
  markName: string,
  onMeasured: (durationMs: number | null) => void,
): () => void {
  if (typeof window === "undefined") {
    onMeasured(null);
    return () => {};
  }

  let rafIdOne: number | null = null;
  let rafIdTwo: number | null = null;
  rafIdOne = window.requestAnimationFrame(() => {
    rafIdTwo = window.requestAnimationFrame(() => {
      const duration = markEnd(markName);
      onMeasured(duration);
    });
  });

  return () => {
    if (rafIdOne !== null) {
      window.cancelAnimationFrame(rafIdOne);
    }
    if (rafIdTwo !== null) {
      window.cancelAnimationFrame(rafIdTwo);
    }
  };
}
