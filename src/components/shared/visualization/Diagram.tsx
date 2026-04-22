import React, { useEffect, useRef, useState, useCallback, ReactNode, useId } from "react";
import type mermaidType from "mermaid";

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
import ImageIcon from "@mui/icons-material/Image";
import Polyline from "@mui/icons-material/Polyline";
import type { DiagramProps } from "@/types/components/shared";
export type { DiagramProps } from "@/types/components/shared";

// Custom hooks
import { useIsVisible } from "@/hooks/html/useIsVisible";
import {
  buildInteractiveViewportGridSx,
  usePanZoomViewport,
} from "@/hooks/html/usePanZoomViewport";

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
  const [copySucceeded, setCopySucceeded] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const mermaidModuleRef = useRef<typeof mermaidType | null>(null);

  const autoFitFrameRef = useRef<number | null>(null);
  const autoFitInnerFrameRef = useRef<number | null>(null);
  const autoFitSettleFrameRef = useRef<number | null>(null);

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
  } = usePanZoomViewport({
    preset: "diagram",
    shouldIgnorePointerTarget: (target) =>
      Boolean(target.closest(".MuiToolbar-root") || target.closest("button")),
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
    const verticalAlignOffset = autoFitVerticalAlign === "center" ? verticalSlack / 2 : 0;

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
    autoFitVerticalAlign,
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
        if (attempts >= 60) {
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
      if (stableFrames >= 2 || attempts >= 60) {
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

  const getExportFileBaseName = useCallback(() => {
    const preferred = (title?.trim() || resolvedId || "diagram").toLowerCase();
    const normalized = preferred
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return normalized || "diagram";
  }, [resolvedId, title]);

  const resolveSvgSize = useCallback((svgElement: SVGSVGElement) => {
    const viewBox = svgElement.viewBox?.baseVal;
    if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
      return {
        width: Math.max(1, Math.round(viewBox.width)),
        height: Math.max(1, Math.round(viewBox.height)),
      };
    }

    const widthAttr = Number.parseFloat(svgElement.getAttribute("width") || "");
    const heightAttr = Number.parseFloat(svgElement.getAttribute("height") || "");
    if (
      Number.isFinite(widthAttr) &&
      widthAttr > 0 &&
      Number.isFinite(heightAttr) &&
      heightAttr > 0
    ) {
      return {
        width: Math.max(1, Math.round(widthAttr)),
        height: Math.max(1, Math.round(heightAttr)),
      };
    }

    const rect = svgElement.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rect.width || 1)),
      height: Math.max(1, Math.round(rect.height || 1)),
    };
  }, []);

  const getRenderedSvg = useCallback(() => {
    return (diagramRef.current?.querySelector("svg") as SVGSVGElement | null) ?? null;
  }, []);

  const getSerializedSvg = useCallback(() => {
    const svgElement = getRenderedSvg();
    if (!svgElement) {
      return null;
    }

    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    const { width: resolvedWidth, height: resolvedHeight } = resolveSvgSize(svgElement);
    if (!clone.getAttribute("xmlns")) {
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
    if (!clone.getAttribute("xmlns:xlink")) {
      clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    }
    if (!clone.getAttribute("viewBox")) {
      clone.setAttribute("viewBox", `0 0 ${resolvedWidth} ${resolvedHeight}`);
    }
    clone.setAttribute("width", `${resolvedWidth}`);
    clone.setAttribute("height", `${resolvedHeight}`);

    return {
      svgText: new XMLSerializer().serializeToString(clone),
      width: resolvedWidth,
      height: resolvedHeight,
    };
  }, [getRenderedSvg, resolveSvgSize]);

  const triggerBlobDownload = useCallback((blob: Blob, fileName: string) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }, []);

  const handleExportSvg = useCallback(() => {
    const serialized = getSerializedSvg();
    if (!serialized) {
      return;
    }

    const svgBlob = new Blob([serialized.svgText], { type: "image/svg+xml;charset=utf-8" });
    triggerBlobDownload(svgBlob, `${getExportFileBaseName()}.svg`);
  }, [getExportFileBaseName, getSerializedSvg, triggerBlobDownload]);

  const handleExportPng = useCallback(async () => {
    const serialized = getSerializedSvg();
    if (!serialized) {
      return;
    }

    const { svgText, width, height } = serialized;
    const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const svgBlobUrl = window.URL.createObjectURL(svgBlob);

    try {
      const exportImage = new window.Image();
      await new Promise<void>((resolve, reject) => {
        exportImage.onload = () => resolve();
        exportImage.onerror = () => reject(new Error("Unable to render SVG for PNG export."));
        exportImage.src = svgBlobUrl;
      });

      const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.scale(pixelRatio, pixelRatio);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(exportImage, 0, 0, width, height);

      const pngBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      if (!pngBlob) {
        return;
      }

      triggerBlobDownload(pngBlob, `${getExportFileBaseName()}.png`);
    } catch {
      // no-op: skip export when SVG rasterization fails.
    } finally {
      window.URL.revokeObjectURL(svgBlobUrl);
    }
  }, [getExportFileBaseName, getSerializedSvg, triggerBlobDownload]);

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

      if (!cancelled && autoFitOnRender) {
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
  ]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
      if (autoFitSettleFrameRef.current !== null) {
        window.cancelAnimationFrame(autoFitSettleFrameRef.current);
        autoFitSettleFrameRef.current = null;
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
            <Tooltip title="Export SVG">
              <IconButton onClick={handleExportSvg} aria-label="Export diagram as SVG">
                <Polyline />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export PNG">
              <IconButton onClick={handleExportPng} aria-label="Export diagram as PNG">
                <ImageIcon />
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
            <Tooltip title={copySucceeded ? "Copied" : "Copy Mermaid Code"}>
              <IconButton onClick={handleCopyDiagramCode} aria-label="Copy Mermaid source code">
                {copySucceeded ? <Check /> : <ContentCopy />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Export SVG">
              <IconButton onClick={handleExportSvg} aria-label="Export diagram as SVG">
                <Polyline />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export PNG">
              <IconButton onClick={handleExportPng} aria-label="Export diagram as PNG">
                <ImageIcon />
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
            ...buildInteractiveViewportGridSx({
              enabled: shouldShowGridDots,
              backgroundColor: "#fff",
              dotColor: "#cecece",
              dotSizePx: 2,
              spacingPx: 30,
            }),
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
