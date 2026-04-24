import * as React from "react";
import {
  DEFAULT_INITIAL_STATE,
  INTERACTIVE_VIEWPORT_PRESET_DEFAULTS,
} from "@/hooks/html/panZoomViewportDefaults";
import { normalizeViewportSnapshot } from "@/hooks/html/panZoomViewportSnapshot";
import type {
  PanZoomTransformState,
  PanZoomViewportAutoFitAlign,
  PanZoomViewportPreferences,
  PanZoomViewportSnapshot,
  PanZoomViewportZoomMode,
} from "@/types/hooks/panZoomViewport";
import type { UsePanZoomViewportOptions } from "@/types/hooks/usePanZoomViewport";

export { buildInteractiveViewportGridSx } from "@/hooks/html/panZoomViewportSnapshot";
export {
  deserializePanZoomViewportSnapshot,
  serializePanZoomViewportSnapshot,
} from "@/hooks/html/panZoomViewportSnapshot";
export type { InteractiveViewportPreset } from "@/types/hooks/panZoomViewport";
export type {
  PanZoomTransformState,
  PanZoomViewportAutoFitAlign,
  PanZoomViewportPreferences,
  PanZoomViewportSnapshot,
  PanZoomViewportZoomMode,
} from "@/types/hooks/panZoomViewport";
export type { UsePanZoomViewportOptions } from "@/types/hooks/usePanZoomViewport";

const normalizeCalibrationToken = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : null;
};

