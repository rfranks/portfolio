import * as React from "react";

export type PanZoomTransformState = {
  scale: number;
  translateX: number;
  translateY: number;
};

export type InteractiveViewportPreset = "media" | "diagram";

type UsePanZoomViewportOptions = {
  preset?: InteractiveViewportPreset;
  initialState?: PanZoomTransformState;
  minScale?: number;
  maxScale?: number;
  panStep?: number;
  clickZoomFactor?: number;
  iconZoomFactor?: number;
  doubleClickZoomFactor?: number;
  panCalibrationAlpha?: number;
  panReferenceDelta?: number;
  minPanEma?: number;
  minPanDeltaMultiplier?: number;
  maxPanDeltaMultiplier?: number;
  wheelCalibrationAlpha?: number;
  wheelNormalizedGain?: number;
  pinchCalibrationAlpha?: number;
  pinchNormalizedGain?: number;
  minWheelEma?: number;
  minPinchLogEma?: number;
  shouldIgnorePointerTarget?: (target: HTMLElement) => boolean;
};

const DEFAULT_INITIAL_STATE: PanZoomTransformState = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

const INTERACTIVE_VIEWPORT_PRESET_DEFAULTS: Record<
  InteractiveViewportPreset,
  {
    minScale: number;
    maxScale: number;
    panStep: number;
    clickZoomFactor: number;
    iconZoomFactor: number;
    doubleClickZoomFactor: number;
    panCalibrationAlpha: number;
    panReferenceDeltaMultiplier: number;
    minPanEma: number;
    minPanDeltaMultiplier: number;
    maxPanDeltaMultiplier: number;
    wheelCalibrationAlpha: number;
    wheelNormalizedGain: number;
    pinchCalibrationAlpha: number;
    pinchNormalizedGain: number;
    minWheelEma: number;
    minPinchLogEma: number;
  }
> = {
  media: {
    minScale: 0.1,
    maxScale: 8,
    panStep: 50,
    clickZoomFactor: 2.5,
    iconZoomFactor: 2.5,
    doubleClickZoomFactor: 2.5,
    panCalibrationAlpha: 0.2,
    panReferenceDeltaMultiplier: 0.18,
    minPanEma: 0.5,
    minPanDeltaMultiplier: 0.35,
    maxPanDeltaMultiplier: 1.85,
    wheelCalibrationAlpha: 0.18,
    wheelNormalizedGain: 0.24,
    pinchCalibrationAlpha: 0.22,
    pinchNormalizedGain: 0.52,
    minWheelEma: 1,
    minPinchLogEma: 0.0015,
  },
  diagram: {
    minScale: 0.1,
    maxScale: 8,
    panStep: 50,
    clickZoomFactor: 2.5,
    iconZoomFactor: 2.5,
    doubleClickZoomFactor: 2.5,
    panCalibrationAlpha: 0.2,
    panReferenceDeltaMultiplier: 0.18,
    minPanEma: 0.5,
    minPanDeltaMultiplier: 0.35,
    maxPanDeltaMultiplier: 1.85,
    wheelCalibrationAlpha: 0.18,
    wheelNormalizedGain: 0.24,
    pinchCalibrationAlpha: 0.22,
    pinchNormalizedGain: 0.52,
    minWheelEma: 1,
    minPinchLogEma: 0.0015,
  },
};

export function buildInteractiveViewportGridSx(params?: {
  enabled?: boolean;
  dotColor?: string;
  dotSizePx?: number;
  spacingPx?: number;
  backgroundColor?: string;
}): React.CSSProperties {
  const enabled = params?.enabled ?? false;
  if (!enabled) {
    return {
      backgroundColor: params?.backgroundColor ?? "#fff",
    };
  }

  const dotSizePx = Math.max(0.5, params?.dotSizePx ?? 2);
  const spacingPx = Math.max(4, params?.spacingPx ?? 30);
  const dotColor = params?.dotColor ?? "#cecece";

  return {
    backgroundColor: params?.backgroundColor ?? "#fff",
    backgroundImage: `radial-gradient(${dotColor} ${dotSizePx}px, transparent ${dotSizePx}px)`,
    backgroundSize: `${spacingPx}px ${spacingPx}px`,
  };
}

export function usePanZoomViewport(options: UsePanZoomViewportOptions = {}) {
  const preset = options.preset ?? "media";
  const presetDefaults = INTERACTIVE_VIEWPORT_PRESET_DEFAULTS[preset];
  const {
    initialState = DEFAULT_INITIAL_STATE,
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
  const pinchDistanceRef = React.useRef<number | null>(null);
  const pinchMidpointRef = React.useRef<{ x: number; y: number } | null>(null);
  const pinchLogEmaRef = React.useRef(0.012);
  const panDeltaEmaRef = React.useRef(8);

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

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const maxGestureStepFactor = Math.max(clickZoomFactor, iconZoomFactor, doubleClickZoomFactor);
  const minGestureStepFactor = 1 / maxGestureStepFactor;

  const clampScale = React.useCallback(
    (value: number) => Math.min(maxScale, Math.max(minScale, value)),
    [maxScale, minScale],
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
    ],
  );

  const handleZoomIn = React.useCallback(() => {
    const nextScale = clampScale(transformRef.current.scale * iconZoomFactor);
    doTransform(nextScale, transformRef.current.translateX, transformRef.current.translateY);
  }, [clampScale, doTransform, iconZoomFactor]);

  const handleZoomOut = React.useCallback(() => {
    const nextScale = clampScale(transformRef.current.scale / iconZoomFactor);
    doTransform(nextScale, transformRef.current.translateX, transformRef.current.translateY);
  }, [clampScale, doTransform, iconZoomFactor]);

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
        return;
      }
      if (e.shiftKey && e.button === 0) {
        e.stopPropagation();
        e.preventDefault();
        const nextScale = clampScale(transformRef.current.scale / clickZoomFactor);
        zoomAtViewportPoint(e.clientX, e.clientY, nextScale);
        return;
      }

      if (e.button === 0) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        setLastPointerPos({ x: e.clientX, y: e.clientY });
      }
    },
    [clampScale, clickZoomFactor, shouldIgnorePointerTarget, zoomAtViewportPoint],
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
    },
    [clampScale, doubleClickZoomFactor, shouldIgnorePointerTarget, zoomAtViewportPoint],
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
      const normalizedDelta = e.deltaY / Math.max(minWheelEma, wheelDeltaEmaRef.current);
      const rawWheelFactor = Math.exp(-normalizedDelta * wheelNormalizedGain);
      const boundedWheelFactor = Math.min(
        maxGestureStepFactor,
        Math.max(minGestureStepFactor, rawWheelFactor),
      );
      const nextScale = clampScale(baseScale * boundedWheelFactor);
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
      wheelCalibrationAlpha,
      wheelNormalizedGain,
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
      }
      const normalizedPinchDelta = pinchLogDelta / Math.max(minPinchLogEma, pinchLogEmaRef.current);
      const amplifiedRatio = Math.min(
        maxGestureStepFactor,
        Math.max(minGestureStepFactor, Math.exp(normalizedPinchDelta * pinchNormalizedGain)),
      );
      const currentScale = transformRef.current.scale;
      const nextScale = clampScale(currentScale * amplifiedRatio);
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
  };
}

export default usePanZoomViewport;
