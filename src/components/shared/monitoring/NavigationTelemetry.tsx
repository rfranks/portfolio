"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createLogger } from "@/utils/observability/logger";
import { markEnd, markStart } from "@/utils/observability/perf";

const logger = createLogger("navigation");

export default function NavigationTelemetry() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const previousPath = previousPathRef.current;

    if (previousPath) {
      markEnd("route-transition");
      logger.info("Route transition", {
        from: previousPath,
        to: pathname,
      });
    }

    previousPathRef.current = pathname;
    markStart("route-transition");
  }, [pathname]);

  return null;
}
