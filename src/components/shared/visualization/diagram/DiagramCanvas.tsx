import * as React from "react";
import Box from "@mui/material/Box";
import InteractiveViewportShell from "../InteractiveViewportShell";
import type { DiagramCanvasProps } from "@/types/components/shared/visualization";

export default function DiagramCanvas({
  width,
  height,
  visible,
  containerId,
  containerRef,
  viewportRef,
  diagramRef,
  shouldShowGridDots,
  scale,
  translateX,
  translateY,
  isDragging,
  isHydrated,
  diagramCode,
  onPointerDown,
  onPointerMove,
  onPointerUpOrLeave,
  onDoubleClick,
  onKeyDown,
  toolbar,
}: DiagramCanvasProps) {
  return (
    <InteractiveViewportShell
      containerId={containerId}
      containerRef={containerRef}
      viewportRef={viewportRef}
      width={width || "100%"}
      height={height || "auto"}
      visible={visible}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUpOrLeave as React.PointerEventHandler<HTMLDivElement>}
      onPointerLeave={onPointerUpOrLeave}
      onDoubleClick={onDoubleClick}
      topContent={toolbar}
      containerSx={{
        border: "1px solid #ccc",
      }}
      shouldShowGridDots={shouldShowGridDots}
      gridBackgroundColor="#fff"
      gridDotColor="#cecece"
      gridDotSizePx={2}
      gridSpacingPx={30}
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
    </InteractiveViewportShell>
  );
}
