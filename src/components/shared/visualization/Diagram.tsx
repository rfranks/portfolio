import React, { useEffect, useRef, useState, useCallback, ReactNode, useId } from "react";
import type mermaidType from "mermaid";

import type { DiagramProps } from "@/types/components/shared";
export type { DiagramProps } from "@/types/components/shared";

// Custom hooks
import { useIsVisible } from "@/hooks/html/useIsVisible";
import {
  deserializePanZoomViewportSnapshot,
  serializePanZoomViewportSnapshot,
  usePanZoomViewport,
} from "@/hooks/html/usePanZoomViewport";
import DiagramCanvas from "./diagram/DiagramCanvas";
import DiagramCodePanel from "./diagram/DiagramCodePanel";
import DiagramToolbar from "./diagram/DiagramToolbar";
import { useDiagramExports } from "@/hooks/visualization/useDiagramExports";
import { useMermaidScaleSyncRedraw } from "@/hooks/visualization/useMermaidScaleSyncRedraw";
import { DIAGRAM_VIEWPORT_DEEPLINK_PARAM } from "@/consts/components/shared/diagram";
import { VISUALIZATION_ANIMATION_TOKENS } from "@/consts/visualization/tokens";
import {
  copyTextToClipboard,
  normalizeDiagramExportBaseName,
  triggerJsonDownload,
} from "@/utils/components/shared/diagram";
import { resolveMediaActionContract } from "@/utils/components/shared/mediaCycler";
import { emitMediaActionBusEvent } from "@/utils/media/mediaActionBus";
import { emitMediaActionTelemetry } from "@/utils/media/mediaActionTelemetry";

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
  showGridDots,
  alwaysShowToolbar = false,
  toolbarActions,
  autoFitOnRender = true,
  autoFitPadding = 20,
  autoFitScaleMultiplier = 1,
  autoFitVerticalAlign = "top",
  autoFitOffsetX = 0,
  autoFitOffsetY = 0,
}: DiagramProps): ReactNode => {
  const shouldShowGridDots = showGridDots ?? showDots;
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
  const isVisible = useIsVisible(diagramRef);

  // Whether we show text vs rendered diagram
  const [showingText, setShowingText] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [deepLinkCopySucceeded, setDeepLinkCopySucceeded] = useState(false);
  const mermaidModuleRef = useRef<typeof mermaidType | null>(null);

  const autoFitFrameRef = useRef<number | null>(null);
  const autoFitInnerFrameRef = useRef<number | null>(null);
  const autoFitSettleFrameRef = useRef<number | null>(null);
  const deepLinkViewportAppliedRef = useRef(false);
  const deepLinkCopyResetTimeoutRef = useRef<number | null>(null);

  const {
    containerRef,
    viewportRef: diagramViewportRef,
    transformRef,
    scale,
    translateX,
    translateY,
    isDragging,
    canUndo,
    canRedo,
    doTransform,
    applyFitTransform,
    handleUndo,
    handleRedo,
    handleZoomIn,
    handleZoomOut,
    handlePanUp,
    handlePanDown,
    handlePanLeft,
    handlePanRight,
    handlePointerDown,
    handlePointerMove,
    handlePointerUpOrLeave,
    handleDoubleClick,
    getViewportSnapshot,
    applyViewportSnapshot,
    viewportPreferences,
    setViewportGridEnabledPreference,
    setViewportAutoFitVerticalAlignPreference,
    resetDeviceGestureCalibration,
  } = usePanZoomViewport({
    preset: "diagram",
    calibrationMediaType: "diagram",
    preferencesStorageKey: "diagram-viewport-preferences",
    initialPreferences: {
      showGridDots: shouldShowGridDots,
      autoFitVerticalAlign,
    },
    shouldIgnorePointerTarget: (target) =>
      Boolean(target.closest(".MuiToolbar-root") || target.closest("button")),
  });
  const resolvedGridDots = viewportPreferences.showGridDots ?? shouldShowGridDots;
  const resolvedAutoFitVerticalAlign =
    viewportPreferences.autoFitVerticalAlign ?? autoFitVerticalAlign;
  const emitDiagramAction = useCallback(
    (
      kind:
        | "open"
        | "copy"
        | "export"
        | "zoom"
        | "details.open"
        | "details.close"
        | "navigate.next"
        | "navigate.previous"
        | "navigate.loop",
      control?: string,
      trigger: "keyboard" | "pointer" | "programmatic" = "programmatic",
    ) => {
      const action = resolveMediaActionContract({
        kind,
        trigger,
        control,
        itemKey: resolvedId,
        mediaType: "diagram",
        title,
      });
      emitMediaActionTelemetry(action);
      emitMediaActionBusEvent({
        source: "diagram",
        action,
      });
    },
    [resolvedId, title],
  );
  const { markMermaidRenderComplete } = useMermaidScaleSyncRedraw({
    diagramCode,
    diagramRef,
    isHydrated,
    isVisible,
    mermaidModuleRef,
    scale,
    showingText,
    syntax,
  });

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

    const currentScale = Math.max(0.0001, transformRef.current.scale);
    const svgRect = svgElement.getBoundingClientRect();
    const unscaledSvgWidth = svgRect.width / currentScale;
    const unscaledSvgHeight = svgRect.height / currentScale;
    const viewBox = svgElement.viewBox?.baseVal;
    const hasViewBox = Boolean(viewBox && viewBox.width > 0 && viewBox.height > 0);

    let contentWidthUnits = 0;
    let contentHeightUnits = 0;
    let contentOffsetXUnits = 0;
    let contentOffsetYUnits = 0;

    // Prefer rendered graph bounds (g.root) over the full SVG canvas; Mermaid often keeps
    // extra outer canvas space that can make initial fit feel overly zoomed-out.
    const measurementCandidates: Array<SVGGraphicsElement | SVGSVGElement> = [];
    const graphRoot = svgElement.querySelector("g.root") as SVGGraphicsElement | null;
    if (graphRoot) {
      measurementCandidates.push(graphRoot);
    }
    measurementCandidates.push(svgElement);

    for (const candidate of measurementCandidates) {
      try {
        const contentBounds = candidate.getBBox();
        if (contentBounds.width > 0 && contentBounds.height > 0) {
          contentWidthUnits = contentBounds.width;
          contentHeightUnits = contentBounds.height;
          contentOffsetXUnits = contentBounds.x;
          contentOffsetYUnits = contentBounds.y;
          break;
        }
      } catch {
        // Fall through to the next candidate.
      }
    }

    if (contentWidthUnits <= 0 || contentHeightUnits <= 0) {
      if (hasViewBox && viewBox) {
        contentWidthUnits = viewBox.width;
        contentHeightUnits = viewBox.height;
        contentOffsetXUnits = viewBox.x;
        contentOffsetYUnits = viewBox.y;
      } else {
        contentWidthUnits = unscaledSvgWidth;
        contentHeightUnits = unscaledSvgHeight;
        contentOffsetXUnits = 0;
        contentOffsetYUnits = 0;
      }
    }

    if (contentWidthUnits <= 0 || contentHeightUnits <= 0) {
      return;
    }

    // Convert SVG units to unscaled CSS pixels so fit math uses a consistent unit system.
    const scaleX = hasViewBox && viewBox ? unscaledSvgWidth / Math.max(0.0001, viewBox.width) : 1;
    const scaleY = hasViewBox && viewBox ? unscaledSvgHeight / Math.max(0.0001, viewBox.height) : 1;
    const contentWidth = contentWidthUnits * scaleX;
    const contentHeight = contentHeightUnits * scaleY;
    const viewBoxOriginX = hasViewBox && viewBox ? viewBox.x : 0;
    const viewBoxOriginY = hasViewBox && viewBox ? viewBox.y : 0;
    const contentOffsetX = (contentOffsetXUnits - viewBoxOriginX) * scaleX;
    const contentOffsetY = (contentOffsetYUnits - viewBoxOriginY) * scaleY;

    const safePadding = Math.max(0, autoFitPadding);
    const availableWidth = Math.max(1, viewportRect.width - safePadding * 2);
    const availableHeight = Math.max(1, viewportRect.height - safePadding * 2);

    // Height-aware fitting: prefer filling available height while still containing width.
    const fitScaleY = availableHeight / contentHeight;
    const fitScaleX = availableWidth / contentWidth;
    const baseScale = Math.max(0.05, Math.min(fitScaleY, fitScaleX));
    const scaleMultiplier = Math.max(0.1, autoFitScaleMultiplier);
    const fittedScale = Math.min(8, Math.max(0.05, baseScale * scaleMultiplier));
    const verticalSlack = availableHeight - contentHeight * fittedScale;
    const verticalAlignOffset = resolvedAutoFitVerticalAlign === "center" ? verticalSlack / 2 : 0;

    const translatedX =
      safePadding +
      (availableWidth - contentWidth * fittedScale) / 2 -
      contentOffsetX * fittedScale +
      autoFitOffsetX;
    const translatedY =
      safePadding + verticalAlignOffset - contentOffsetY * fittedScale + autoFitOffsetY;

    applyFitTransform({
      scale: fittedScale,
      translateX: translatedX,
      translateY: translatedY,
    });
  }, [
    applyFitTransform,
    autoFitOffsetX,
    autoFitOffsetY,
    autoFitPadding,
    autoFitScaleMultiplier,
    resolvedAutoFitVerticalAlign,
    diagramViewportRef,
    transformRef,
  ]);

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

  const scheduleAutoFitAfterRenderSettle = useCallback(() => {
    if (autoFitSettleFrameRef.current !== null) {
      window.cancelAnimationFrame(autoFitSettleFrameRef.current);
      autoFitSettleFrameRef.current = null;
    }

    let attempts = 0;
    let stableFrames = 0;
    let lastWidth = 0;
    let lastHeight = 0;

    const tick = () => {
      const diagramNode = diagramRef.current;
      const svgElement = diagramNode?.querySelector("svg") as SVGSVGElement | null;

      if (!svgElement) {
        attempts += 1;
        if (attempts >= VISUALIZATION_ANIMATION_TOKENS.diagramAutoFitMaxFrames) {
          autoFitSettleFrameRef.current = null;
          scheduleAutoFitToViewport();
          return;
        }
        autoFitSettleFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const rect = svgElement.getBoundingClientRect();
      const widthNow = rect.width;
      const heightNow = rect.height;

      if (widthNow > 0 && heightNow > 0) {
        if (Math.abs(widthNow - lastWidth) < 0.5 && Math.abs(heightNow - lastHeight) < 0.5) {
          stableFrames += 1;
        } else {
          stableFrames = 0;
        }
        lastWidth = widthNow;
        lastHeight = heightNow;
      }

      attempts += 1;
      if (
        stableFrames >= VISUALIZATION_ANIMATION_TOKENS.diagramAutoFitSettleFrames ||
        attempts >= VISUALIZATION_ANIMATION_TOKENS.diagramAutoFitMaxFrames
      ) {
        autoFitSettleFrameRef.current = null;
        scheduleAutoFitToViewport();
        return;
      }

      autoFitSettleFrameRef.current = window.requestAnimationFrame(tick);
    };

    autoFitSettleFrameRef.current = window.requestAnimationFrame(tick);
  }, [scheduleAutoFitToViewport]);

  const handleReset = useCallback(() => {
    scheduleAutoFitToViewport();
  }, [scheduleAutoFitToViewport]);

  const handleZoomInAction = useCallback(() => {
    emitDiagramAction("zoom", "diagram-zoom-in");
    handleZoomIn();
  }, [emitDiagramAction, handleZoomIn]);

  const handleZoomOutAction = useCallback(() => {
    emitDiagramAction("zoom", "diagram-zoom-out");
    handleZoomOut();
  }, [emitDiagramAction, handleZoomOut]);

  const { copySucceeded, handleCopyDiagramCode, handleExportSvg, handleExportPng } =
    useDiagramExports({
      diagramCode,
      diagramRef,
      resolvedId,
      title,
    });

  const handleCanvasKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const normalizedKey = event.key.toLowerCase();
      if (normalizedKey === "g") {
        event.preventDefault();
        setViewportGridEnabledPreference(!resolvedGridDots);
        return;
      }

      if (normalizedKey === "v") {
        event.preventDefault();
        const nextAlign = resolvedAutoFitVerticalAlign === "top" ? "center" : "top";
        setViewportAutoFitVerticalAlignPreference(nextAlign);
        window.requestAnimationFrame(() => {
          fitDiagramToViewport();
        });
        return;
      }

      if (normalizedKey === "r" && event.shiftKey) {
        event.preventDefault();
        resetDeviceGestureCalibration();
        return;
      }

      if (normalizedKey === "c") {
        event.preventDefault();
        emitDiagramAction("copy", "diagram-copy-code-shortcut", "keyboard");
        void handleCopyDiagramCode();
        return;
      }

      if (normalizedKey === "e") {
        event.preventDefault();
        emitDiagramAction("export", "diagram-export-svg-shortcut", "keyboard");
        void handleExportSvg();
        return;
      }

      if (normalizedKey === "p") {
        event.preventDefault();
        emitDiagramAction("export", "diagram-export-png-shortcut", "keyboard");
        void handleExportPng();
        return;
      }

      if (normalizedKey === "o") {
        event.preventDefault();
        emitDiagramAction("open", "diagram-show-source-shortcut", "keyboard");
        setShowingText(true);
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        handleZoomInAction();
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        handleZoomOutAction();
      }
    },
    [
      emitDiagramAction,
      fitDiagramToViewport,
      handleCopyDiagramCode,
      handleExportPng,
      handleExportSvg,
      handleZoomInAction,
      handleZoomOutAction,
      resetDeviceGestureCalibration,
      resolvedAutoFitVerticalAlign,
      resolvedGridDots,
      setViewportAutoFitVerticalAlignPreference,
      setViewportGridEnabledPreference,
    ],
  );

  const resolveExportFileBaseName = useCallback(
    () => normalizeDiagramExportBaseName(title, resolvedId),
    [resolvedId, title],
  );

  const handleExportViewportJson = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const snapshot = getViewportSnapshot();
    const payload = {
      ...snapshot,
      diagramId: resolvedId,
      title: title?.trim() || null,
      diagramType: type,
      exportedAt: new Date().toISOString(),
    };
    triggerJsonDownload(payload, `${resolveExportFileBaseName()}-viewport.json`);
    emitDiagramAction("export", "diagram-export-viewport-json", "pointer");
  }, [emitDiagramAction, getViewportSnapshot, resolveExportFileBaseName, resolvedId, title, type]);

  const handleCopyDiagramCodeAction = useCallback(() => {
    emitDiagramAction("copy", "diagram-copy-code", "pointer");
    void handleCopyDiagramCode();
  }, [emitDiagramAction, handleCopyDiagramCode]);

  const handleExportSvgAction = useCallback(() => {
    emitDiagramAction("export", "diagram-export-svg", "pointer");
    void handleExportSvg();
  }, [emitDiagramAction, handleExportSvg]);

  const handleExportPngAction = useCallback(() => {
    emitDiagramAction("export", "diagram-export-png", "pointer");
    void handleExportPng();
  }, [emitDiagramAction, handleExportPng]);

  const handleCopyDeepLinkWithViewport = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const snapshot = getViewportSnapshot();
    const serializedSnapshot = serializePanZoomViewportSnapshot(snapshot);
    if (!serializedSnapshot) {
      return;
    }

    const deepLink = new URL(window.location.href);
    deepLink.searchParams.set(DIAGRAM_VIEWPORT_DEEPLINK_PARAM, serializedSnapshot);
    deepLink.searchParams.set("diagramViewportTarget", resolvedId);

    try {
      await copyTextToClipboard(deepLink.toString());
      emitDiagramAction("copy", "diagram-copy-deeplink-viewport", "pointer");
      setDeepLinkCopySucceeded(true);
      if (deepLinkCopyResetTimeoutRef.current !== null) {
        window.clearTimeout(deepLinkCopyResetTimeoutRef.current);
      }
      deepLinkCopyResetTimeoutRef.current = window.setTimeout(() => {
        setDeepLinkCopySucceeded(false);
        deepLinkCopyResetTimeoutRef.current = null;
      }, 1400);
    } catch {
      // ignore clipboard failures
    }
  }, [emitDiagramAction, getViewportSnapshot, resolvedId]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined" || deepLinkViewportAppliedRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const encodedViewport = params.get(DIAGRAM_VIEWPORT_DEEPLINK_PARAM);
    if (!encodedViewport) {
      deepLinkViewportAppliedRef.current = false;
      return;
    }

    const targetDiagram = params.get("diagramViewportTarget")?.trim();
    if (targetDiagram && targetDiagram !== resolvedId) {
      return;
    }

    const snapshot = deserializePanZoomViewportSnapshot(encodedViewport);
    if (!snapshot) {
      return;
    }

    applyViewportSnapshot(snapshot);
    deepLinkViewportAppliedRef.current = true;
  }, [applyViewportSnapshot, isHydrated, resolvedId]);

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

      if (!mermaidModuleRef.current) {
        const mermaidModule = await import("mermaid");
        mermaidModuleRef.current = mermaidModule.default;
      }
      const mermaid = mermaidModuleRef.current;
      if (!mermaid) {
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
      markMermaidRenderComplete(transformRef.current.scale);

      if (!cancelled && autoFitOnRender && !deepLinkViewportAppliedRef.current) {
        scheduleAutoFitAfterRenderSettle();
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
    scheduleAutoFitAfterRenderSettle,
    showingText,
    syntax,
    markMermaidRenderComplete,
    transformRef,
  ]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    return () => {
      if (autoFitFrameRef.current !== null) {
        window.cancelAnimationFrame(autoFitFrameRef.current);
        autoFitFrameRef.current = null;
      }
      if (autoFitInnerFrameRef.current !== null) {
        window.cancelAnimationFrame(autoFitInnerFrameRef.current);
        autoFitInnerFrameRef.current = null;
      }
      if (autoFitSettleFrameRef.current !== null) {
        window.cancelAnimationFrame(autoFitSettleFrameRef.current);
        autoFitSettleFrameRef.current = null;
      }
      if (deepLinkCopyResetTimeoutRef.current !== null) {
        window.clearTimeout(deepLinkCopyResetTimeoutRef.current);
        deepLinkCopyResetTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <DiagramCodePanel
        visible={syntax === "text" || showingText}
        width={width}
        height={height}
        showToolbar={showToolbar}
        diagramCode={diagramCode}
        copySucceeded={copySucceeded}
        deepLinkCopySucceeded={deepLinkCopySucceeded}
        onToggleCodeMode={() => {
          setShowingText((prev) => {
            doTransform(1, 0, 0);
            return !prev;
          });
        }}
        onExportSvg={handleExportSvgAction}
        onExportPng={handleExportPngAction}
        onExportViewportJson={handleExportViewportJson}
        onCopyDeepLinkWithViewport={handleCopyDeepLinkWithViewport}
        onCopyDiagramCode={handleCopyDiagramCodeAction}
      />
      <DiagramCanvas
        containerId={`${resolvedId}-container`}
        visible={syntax === "mermaid" && !showingText}
        width={width}
        height={height}
        containerRef={containerRef}
        viewportRef={diagramViewportRef}
        diagramRef={diagramRef}
        shouldShowGridDots={resolvedGridDots}
        scale={scale}
        translateX={translateX}
        translateY={translateY}
        isDragging={isDragging}
        isHydrated={isHydrated}
        diagramCode={diagramCode}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUpOrLeave={handlePointerUpOrLeave}
        onDoubleClick={(event) => {
          emitDiagramAction("zoom", "diagram-double-click", "pointer");
          handleDoubleClick(event);
        }}
        onKeyDown={handleCanvasKeyDown}
        toolbar={
          <DiagramToolbar
            showToolbar={showToolbar}
            alwaysShowToolbar={alwaysShowToolbar}
            canUndo={canUndo}
            canRedo={canRedo}
            copySucceeded={copySucceeded}
            deepLinkCopySucceeded={deepLinkCopySucceeded}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onPanUp={handlePanUp}
            onPanLeft={handlePanLeft}
            onPanRight={handlePanRight}
            onPanDown={handlePanDown}
            onZoomOut={handleZoomOutAction}
            onZoomIn={handleZoomInAction}
            onReset={handleReset}
            onCopyCode={handleCopyDiagramCodeAction}
            onExportSvg={handleExportSvgAction}
            onExportPng={handleExportPngAction}
            onExportViewportJson={handleExportViewportJson}
            onCopyDeepLinkWithViewport={handleCopyDeepLinkWithViewport}
            onShowSource={() => {
              emitDiagramAction("open", "diagram-show-source-toolbar", "pointer");
              setShowingText(true);
            }}
            toolbarActions={toolbarActions}
          />
        }
      />
    </>
  );
};
