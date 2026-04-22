import React, { useEffect, useRef, useState, useCallback, ReactNode, useId } from "react";

import mermaid from "mermaid";

// MUI components
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";

// MUI icons
import ZoomIn from "@mui/icons-material/ZoomIn";
import ZoomOut from "@mui/icons-material/ZoomOut";
import CenterFocusStrong from "@mui/icons-material/CenterFocusStrong";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Undo from "@mui/icons-material/Undo";
import Redo from "@mui/icons-material/Redo";
import Code from "@mui/icons-material/Code";
import CodeOff from "@mui/icons-material/CodeOff";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Check from "@mui/icons-material/Check";
import type { DiagramProps } from "@/types/components/shared";
export type { DiagramProps } from "@/types/components/shared";

// Custom hooks
import { useIsVisible } from "@/hooks/html/useIsVisible";

/**
 * Renders a diagram using the Mermaid library.
 * The diagram can be displayed in either Mermaid syntax or as a rendered diagram.
 * The component supports zooming, panning, and undo/redo functionality.
 *
 * @param {DiagramProps} props - The properties for the Diagram component.
 * @returns {JSX.Element} The rendered diagram component.
 * @see {@link DiagramProps} for the props interface.
 * @see {@link https://mermaid-js.github.io/mermaid/#/} for the Mermaid documentation.
 */
