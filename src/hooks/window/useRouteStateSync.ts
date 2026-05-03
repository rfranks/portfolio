import { useCallback, useEffect, useRef } from "react";

type RouteStateSyncEvent = "hashchange" | "popstate";

const DEFAULT_ROUTE_STATE_SYNC_EVENTS: readonly RouteStateSyncEvent[] = ["hashchange", "popstate"];

const toRoutePath = (value: string | URL): string =>
  value instanceof URL ? `${value.pathname}${value.search}${value.hash}` : value;

type UseRouteStateSyncParams = {
  enabled?: boolean;
  onLocationChange?: (location: Location) => void;
  listenToLocationEvents?: boolean;
  locationEvents?: readonly RouteStateSyncEvent[];
  syncOnMount?: boolean;
};

type UseRouteStateSyncResult = {
  getCurrentRoutePath: () => string | null;
  syncFromLocation: () => void;
  replaceRoutePathIfChanged: (nextRoute: string | URL) => boolean;
  pushRoutePathIfChanged: (nextRoute: string | URL) => boolean;
};

export function useRouteStateSync({
  enabled = true,
  onLocationChange,
  listenToLocationEvents = false,
  locationEvents = DEFAULT_ROUTE_STATE_SYNC_EVENTS,
  syncOnMount = true,
}: UseRouteStateSyncParams = {}): UseRouteStateSyncResult {
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  const getCurrentRoutePath = useCallback((): string | null => {
    if (typeof window === "undefined") {
      return null;
    }

    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }, []);

  const syncFromLocation = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    onLocationChangeRef.current?.(window.location);
  }, []);

  const replaceRoutePathIfChanged = useCallback(
    (nextRoute: string | URL): boolean => {
      if (typeof window === "undefined") {
        return false;
      }

      const currentPath = getCurrentRoutePath();
      if (!currentPath) {
        return false;
      }

      const nextPath = toRoutePath(nextRoute);
      if (currentPath === nextPath) {
        return false;
      }

      try {
        window.history.replaceState(window.history.state, "", nextPath);
        return true;
      } catch {
        return false;
      }
    },
    [getCurrentRoutePath],
  );

  const pushRoutePathIfChanged = useCallback(
    (nextRoute: string | URL): boolean => {
      if (typeof window === "undefined") {
        return false;
      }

      const currentPath = getCurrentRoutePath();
      if (!currentPath) {
        return false;
      }

      const nextPath = toRoutePath(nextRoute);
      if (currentPath === nextPath) {
        return false;
      }

      try {
        window.history.pushState(null, "", nextPath);
        return true;
      } catch {
        return false;
      }
    },
    [getCurrentRoutePath],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (syncOnMount) {
      syncFromLocation();
    }

    if (!listenToLocationEvents || typeof window === "undefined") {
      return;
    }

    const handleLocationChange = () => {
      syncFromLocation();
    };

    locationEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleLocationChange);
    });

    return () => {
      locationEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleLocationChange);
      });
    };
  }, [enabled, listenToLocationEvents, locationEvents, syncFromLocation, syncOnMount]);

  return {
    getCurrentRoutePath,
    syncFromLocation,
    replaceRoutePathIfChanged,
    pushRoutePathIfChanged,
  };
}
