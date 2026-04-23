import * as React from "react";
import Box from "@mui/material/Box";
import { buildInteractiveViewportGridSx } from "@/hooks/html/usePanZoomViewport";
import type { InteractiveViewportShellProps } from "@/types/components/shared/visualization";
import { toSxArray } from "@/utils/sx/toSxArray";

export default function InteractiveViewportShell({
  containerId,
  width = "100%",
  height = "100%",
  visible = true,
  containerRef,
  viewportRef,
  topContent,
  bottomContent,
  containerSx,
  viewportSx,
  role,
  tabIndex,
  ariaLabel,
  onClick,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onDoubleClick,
  shouldShowGridDots = false,
  gridBackgroundColor = "#fff",
  gridDotColor = "#cecece",
  gridDotSizePx = 2,
  gridSpacingPx = 30,
  children,
}: InteractiveViewportShellProps) {
  const containerSxArray = React.useMemo(() => toSxArray(containerSx), [containerSx]);
  const viewportSxArray = React.useMemo(() => toSxArray(viewportSx), [viewportSx]);

  return (
    <Box
      id={containerId}
      ref={containerRef}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onDoubleClick={onDoubleClick}
      sx={[
        {
          width,
          height,
          position: "relative",
          display: visible ? "flex" : "none",
          flexDirection: "column",
          minHeight: 0,
          touchAction: "none",
          overscrollBehavior: "contain",
        },
        ...containerSxArray,
      ]}
    >
      {topContent}
      <Box
        ref={viewportRef}
        sx={[
          {
            position: "relative",
            overflow: "hidden",
            flexGrow: 1,
            width: "100%",
            minHeight: 0,
            ...buildInteractiveViewportGridSx({
              enabled: shouldShowGridDots,
              backgroundColor: gridBackgroundColor,
              dotColor: gridDotColor,
              dotSizePx: gridDotSizePx,
              spacingPx: gridSpacingPx,
            }),
          },
          ...viewportSxArray,
        ]}
      >
        {children}
      </Box>
      {bottomContent}
    </Box>
  );
}
