"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createLogger } from "@/utils/observability/logger";
import {
  markEnd,
  markStart,
  measureAfterNextPaint,
  observeLongTasks,
} from "@/utils/observability/perf";

const logger = createLogger("navigation");

export default function NavigationTelemetry() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const currentPathRef = useRef<string>(pathname);
  const interactionThrottleRef = useRef<number>(0);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const previousPath = previousPathRef.current;

    if (previousPath) {
      const transitionDuration = markEnd("route-transition");
      logger.info("Route transition", {
        from: previousPath,
        to: pathname,
        durationMs: transitionDuration === null ? null : Math.round(transitionDuration),
      });
    }

    const routeRenderMarkName = `route-render:${pathname}`;
    markStart(routeRenderMarkName);
    const cancelPaintMeasure = measureAfterNextPaint(routeRenderMarkName, (durationMs) => {
      logger.debug("Route render", {
        route: pathname,
        durationMs: durationMs === null ? null : Math.round(durationMs),
      });
    });

    previousPathRef.current = pathname;
    markStart("route-transition");

    return cancelPaintMeasure;
  }, [pathname]);

  useEffect(() => {
    const disconnect = observeLongTasks((sample) => {
      logger.warn("Long task", {
        route: currentPathRef.current,
        durationMs: Math.round(sample.duration),
        startTimeMs: Math.round(sample.startTime),
        name: sample.name,
      });
    });

    return disconnect;
  }, []);

  useEffect(() => {
    const recordInteraction = (event: Event) => {
      const now = Date.now();
      if (now - interactionThrottleRef.current < 250) {
        return;
      }
      interactionThrottleRef.current = now;

      const markName = `ui-interaction:${event.type}:${Math.round(performance.now())}`;
      markStart(markName);
      measureAfterNextPaint(markName, (durationMs) => {
        logger.debug("Interaction latency", {
          route: currentPathRef.current,
          eventType: event.type,
          durationMs: durationMs === null ? null : Math.round(durationMs),
        });
      });
    };

    window.addEventListener("pointerdown", recordInteraction, { passive: true });
    window.addEventListener("keydown", recordInteraction);

    return () => {
      window.removeEventListener("pointerdown", recordInteraction);
      window.removeEventListener("keydown", recordInteraction);
    };
  }, []);

  return null;
}
