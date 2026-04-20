import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";

// libraries
import { v4 as uuid } from "uuid";
import mermaid from "mermaid";

// MUI components
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";

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
  id = `diagramId_${uuid().replace(/-/g, "_")}`,
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
}: DiagramProps): ReactNode => {
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

  // Pan/Zoom states
  interface TransformState {
    scale: number;
    translateX: number;
    translateY: number;
  }

  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

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
    [history, historyIndex]
  );

  const applyTransformState = useCallback((st: TransformState) => {
    setScale(st.scale);
    setTranslateX(st.translateX);
    setTranslateY(st.translateY);
  }, []);

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
  const ZOOM_STEP = 2.0;
  const PAN_STEP = 50;

  const doTransform = useCallback(
    (newScale: number, newX: number, newY: number) => {
      setScale(newScale);
      setTranslateX(newX);
      setTranslateY(newY);
      pushHistory({ scale: newScale, translateX: newX, translateY: newY });
    },
    [pushHistory]
  );

  const handleZoomIn = useCallback(() => {
    doTransform(scale + ZOOM_STEP, translateX, translateY);
  }, [scale, translateX, translateY, doTransform]);

  const handleZoomOut = useCallback(() => {
    doTransform(Math.max(0.1, scale - ZOOM_STEP), translateX, translateY);
  }, [scale, translateX, translateY, doTransform]);

  const handleReset = useCallback(() => {
    doTransform(1, 0, 0);
  }, [doTransform]);

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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    // Skip if clicking on toolbar or button
    if (el.closest(".MuiToolbar-root") || el.closest("button")) return;

    // If ctrlKey => zoom in, if shiftKey => zoom out
    // Single-click with ctrl or shift
    if (e.ctrlKey && e.button === 0) {
      e.stopPropagation();
      e.preventDefault();
      // Zoom in by +1
      doTransform(scale + 1, translateX, translateY);
      return;
    }
    if (e.shiftKey && e.button === 0) {
      e.stopPropagation();
      e.preventDefault();
      // Zoom out by -1, but not below 0.1
      doTransform(Math.max(0.1, scale - 1), translateX, translateY);
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
    if (!isDragging || !lastPointerPos) return;
    const dx = e.clientX - lastPointerPos.x;
    const dy = e.clientY - lastPointerPos.y;
    setTranslateX((prev) => prev + dx);
    setTranslateY((prev) => prev + dy);
    setLastPointerPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUpOrLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      pushHistory({ scale, translateX, translateY });
    }
    setIsDragging(false);
    setLastPointerPos(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Double-click => zoom in by +1 scale
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    doTransform(scale + 1, translateX, translateY);
  };

  // Scroll & pinch
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomDelta = -e.deltaY * 0.001;
      const newScale = Math.max(0.1, scale + zoomDelta);
      doTransform(newScale, translateX, translateY);
    }
  };

  // Initialize Mermaid if in view, mermaid syntax, not showing text
  useEffect(() => {
    if (!diagramRef.current) return;
    if (syntax !== "mermaid") return;
    if (!isVisible) return;
    if (showingText) return;

    diagramRef.current.removeAttribute("data-processed");
    diagramRef.current.innerHTML = diagramCode;

    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {},
    });
    mermaid.run({
      nodes: [diagramRef.current],
      querySelector: ".mermaid",
    });
  }, [syntax, diagramCode, showingText, isVisible]);

  return (
    <>
      <Box
        sx={{
          border: "1px solid #ccc",
          display: syntax === "text" || showingText ? "block" : "none",
          p: 1,
        }}
      >
        {showToolbar && (
          <Toolbar variant="dense" sx={{ minHeight: 40 }}>
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
          </Toolbar>
        )}
        <pre>{diagramCode}</pre>
      </Box>
      <Box
        id={`${id}-container`}
        sx={{
          width: width || "100%",
          height: height || "auto",
          border: "1px solid #ccc",
          position: "relative",
          display: syntax === "mermaid" && !showingText ? "flex" : "none",
          flexDirection: "column",
          touchAction: "none",
        }}
        onWheel={handleWheel}
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
              "@media (max-width: 600px)": { display: "none" },
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
          </Toolbar>
        )}

        <Box
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
            className="mermaid"
            sx={{
              transition: "transform 0.2s",
              transformOrigin: "top left",
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
          >
            {diagramCode}
          </Box>
        </Box>
      </Box>
    </>
  );
};