export function usePanZoomViewport(options: UsePanZoomViewportOptions = {}) {
  const preset = options.preset ?? "media";
  const presetDefaults = INTERACTIVE_VIEWPORT_PRESET_DEFAULTS[preset];
  const {
    initialState = DEFAULT_INITIAL_STATE,
    preferencesStorageKey,
    calibrationMediaType,
    calibrationSection,
    calibrationProfileNamespace,
    initialPreferences,
    minScale = presetDefaults.minScale,
    maxScale = presetDefaults.maxScale,
    panStep = presetDefaults.panStep,
    clickZoomFactor = presetDefaults.clickZoomFactor,
    iconZoomFactor = presetDefaults.iconZoomFactor,
    doubleClickZoomFactor = presetDefaults.doubleClickZoomFactor,
    panCalibrationAlpha = presetDefaults.panCalibrationAlpha,
    panReferenceDelta = panStep * presetDefaults.panReferenceDeltaMultiplier,
    minPanEma = presetDefaults.minPanEma,
    minPanDeltaMultiplier = presetDefaults.minPanDeltaMultiplier,
    maxPanDeltaMultiplier = presetDefaults.maxPanDeltaMultiplier,
    wheelCalibrationAlpha = presetDefaults.wheelCalibrationAlpha,
    wheelNormalizedGain = presetDefaults.wheelNormalizedGain,
    pinchCalibrationAlpha = presetDefaults.pinchCalibrationAlpha,
    pinchNormalizedGain = presetDefaults.pinchNormalizedGain,
    minWheelEma = presetDefaults.minWheelEma,
    minPinchLogEma = presetDefaults.minPinchLogEma,
    shouldIgnorePointerTarget,
  } = options;

  const initialStateRef = React.useRef<PanZoomTransformState>({
    scale: initialState.scale,
    translateX: initialState.translateX,
    translateY: initialState.translateY,
  });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const wheelFrameRef = React.useRef<number | null>(null);
  const pendingWheelScaleRef = React.useRef<number | null>(null);
  const pendingWheelPointerRef = React.useRef<{ x: number; y: number } | null>(null);
  const wheelDeltaEmaRef = React.useRef(16);
  const wheelCommitTimeoutRef = React.useRef<number | null>(null);
  const calibrationPersistTimeoutRef = React.useRef<number | null>(null);
  const pinchDistanceRef = React.useRef<number | null>(null);
  const pinchMidpointRef = React.useRef<{ x: number; y: number } | null>(null);
  const pinchLogEmaRef = React.useRef(0.012);
  const panDeltaEmaRef = React.useRef(8);
  const deviceProfileRef = React.useRef<"pointer" | "touch">("pointer");

  const [scale, setScale] = React.useState(initialState.scale);
  const [translateX, setTranslateX] = React.useState(initialState.translateX);
  const [translateY, setTranslateY] = React.useState(initialState.translateY);
  const [isDragging, setIsDragging] = React.useState(false);
  const [lastPointerPos, setLastPointerPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  const transformRef = React.useRef<PanZoomTransformState>({
    scale: initialState.scale,
    translateX: initialState.translateX,
    translateY: initialState.translateY,
  });

  const [history, setHistory] = React.useState<PanZoomTransformState[]>([
    {
      scale: initialState.scale,
      translateX: initialState.translateX,
      translateY: initialState.translateY,
    },
  ]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const [viewportPreferences, setViewportPreferences] = React.useState<PanZoomViewportPreferences>(
    initialPreferences ?? {},
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const maxGestureStepFactor = Math.max(clickZoomFactor, iconZoomFactor, doubleClickZoomFactor);
  const minGestureStepFactor = 1 / maxGestureStepFactor;
  const [resolvedCalibrationSection, setResolvedCalibrationSection] = React.useState<string | null>(
    () => normalizeCalibrationToken(calibrationSection),
  );

  React.useEffect(() => {
    const explicitSection = normalizeCalibrationToken(calibrationSection);
    if (explicitSection) {
      setResolvedCalibrationSection(explicitSection);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const inferredSection =
      normalizeCalibrationToken(params.get("section")) ??
      normalizeCalibrationToken(params.get("slide")) ??
      normalizeCalibrationToken(params.get("panel")) ??
      normalizeCalibrationToken(window.location.pathname.split("/").filter(Boolean)[0]);
    if (inferredSection) {
      setResolvedCalibrationSection(inferredSection);
    }
  }, [calibrationSection]);

  const calibrationStorageKey = React.useMemo(() => {
    const scopeTokens = [
      normalizeCalibrationToken(calibrationProfileNamespace),
      normalizeCalibrationToken(preset),
      normalizeCalibrationToken(calibrationMediaType),
      resolvedCalibrationSection,
    ].filter((token): token is string => Boolean(token));

    const scopeKey = scopeTokens.join(":");
    if (scopeKey) {
      return `panzoom:gesture-calibration:${scopeKey}`;
    }

    if (preferencesStorageKey) {
      return `${preferencesStorageKey}:gesture-calibration`;
    }

    return "panzoom:gesture-calibration:default";
  }, [
    calibrationMediaType,
    calibrationProfileNamespace,
    preferencesStorageKey,
    preset,
    resolvedCalibrationSection,
  ]);

  const clampScale = React.useCallback(
    (value: number) => Math.min(maxScale, Math.max(minScale, value)),
    [maxScale, minScale],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const prefersCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    const hasTouch = (window.navigator?.maxTouchPoints ?? 0) > 0;
    deviceProfileRef.current = hasTouch || prefersCoarsePointer ? "touch" : "pointer";
  }, []);

  React.useEffect(() => {
    if (!preferencesStorageKey || typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(preferencesStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as PanZoomViewportPreferences;
      if (!parsed || typeof parsed !== "object") {
        return;
      }
      setViewportPreferences((current) => ({ ...current, ...parsed }));
    } catch {
      // ignore malformed preference payloads
    }
  }, [preferencesStorageKey]);

  React.useEffect(() => {
    if (!calibrationStorageKey || typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(calibrationStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Record<
        string,
        { wheelDeltaEma?: number; pinchLogEma?: number; panDeltaEma?: number }
      >;
      const profile = deviceProfileRef.current;
      const profileCalibration = parsed?.[profile];
      if (!profileCalibration || typeof profileCalibration !== "object") {
        return;
      }
      if (
        typeof profileCalibration.wheelDeltaEma === "number" &&
        Number.isFinite(profileCalibration.wheelDeltaEma)
      ) {
        wheelDeltaEmaRef.current = Math.max(minWheelEma, profileCalibration.wheelDeltaEma);
      }
      if (
        typeof profileCalibration.pinchLogEma === "number" &&
        Number.isFinite(profileCalibration.pinchLogEma)
      ) {
        pinchLogEmaRef.current = Math.max(minPinchLogEma, profileCalibration.pinchLogEma);
      }
      if (
        typeof profileCalibration.panDeltaEma === "number" &&
        Number.isFinite(profileCalibration.panDeltaEma)
      ) {
        panDeltaEmaRef.current = Math.max(minPanEma, profileCalibration.panDeltaEma);
      }
    } catch {
      // ignore malformed calibration payloads
    }
  }, [calibrationStorageKey, minPanEma, minPinchLogEma, minWheelEma]);

  const queueCalibrationPersist = React.useCallback(() => {
    if (!calibrationStorageKey || typeof window === "undefined") {
      return;
    }

    if (calibrationPersistTimeoutRef.current !== null) {
      window.clearTimeout(calibrationPersistTimeoutRef.current);
    }
    calibrationPersistTimeoutRef.current = window.setTimeout(() => {
      calibrationPersistTimeoutRef.current = null;
      try {
        const currentRaw = window.localStorage.getItem(calibrationStorageKey);
        const current = currentRaw ? (JSON.parse(currentRaw) as Record<string, unknown>) : {};
        const profile = deviceProfileRef.current;
        const next = {
          ...(typeof current === "object" && current ? current : {}),
          [profile]: {
            wheelDeltaEma: wheelDeltaEmaRef.current,
            pinchLogEma: pinchLogEmaRef.current,
            panDeltaEma: panDeltaEmaRef.current,
          },
        };
        window.localStorage.setItem(calibrationStorageKey, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
    }, 220);
  }, [calibrationStorageKey]);

  const updateViewportPreferences = React.useCallback(
    (patch: Partial<PanZoomViewportPreferences>) => {
      setViewportPreferences((current) => {
        const next = { ...current, ...patch };
        if (preferencesStorageKey && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(preferencesStorageKey, JSON.stringify(next));
          } catch {
            // ignore storage write failures
          }
        }
        return next;
      });
    },
    [preferencesStorageKey],
  );

  const pushHistory = React.useCallback(
    (st: PanZoomTransformState) => {
      setHistory((prevHistory) => {
        const truncated = prevHistory.slice(0, historyIndex + 1);
        const last = truncated[truncated.length - 1];
        if (
          last?.scale === st.scale &&
          last?.translateX === st.translateX &&
          last?.translateY === st.translateY
        ) {
          return prevHistory;
        }
        const updated = [...truncated, st];
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    },
    [historyIndex],
  );

  const applyTransformState = React.useCallback((st: PanZoomTransformState) => {
    transformRef.current = st;
    setScale(st.scale);
    setTranslateX(st.translateX);
    setTranslateY(st.translateY);
  }, []);

  const applyFitTransform = React.useCallback((st: PanZoomTransformState) => {
    transformRef.current = st;
    setScale(st.scale);
    setTranslateX(st.translateX);
    setTranslateY(st.translateY);
    setHistory([st]);
    setHistoryIndex(0);
  }, []);

  const doTransform = React.useCallback(
    (newScale: number, newX: number, newY: number) => {
      const st: PanZoomTransformState = {
        scale: newScale,
        translateX: newX,
        translateY: newY,
      };
      applyTransformState(st);
      pushHistory(st);
    },
    [applyTransformState, pushHistory],
  );

  const zoomAtViewportPoint = React.useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      const viewport = viewportRef.current;
      if (!viewport) {
        doTransform(nextScale, transformRef.current.translateX, transformRef.current.translateY);
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const pointX = clientX - viewportRect.left;
      const pointY = clientY - viewportRect.top;
      const currentScale = transformRef.current.scale;
      const currentTranslateX = transformRef.current.translateX;
      const currentTranslateY = transformRef.current.translateY;

      const contentX = (pointX - currentTranslateX) / currentScale;
      const contentY = (pointY - currentTranslateY) / currentScale;

      const nextTranslateX = pointX - contentX * nextScale;
      const nextTranslateY = pointY - contentY * nextScale;
      doTransform(nextScale, nextTranslateX, nextTranslateY);
    },
    [doTransform],
  );

  const normalizePanDelta = React.useCallback(
    (dx: number, dy: number) => {
      const magnitude = Math.hypot(dx, dy);
      if (!Number.isFinite(magnitude) || magnitude <= 0) {
        return { dx, dy };
      }

      panDeltaEmaRef.current =
        panDeltaEmaRef.current * (1 - panCalibrationAlpha) + magnitude * panCalibrationAlpha;
      queueCalibrationPersist();
      const panDeltaMultiplier = Math.min(
        maxPanDeltaMultiplier,
        Math.max(
          minPanDeltaMultiplier,
          panReferenceDelta / Math.max(minPanEma, panDeltaEmaRef.current),
        ),
      );

      return {
        dx: dx * panDeltaMultiplier,
        dy: dy * panDeltaMultiplier,
      };
    },
    [
      maxPanDeltaMultiplier,
      minPanDeltaMultiplier,
      minPanEma,
      panCalibrationAlpha,
      panReferenceDelta,
      queueCalibrationPersist,
    ],
  );

  const handleZoomIn = React.useCallback(() => {
    const nextScale = clampScale(transformRef.current.scale * iconZoomFactor);
    doTransform(nextScale, transformRef.current.translateX, transformRef.current.translateY);
    updateViewportPreferences({ lastZoomMode: "icon" });
  }, [clampScale, doTransform, iconZoomFactor, updateViewportPreferences]);

  const handleZoomOut = React.useCallback(() => {
    const nextScale = clampScale(transformRef.current.scale / iconZoomFactor);
    doTransform(nextScale, transformRef.current.translateX, transformRef.current.translateY);
    updateViewportPreferences({ lastZoomMode: "icon" });
  }, [clampScale, doTransform, iconZoomFactor, updateViewportPreferences]);

  const handleReset = React.useCallback(() => {
    applyFitTransform(initialStateRef.current);
  }, [applyFitTransform]);

  const handlePanUp = React.useCallback(() => {
    doTransform(
      transformRef.current.scale,
      transformRef.current.translateX,
      transformRef.current.translateY - panStep,
    );
  }, [doTransform, panStep]);

  const handlePanDown = React.useCallback(() => {
    doTransform(
      transformRef.current.scale,
      transformRef.current.translateX,
      transformRef.current.translateY + panStep,
    );
  }, [doTransform, panStep]);

  const handlePanLeft = React.useCallback(() => {
    doTransform(
      transformRef.current.scale,
      transformRef.current.translateX - panStep,
      transformRef.current.translateY,
    );
  }, [doTransform, panStep]);

  const handlePanRight = React.useCallback(() => {
    doTransform(
      transformRef.current.scale,
      transformRef.current.translateX + panStep,
      transformRef.current.translateY,
    );
  }, [doTransform, panStep]);

  const handleUndo = React.useCallback(() => {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    applyTransformState(history[nextIndex]);
  }, [applyTransformState, canUndo, history, historyIndex]);

  const handleRedo = React.useCallback(() => {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    applyTransformState(history[nextIndex]);
  }, [applyTransformState, canRedo, history, historyIndex]);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pinchDistanceRef.current !== null) return;
      const target = e.target as HTMLElement;
      if (target && shouldIgnorePointerTarget?.(target)) {
        return;
      }

      if (e.ctrlKey && e.button === 0) {
        e.stopPropagation();
        e.preventDefault();
        const nextScale = clampScale(transformRef.current.scale * clickZoomFactor);
        zoomAtViewportPoint(e.clientX, e.clientY, nextScale);
        updateViewportPreferences({ lastZoomMode: "click" });
        return;
      }
      if (e.shiftKey && e.button === 0) {
        e.stopPropagation();
        e.preventDefault();
        const nextScale = clampScale(transformRef.current.scale / clickZoomFactor);
        zoomAtViewportPoint(e.clientX, e.clientY, nextScale);
        updateViewportPreferences({ lastZoomMode: "click" });
        return;
      }

      if (e.button === 0) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        setLastPointerPos({ x: e.clientX, y: e.clientY });
      }
    },
    [
      clampScale,
      clickZoomFactor,
      shouldIgnorePointerTarget,
      updateViewportPreferences,
      zoomAtViewportPoint,
    ],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pinchDistanceRef.current !== null) return;
      if (!isDragging || !lastPointerPos) return;
      const rawDx = e.clientX - lastPointerPos.x;
      const rawDy = e.clientY - lastPointerPos.y;
      const { dx, dy } = normalizePanDelta(rawDx, rawDy);
      const nextTranslateX = transformRef.current.translateX + dx;
      const nextTranslateY = transformRef.current.translateY + dy;
      setTranslateX(nextTranslateX);
      setTranslateY(nextTranslateY);
      transformRef.current = {
        scale: transformRef.current.scale,
        translateX: nextTranslateX,
        translateY: nextTranslateY,
      };
      setLastPointerPos({ x: e.clientX, y: e.clientY });
    },
    [isDragging, lastPointerPos, normalizePanDelta],
  );

  const handlePointerUpOrLeave = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (pinchDistanceRef.current !== null) return;
      if (isDragging) {
        pushHistory(transformRef.current);
      }
      setIsDragging(false);
      setLastPointerPos(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // pointer might already be released
      }
    },
    [isDragging, pushHistory],
  );

  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target && shouldIgnorePointerTarget?.(target)) {
        return;
      }

      e.stopPropagation();
      e.preventDefault();
      const nextScale = clampScale(transformRef.current.scale * doubleClickZoomFactor);
      zoomAtViewportPoint(e.clientX, e.clientY, nextScale);
      updateViewportPreferences({ lastZoomMode: "doubleClick" });
    },
    [
      clampScale,
      doubleClickZoomFactor,
      shouldIgnorePointerTarget,
      updateViewportPreferences,
      zoomAtViewportPoint,
    ],
  );

  const getTouchDistance = (touchA: Touch, touchB: Touch) =>
    Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);
  const getTouchMidpoint = (touchA: Touch, touchB: Touch) => ({
    x: (touchA.clientX + touchB.clientX) / 2,
    y: (touchA.clientY + touchB.clientY) / 2,
  });

  const handleWheel = React.useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();

      const baseScale = pendingWheelScaleRef.current ?? transformRef.current.scale;
      const absDelta = Math.abs(e.deltaY);
      wheelDeltaEmaRef.current =
        wheelDeltaEmaRef.current * (1 - wheelCalibrationAlpha) + absDelta * wheelCalibrationAlpha;
      queueCalibrationPersist();
      const normalizedDelta = e.deltaY / Math.max(minWheelEma, wheelDeltaEmaRef.current);
      const rawWheelFactor = Math.exp(-normalizedDelta * wheelNormalizedGain);
      const boundedWheelFactor = Math.min(
        maxGestureStepFactor,
        Math.max(minGestureStepFactor, rawWheelFactor),
      );
      const nextScale = clampScale(baseScale * boundedWheelFactor);
      updateViewportPreferences({ lastZoomMode: "wheel" });
      pendingWheelScaleRef.current = nextScale;
      pendingWheelPointerRef.current = { x: e.clientX, y: e.clientY };

      if (wheelFrameRef.current === null) {
        wheelFrameRef.current = window.requestAnimationFrame(() => {
          wheelFrameRef.current = null;
          const framedScale = pendingWheelScaleRef.current;
          if (framedScale == null) {
            return;
          }

          const viewport = viewportRef.current;
          const pointer = pendingWheelPointerRef.current;
          if (!viewport || !pointer) {
            const nextState: PanZoomTransformState = {
              scale: framedScale,
              translateX: transformRef.current.translateX,
              translateY: transformRef.current.translateY,
            };
            applyTransformState(nextState);
          } else {
            const viewportRect = viewport.getBoundingClientRect();
            const pointX = pointer.x - viewportRect.left;
            const pointY = pointer.y - viewportRect.top;
            const currentScale = transformRef.current.scale;
            const currentTranslateX = transformRef.current.translateX;
            const currentTranslateY = transformRef.current.translateY;
            const contentX = (pointX - currentTranslateX) / currentScale;
            const contentY = (pointY - currentTranslateY) / currentScale;
            const nextTranslateX = pointX - contentX * framedScale;
            const nextTranslateY = pointY - contentY * framedScale;
            applyTransformState({
              scale: framedScale,
              translateX: nextTranslateX,
              translateY: nextTranslateY,
            });
          }

          pendingWheelScaleRef.current = null;
          pendingWheelPointerRef.current = null;
        });
      }

      if (wheelCommitTimeoutRef.current !== null) {
        window.clearTimeout(wheelCommitTimeoutRef.current);
      }
      wheelCommitTimeoutRef.current = window.setTimeout(() => {
        wheelCommitTimeoutRef.current = null;
        pushHistory(transformRef.current);
      }, 110);
    },
    [
      applyTransformState,
      clampScale,
      maxGestureStepFactor,
      minGestureStepFactor,
      minWheelEma,
      pushHistory,
      queueCalibrationPersist,
      wheelCalibrationAlpha,
      wheelNormalizedGain,
      updateViewportPreferences,
    ],
  );

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    pinchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
    pinchMidpointRef.current = getTouchMidpoint(e.touches[0], e.touches[1]);
    setIsDragging(false);
    setLastPointerPos(null);
  }, []);

  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      e.stopPropagation();

      const previousDistance = pinchDistanceRef.current;
      const nextDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const nextMidpoint = getTouchMidpoint(e.touches[0], e.touches[1]);
      if (!previousDistance || previousDistance <= 0 || nextDistance <= 0) {
        pinchDistanceRef.current = nextDistance;
        pinchMidpointRef.current = nextMidpoint;
        return;
      }

      const pinchRatio = nextDistance / previousDistance;
      const pinchLogDelta = Math.log(pinchRatio);
      if (Number.isFinite(pinchLogDelta) && Math.abs(pinchLogDelta) > 0) {
        pinchLogEmaRef.current =
          pinchLogEmaRef.current * (1 - pinchCalibrationAlpha) +
          Math.abs(pinchLogDelta) * pinchCalibrationAlpha;
        queueCalibrationPersist();
      }
      const normalizedPinchDelta = pinchLogDelta / Math.max(minPinchLogEma, pinchLogEmaRef.current);
      const amplifiedRatio = Math.min(
        maxGestureStepFactor,
        Math.max(minGestureStepFactor, Math.exp(normalizedPinchDelta * pinchNormalizedGain)),
      );
      const currentScale = transformRef.current.scale;
      const nextScale = clampScale(currentScale * amplifiedRatio);
      updateViewportPreferences({ lastZoomMode: "pinch" });
      const viewport = viewportRef.current;

      if (!viewport) {
        applyTransformState({
          scale: nextScale,
          translateX: transformRef.current.translateX,
          translateY: transformRef.current.translateY,
        });
        pinchDistanceRef.current = nextDistance;
        pinchMidpointRef.current = nextMidpoint;
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const previousMidpoint = pinchMidpointRef.current ?? nextMidpoint;
      const previousPointX = previousMidpoint.x - viewportRect.left;
      const previousPointY = previousMidpoint.y - viewportRect.top;
      const nextPointX = nextMidpoint.x - viewportRect.left;
      const nextPointY = nextMidpoint.y - viewportRect.top;
      const midpointDelta = normalizePanDelta(
        nextPointX - previousPointX,
        nextPointY - previousPointY,
      );
      const adjustedNextPointX = previousPointX + midpointDelta.dx;
      const adjustedNextPointY = previousPointY + midpointDelta.dy;
      const currentTranslateX = transformRef.current.translateX;
      const currentTranslateY = transformRef.current.translateY;

      const contentX = (previousPointX - currentTranslateX) / currentScale;
      const contentY = (previousPointY - currentTranslateY) / currentScale;
      const nextTranslateX = adjustedNextPointX - contentX * nextScale;
      const nextTranslateY = adjustedNextPointY - contentY * nextScale;

      applyTransformState({
        scale: nextScale,
        translateX: nextTranslateX,
        translateY: nextTranslateY,
      });
      pinchDistanceRef.current = nextDistance;
      pinchMidpointRef.current = nextMidpoint;
    },
    [
      applyTransformState,
      clampScale,
      maxGestureStepFactor,
      minGestureStepFactor,
      minPinchLogEma,
      normalizePanDelta,
      pinchCalibrationAlpha,
      pinchNormalizedGain,
      queueCalibrationPersist,
      updateViewportPreferences,
    ],
  );

  const handleTouchEnd = React.useCallback(
    (e: TouchEvent) => {
      if (e.touches.length >= 2) return;
      if (pinchDistanceRef.current !== null) {
        e.preventDefault();
        e.stopPropagation();
        pinchDistanceRef.current = null;
        pinchMidpointRef.current = null;
        pushHistory(transformRef.current);
      }
    },
    [pushHistory],
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const preventGesture = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const listenerOptions: AddEventListenerOptions = { passive: false };
    container.addEventListener("wheel", handleWheel, listenerOptions);
    container.addEventListener("touchstart", handleTouchStart, listenerOptions);
    container.addEventListener("touchmove", handleTouchMove, listenerOptions);
    container.addEventListener("touchend", handleTouchEnd, listenerOptions);
    container.addEventListener("touchcancel", handleTouchEnd, listenerOptions);
    container.addEventListener("gesturestart", preventGesture as EventListener, listenerOptions);
    container.addEventListener("gesturechange", preventGesture as EventListener, listenerOptions);
    container.addEventListener("gestureend", preventGesture as EventListener, listenerOptions);

    return () => {
      if (wheelFrameRef.current !== null) {
        window.cancelAnimationFrame(wheelFrameRef.current);
        wheelFrameRef.current = null;
      }
      if (wheelCommitTimeoutRef.current !== null) {
        window.clearTimeout(wheelCommitTimeoutRef.current);
        wheelCommitTimeoutRef.current = null;
      }
      if (calibrationPersistTimeoutRef.current !== null) {
        window.clearTimeout(calibrationPersistTimeoutRef.current);
        calibrationPersistTimeoutRef.current = null;
      }
      pendingWheelPointerRef.current = null;
      container.removeEventListener("wheel", handleWheel, listenerOptions);
      container.removeEventListener("touchstart", handleTouchStart, listenerOptions);
      container.removeEventListener("touchmove", handleTouchMove, listenerOptions);
      container.removeEventListener("touchend", handleTouchEnd, listenerOptions);
      container.removeEventListener("touchcancel", handleTouchEnd, listenerOptions);
      container.removeEventListener(
        "gesturestart",
        preventGesture as EventListener,
        listenerOptions,
      );
      container.removeEventListener(
        "gesturechange",
        preventGesture as EventListener,
        listenerOptions,
      );
      container.removeEventListener("gestureend", preventGesture as EventListener, listenerOptions);
    };
  }, [handleTouchEnd, handleTouchMove, handleTouchStart, handleWheel]);

  const resetDeviceGestureCalibration = React.useCallback(() => {
    wheelDeltaEmaRef.current = 16;
    pinchLogEmaRef.current = 0.012;
    panDeltaEmaRef.current = 8;
    if (calibrationStorageKey && typeof window !== "undefined") {
      try {
        const currentRaw = window.localStorage.getItem(calibrationStorageKey);
        if (!currentRaw) {
          return;
        }
        const current = JSON.parse(currentRaw) as Record<string, unknown>;
        if (!current || typeof current !== "object") {
          return;
        }
        const profile = deviceProfileRef.current;
        const next = { ...current };
        delete (next as Record<string, unknown>)[profile];
        window.localStorage.setItem(calibrationStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  }, [calibrationStorageKey]);

  const getViewportSnapshot = React.useCallback((): PanZoomViewportSnapshot => {
    return {
      v: 1,
      preset,
      transform: {
        scale: transformRef.current.scale,
        translateX: transformRef.current.translateX,
        translateY: transformRef.current.translateY,
      },
      preferences: {
        ...viewportPreferences,
      },
    };
  }, [preset, viewportPreferences]);

  const applyViewportSnapshot = React.useCallback(
    (snapshot: PanZoomViewportSnapshot, options?: { resetHistory?: boolean }) => {
      const normalized = normalizeViewportSnapshot(snapshot);
      if (!normalized) {
        return;
      }

      const nextTransform: PanZoomTransformState = {
        scale: clampScale(normalized.transform.scale),
        translateX: normalized.transform.translateX,
        translateY: normalized.transform.translateY,
      };

      if (options?.resetHistory === false) {
        doTransform(nextTransform.scale, nextTransform.translateX, nextTransform.translateY);
      } else {
        applyFitTransform(nextTransform);
      }

      if (normalized.preferences && typeof normalized.preferences === "object") {
        updateViewportPreferences(normalized.preferences);
      }
    },
    [applyFitTransform, clampScale, doTransform, updateViewportPreferences],
  );

  return {
    containerRef,
    viewportRef,
    transformRef,
    scale,
    translateX,
    translateY,
    isDragging,
    canUndo,
    canRedo,
    clampScale,
    pushHistory,
    doTransform,
    applyFitTransform,
    handleUndo,
    handleRedo,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handlePanUp,
    handlePanDown,
    handlePanLeft,
    handlePanRight,
    handlePointerDown,
    handlePointerMove,
    handlePointerUpOrLeave,
    handleDoubleClick,
    zoomAtViewportPoint,
    getViewportSnapshot,
    applyViewportSnapshot,
    viewportPreferences,
    setViewportGridEnabledPreference: (showGridDots: boolean) =>
      updateViewportPreferences({ showGridDots }),
    setViewportAutoFitVerticalAlignPreference: (
      autoFitVerticalAlign: PanZoomViewportAutoFitAlign,
    ) => updateViewportPreferences({ autoFitVerticalAlign }),
    setViewportLastZoomModePreference: (lastZoomMode: PanZoomViewportZoomMode) =>
      updateViewportPreferences({ lastZoomMode }),
    resetDeviceGestureCalibration,
  };
}

export default usePanZoomViewport;