export const Diagram: React.FC<DiagramProps> = ({
  id,
  diagram,
  orientation = "TD",
  title = "",
  type = "flowchart",
  steps = [],
  syntax = "mermaid",
  height,
  width,
  showToolbar = true,
  showDots = true,
  alwaysShowToolbar = false,
  toolbarActions,
  autoFitOnRender = true,
  autoFitPadding = 20,
  autoFitScaleMultiplier = 1,
  autoFitOffsetX = 0,
  autoFitOffsetY = 0,
}: DiagramProps): ReactNode => {
  const reactId = useId();
  const resolvedId = id?.trim() ? id : `diagramId_${reactId.replace(/[:]/g, "_")}`;

  // The raw diagram code
  const diagramCode =
    diagram ||
    `
${type} ${type === "flowchart" || type === "graph" ? orientation : ""}${
      title ? `\ntitle ${title}` : ""
    }
${steps?.join("\n  ")}
`;

  const diagramRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramViewportRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(diagramRef);

  // Whether we show text vs rendered diagram
  const [showingText, setShowingText] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [copySucceeded, setCopySucceeded] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);

  // Pan/Zoom states
  interface TransformState {
    scale: number;
    translateX: number;
    translateY: number;
  }

  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const scaleRef = useRef(1);
  const translateXRef = useRef(0);
  const translateYRef = useRef(0);
  const wheelFrameRef = useRef<number | null>(null);
  const pendingWheelScaleRef = useRef<number | null>(null);
  const wheelCommitTimeoutRef = useRef<number | null>(null);
  const autoFitFrameRef = useRef<number | null>(null);
  const autoFitInnerFrameRef = useRef<number | null>(null);

  // Undo/Redo History
  const [history, setHistory] = useState<TransformState[]>([
    { scale: 1, translateX: 0, translateY: 0 },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistory = useCallback(
    (st: TransformState) => {
      const truncated = history.slice(0, historyIndex + 1);
      const last = truncated[truncated.length - 1];
      // Skip if no actual change
      if (
        last.scale === st.scale &&
        last.translateX === st.translateX &&
        last.translateY === st.translateY
      ) {
        return;
      }
      const updated = [...truncated, st];
      setHistory(updated);
      setHistoryIndex(updated.length - 1);
    },
    [history, historyIndex],
  );

  const applyTransformState = useCallback((st: TransformState) => {
    setScale(st.scale);
    setTranslateX(st.translateX);
    setTranslateY(st.translateY);
    scaleRef.current = st.scale;
    translateXRef.current = st.translateX;
    translateYRef.current = st.translateY;
  }, []);

  const applyFitTransform = useCallback((st: TransformState) => {
    setScale(st.scale);
    setTranslateX(st.translateX);
    setTranslateY(st.translateY);
    scaleRef.current = st.scale;
    translateXRef.current = st.translateX;
    translateYRef.current = st.translateY;
    setHistory([st]);
    setHistoryIndex(0);
  }, []);

  const fitDiagramToViewport = useCallback(() => {
    const viewport = diagramViewportRef.current;
    const diagramNode = diagramRef.current;
    if (!viewport || !diagramNode) {
      return;
    }

    const svgElement = diagramNode.querySelector("svg") as SVGSVGElement | null;
    if (!svgElement) {
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    if (viewportRect.width <= 0 || viewportRect.height <= 0) {
      return;
    }

    let contentWidth = 0;
    let contentHeight = 0;
    let contentOffsetX = 0;
    let contentOffsetY = 0;

    // Prefer true rendered bounds so auto-fit centers real content, not nominal canvas.
    try {
      const contentBounds = svgElement.getBBox();
      if (contentBounds.width > 0 && contentBounds.height > 0) {
        contentWidth = contentBounds.width;
        contentHeight = contentBounds.height;
        contentOffsetX = contentBounds.x;
        contentOffsetY = contentBounds.y;
      }
    } catch {
      // Fall through to viewBox/bounds fallback.
    }

    if (contentWidth <= 0 || contentHeight <= 0) {
      const viewBox = svgElement.viewBox?.baseVal;
      if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
        contentWidth = viewBox.width;
        contentHeight = viewBox.height;
        contentOffsetX = viewBox.x;
        contentOffsetY = viewBox.y;
      } else {
        const svgRect = svgElement.getBoundingClientRect();
        contentWidth = svgRect.width;
        contentHeight = svgRect.height;
      }
    }

    if (contentWidth <= 0 || contentHeight <= 0) {
      return;
    }

    const safePadding = Math.max(0, autoFitPadding);
    const availableWidth = Math.max(1, viewportRect.width - safePadding * 2);
    const availableHeight = Math.max(1, viewportRect.height - safePadding * 2);

    // Height-aware fitting: prefer filling available height while still containing width.
    const fitScaleY = availableHeight / contentHeight;
    const fitScaleX = availableWidth / contentWidth;
    const baseScale = Math.max(0.05, Math.min(fitScaleY, fitScaleX));
    const scaleMultiplier = Math.max(0.1, autoFitScaleMultiplier);
    const fittedScale = Math.min(8, Math.max(0.05, baseScale * scaleMultiplier));

    const translatedX =
      safePadding +
      (availableWidth - contentWidth * fittedScale) / 2 -
      contentOffsetX * fittedScale +
      autoFitOffsetX;
    const translatedY =
      safePadding +
      (availableHeight - contentHeight * fittedScale) / 2 -
      contentOffsetY * fittedScale +
      autoFitOffsetY;

    applyFitTransform({
      scale: fittedScale,
      translateX: translatedX,
      translateY: translatedY,
    });
  }, [applyFitTransform, autoFitOffsetX, autoFitOffsetY, autoFitPadding, autoFitScaleMultiplier]);

  const scheduleAutoFitToViewport = useCallback(() => {
    if (autoFitFrameRef.current !== null) {
      window.cancelAnimationFrame(autoFitFrameRef.current);
      autoFitFrameRef.current = null;
    }
    if (autoFitInnerFrameRef.current !== null) {
      window.cancelAnimationFrame(autoFitInnerFrameRef.current);
      autoFitInnerFrameRef.current = null;
    }

    autoFitFrameRef.current = window.requestAnimationFrame(() => {
      autoFitFrameRef.current = null;
      autoFitInnerFrameRef.current = window.requestAnimationFrame(() => {
        autoFitInnerFrameRef.current = null;
        fitDiagramToViewport();
      });
    });
  }, [fitDiagramToViewport]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    applyTransformState(history[newIndex]);
  }, [canUndo, historyIndex, history, applyTransformState]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    applyTransformState(history[newIndex]);
  }, [canRedo, historyIndex, history, applyTransformState]);

  // Zoom/Pan increments
  const ZOOM_STEP = 0.5;
  const PAN_STEP = 50;
  const CLICK_ZOOM_FACTOR = 1.3;
  const DOUBLE_CLICK_ZOOM_FACTOR = 1.4;
  const clampScale = useCallback((value: number) => Math.min(8, Math.max(0.1, value)), []);

  const doTransform = useCallback(
    (newScale: number, newX: number, newY: number) => {
      setScale(newScale);
      setTranslateX(newX);
      setTranslateY(newY);
      scaleRef.current = newScale;
      translateXRef.current = newX;
      translateYRef.current = newY;
      pushHistory({ scale: newScale, translateX: newX, translateY: newY });
    },
    [pushHistory],
  );

  const zoomAtViewportPoint = useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      const viewport = diagramViewportRef.current;
      if (!viewport) {
        doTransform(nextScale, translateXRef.current, translateYRef.current);
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const pointX = clientX - viewportRect.left;
      const pointY = clientY - viewportRect.top;
      const currentScale = scaleRef.current;
      const currentTranslateX = translateXRef.current;
      const currentTranslateY = translateYRef.current;

      const contentX = (pointX - currentTranslateX) / currentScale;
      const contentY = (pointY - currentTranslateY) / currentScale;

      const nextTranslateX = pointX - contentX * nextScale;
      const nextTranslateY = pointY - contentY * nextScale;

      doTransform(nextScale, nextTranslateX, nextTranslateY);
    },
    [doTransform],
  );

  const handleZoomIn = useCallback(() => {
    doTransform(clampScale(scale + ZOOM_STEP), translateX, translateY);
  }, [scale, translateX, translateY, doTransform, clampScale]);

  const handleZoomOut = useCallback(() => {
    doTransform(clampScale(scale - ZOOM_STEP), translateX, translateY);
  }, [scale, translateX, translateY, doTransform, clampScale]);

  const handleReset = useCallback(() => {
    scheduleAutoFitToViewport();
  }, [scheduleAutoFitToViewport]);

  const handlePanUp = useCallback(() => {
    doTransform(scale, translateX, translateY - PAN_STEP);
  }, [scale, translateX, translateY, doTransform]);

  const handlePanDown = useCallback(() => {
    doTransform(scale, translateX, translateY + PAN_STEP);
  }, [scale, translateX, translateY, doTransform]);

  const handlePanLeft = useCallback(() => {
    doTransform(scale, translateX - PAN_STEP, translateY);
  }, [scale, translateX, translateY, doTransform]);

  const handlePanRight = useCallback(() => {
    doTransform(scale, translateX + PAN_STEP, translateY);
  }, [scale, translateX, translateY, doTransform]);

  // Drag-to-Pan
  const [isDragging, setIsDragging] = useState(false);
  const [lastPointerPos, setLastPointerPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pinchDistanceRef.current !== null) return;
    const el = e.target as HTMLElement;
    // Skip if clicking on toolbar or button
    if (el.closest(".MuiToolbar-root") || el.closest("button")) return;

    // If ctrlKey => zoom in, if shiftKey => zoom out
    // Single-click with ctrl or shift
    if (e.ctrlKey && e.button === 0) {
      e.stopPropagation();
      e.preventDefault();
      const nextScale = clampScale(scaleRef.current * CLICK_ZOOM_FACTOR);
      zoomAtViewportPoint(e.clientX, e.clientY, nextScale);
      return;
    }
    if (e.shiftKey && e.button === 0) {
      e.stopPropagation();
      e.preventDefault();
      const nextScale = clampScale(scaleRef.current / CLICK_ZOOM_FACTOR);
      zoomAtViewportPoint(e.clientX, e.clientY, nextScale);
      return;
    }

    // Otherwise, normal drag
    if (e.button === 0) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      setLastPointerPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pinchDistanceRef.current !== null) return;
    if (!isDragging || !lastPointerPos) return;
    const dx = e.clientX - lastPointerPos.x;
    const dy = e.clientY - lastPointerPos.y;
    setTranslateX((prev) => prev + dx);
    setTranslateY((prev) => prev + dy);
    setLastPointerPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUpOrLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pinchDistanceRef.current !== null) return;
    if (isDragging) {
      pushHistory({ scale, translateX, translateY });
    }
    setIsDragging(false);
    setLastPointerPos(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Double-click => zoom in by +1 scale
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.target as HTMLElement;
      if (el.closest(".MuiToolbar-root") || el.closest("button")) return;

      e.stopPropagation();
      e.preventDefault();
      const nextScale = clampScale(scaleRef.current * DOUBLE_CLICK_ZOOM_FACTOR);
      zoomAtViewportPoint(e.clientX, e.clientY, nextScale);
    },
    [clampScale, zoomAtViewportPoint],
  );

  // Scroll & pinch
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();

      const baseScale = pendingWheelScaleRef.current ?? scaleRef.current;
      const zoomDelta = -e.deltaY * 0.00045;
      const nextScale = clampScale(baseScale + zoomDelta);
      pendingWheelScaleRef.current = nextScale;

      if (wheelFrameRef.current === null) {
        wheelFrameRef.current = window.requestAnimationFrame(() => {
          wheelFrameRef.current = null;
          const framedScale = pendingWheelScaleRef.current;
          if (framedScale == null) {
            return;
          }
          setScale(framedScale);
          scaleRef.current = framedScale;
          pendingWheelScaleRef.current = null;
        });
      }

      if (wheelCommitTimeoutRef.current !== null) {
        window.clearTimeout(wheelCommitTimeoutRef.current);
      }
      wheelCommitTimeoutRef.current = window.setTimeout(() => {
        wheelCommitTimeoutRef.current = null;
        pushHistory({
          scale: scaleRef.current,
          translateX: translateXRef.current,
          translateY: translateYRef.current,
        });
      }, 110);
    },
    [clampScale, pushHistory],
  );

  const getTouchDistance = (touchA: Touch, touchB: Touch) =>
    Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);

  const handleCopyDiagramCode = useCallback(async () => {
    const textToCopy = diagramCode.trim();
    if (!textToCopy) {
      return;
    }

    const fallbackCopy = () => {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        fallbackCopy();
      }
      setCopySucceeded(true);
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopySucceeded(false);
        copyResetTimeoutRef.current = null;
      }, 1400);
    } catch {
      // no-op: if clipboard copy fails, keep icon state unchanged
    }
  }, [diagramCode]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    pinchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
    setIsDragging(false);
    setLastPointerPos(null);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      e.stopPropagation();

      const previousDistance = pinchDistanceRef.current;
      const nextDistance = getTouchDistance(e.touches[0], e.touches[1]);
      if (!previousDistance || previousDistance <= 0 || nextDistance <= 0) {
        pinchDistanceRef.current = nextDistance;
        return;
      }

      const pinchRatio = nextDistance / previousDistance;
      const amplifiedRatio = 1 + (pinchRatio - 1) * 1.9;
      const nextScale = clampScale(scaleRef.current * amplifiedRatio);
      setScale(nextScale);
      scaleRef.current = nextScale;
      pinchDistanceRef.current = nextDistance;
    },
    [clampScale],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length >= 2) return;
      if (pinchDistanceRef.current !== null) {
        e.preventDefault();
        e.stopPropagation();
        pinchDistanceRef.current = null;
        pushHistory({
          scale: scaleRef.current,
          translateX: translateXRef.current,
          translateY: translateYRef.current,
        });
      }
    },
    [pushHistory],
  );

  // Initialize Mermaid if in view, mermaid syntax, not showing text
  useEffect(() => {
    if (!isHydrated) return;
    if (!diagramRef.current) return;
    if (syntax !== "mermaid") return;
    if (!isVisible) return;
    if (showingText) return;

    let cancelled = false;

    const renderAndFitDiagram = async () => {
      const currentDiagramRef = diagramRef.current;
      if (!currentDiagramRef) {
        return;
      }

      currentDiagramRef.removeAttribute("data-processed");
      currentDiagramRef.innerHTML = diagramCode;

      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {},
      });

      await mermaid.run({
        nodes: [currentDiagramRef],
        querySelector: ".diagram-mermaid",
      });

      if (!cancelled && autoFitOnRender) {
        scheduleAutoFitToViewport();
      }
    };

    void renderAndFitDiagram();

    return () => {
      cancelled = true;
    };
  }, [
    autoFitOnRender,
    diagramCode,
    isHydrated,
    isVisible,
    scheduleAutoFitToViewport,
    showingText,
    syntax,
  ]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const preventGesture = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const options: AddEventListenerOptions = { passive: false };
    container.addEventListener("wheel", handleWheel, options);
    container.addEventListener("touchstart", handleTouchStart, options);
    container.addEventListener("touchmove", handleTouchMove, options);
    container.addEventListener("touchend", handleTouchEnd, options);
    container.addEventListener("touchcancel", handleTouchEnd, options);
    container.addEventListener("gesturestart", preventGesture as EventListener, options);
    container.addEventListener("gesturechange", preventGesture as EventListener, options);
    container.addEventListener("gestureend", preventGesture as EventListener, options);

    return () => {
      if (wheelFrameRef.current !== null) {
        window.cancelAnimationFrame(wheelFrameRef.current);
        wheelFrameRef.current = null;
      }
      if (wheelCommitTimeoutRef.current !== null) {
        window.clearTimeout(wheelCommitTimeoutRef.current);
        wheelCommitTimeoutRef.current = null;
      }
      container.removeEventListener("wheel", handleWheel, options);
      container.removeEventListener("touchstart", handleTouchStart, options);
      container.removeEventListener("touchmove", handleTouchMove, options);
      container.removeEventListener("touchend", handleTouchEnd, options);
      container.removeEventListener("touchcancel", handleTouchEnd, options);
      container.removeEventListener("gesturestart", preventGesture as EventListener, options);
      container.removeEventListener("gesturechange", preventGesture as EventListener, options);
      container.removeEventListener("gestureend", preventGesture as EventListener, options);
    };
  }, [handleTouchEnd, handleTouchMove, handleTouchStart, handleWheel]);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = null;
      }
      if (autoFitFrameRef.current !== null) {
        window.cancelAnimationFrame(autoFitFrameRef.current);
        autoFitFrameRef.current = null;
      }
      if (autoFitInnerFrameRef.current !== null) {
        window.cancelAnimationFrame(autoFitInnerFrameRef.current);
        autoFitInnerFrameRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <Box
        sx={{
          width: width || "100%",
          height: height || "auto",
          minHeight: 0,
          border: 0,
          display: syntax === "text" || showingText ? "flex" : "none",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {showToolbar && (
          <Toolbar variant="dense" sx={{ minHeight: 40, flexShrink: 0 }}>
            <Tooltip title={showingText ? "Show Diagram" : "Show Source"}>
              <IconButton
                onClick={() =>
                  setShowingText((prev) => {
                    doTransform(1, 0, 0);
                    return !prev;
                  })
                }
              >
                {showingText ? <CodeOff /> : <Code />}
              </IconButton>
            </Tooltip>
            <Tooltip title={copySucceeded ? "Copied" : "Copy Mermaid Code"}>
              <IconButton onClick={handleCopyDiagramCode} aria-label="Copy Mermaid source code">
                {copySucceeded ? <Check /> : <ContentCopy />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        )}
        <Box
          sx={(theme) => ({
            flex: "1 1 auto",
            minHeight: 0,
            overflow: "auto",
            px: 1.25,
            py: 1,
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.common.black, 0.42)
                : alpha(theme.palette.grey[100], 0.86),
          })}
        >
          <Box
            component="pre"
            sx={(theme) => ({
              m: 0,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: "0.88rem",
              lineHeight: 1.45,
              whiteSpace: "pre",
              color:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.common.white, 0.9)
                  : alpha(theme.palette.text.primary, 0.9),
            })}
          >
            {diagramCode}
          </Box>
        </Box>
      </Box>
      <Box
        id={`${resolvedId}-container`}
        ref={containerRef}
        sx={{
          width: width || "100%",
          height: height || "auto",
          border: "1px solid #ccc",
          position: "relative",
          display: syntax === "mermaid" && !showingText ? "flex" : "none",
          flexDirection: "column",
          touchAction: "none",
          overscrollBehavior: "contain",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
        onDoubleClick={handleDoubleClick}
      >
        {showToolbar && (
          <Toolbar
            variant="dense"
            sx={{
              minHeight: "40px",
              py: 1,
              ...(alwaysShowToolbar ? null : { "@media (max-width: 600px)": { display: "none" } }),
            }}
          >
            {/* Undo/Redo */}
            <Tooltip title="Undo">
              <span>
                <IconButton onClick={handleUndo} disabled={!canUndo}>
                  <Undo />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo">
              <span>
                <IconButton onClick={handleRedo} disabled={!canRedo}>
                  <Redo />
                </IconButton>
              </span>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Panning */}
            <Tooltip title="Pan Up">
              <IconButton onClick={handlePanUp}>
                <ArrowUpward />
              </IconButton>
            </Tooltip>
            <Tooltip title="Pan Left">
              <IconButton onClick={handlePanLeft}>
                <ArrowBack />
              </IconButton>
            </Tooltip>
            <Tooltip title="Pan Right">
              <IconButton onClick={handlePanRight}>
                <ArrowForward />
              </IconButton>
            </Tooltip>
            <Tooltip title="Pan Down">
              <IconButton onClick={handlePanDown}>
                <ArrowDownward />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Zoom */}
            <Tooltip title="Zoom Out (shift+click)">
              <IconButton onClick={handleZoomOut}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom In (ctrl+click)">
              <IconButton onClick={handleZoomIn}>
                <ZoomIn />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Reset */}
            <Tooltip title="Reset Transform">
              <IconButton onClick={handleReset}>
                <CenterFocusStrong />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Toggle code/diagram */}
            <Tooltip title="Show Source">
              <IconButton onClick={() => setShowingText(true)}>
                <Code />
              </IconButton>
            </Tooltip>
            {toolbarActions}
          </Toolbar>
        )}

        <Box
          ref={diagramViewportRef}
          sx={{
            position: "relative",
            overflow: "hidden",
            flexGrow: 1,
            width: "100%",
            backgroundColor: "#fff",
            backgroundImage: showDots
              ? "radial-gradient(#cecece 2.0px, transparent 2.0px)"
              : undefined,
            backgroundSize: "30px 30px",
          }}
        >
          <Box
            ref={diagramRef}
            className="diagram-mermaid"
            suppressHydrationWarning
            sx={{
              transition: "transform 0.2s",
              transformOrigin: "top left",
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
          >
            {isHydrated ? diagramCode : ""}
          </Box>
        </Box>
      </Box>
    </>
  );
};
