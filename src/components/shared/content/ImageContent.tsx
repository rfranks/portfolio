"use client";

import type * as React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import { usePanZoomViewport } from "@/hooks/html/usePanZoomViewport";
import InteractiveViewportShell from "@/components/shared/visualization/InteractiveViewportShell";

type ImageContentProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onMediaActivate?: () => void;
};

const createMediaKeyDownHandler =
  (onMediaActivate?: () => void) => (event: React.KeyboardEvent<HTMLElement>) => {
    if (!onMediaActivate) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onMediaActivate();
    }
  };

export default function ImageContent({
  src,
  alt,
  width = 1200,
  height = 900,
  className,
  style,
  onLoad,
  onMediaActivate,
}: ImageContentProps) {
  const canActivate = Boolean(onMediaActivate);
  const {
    containerRef,
    viewportRef,
    scale,
    translateX,
    translateY,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUpOrLeave,
    handleDoubleClick,
  } = usePanZoomViewport({
    preset: "media",
    calibrationMediaType: "image",
    shouldIgnorePointerTarget: (target) => Boolean(target.closest("button") || target.closest("a")),
  });

  return (
    <InteractiveViewportShell
      containerRef={containerRef}
      viewportRef={viewportRef}
      width="100%"
      height="100%"
      gridBackgroundColor="transparent"
      role={canActivate ? "button" : undefined}
      tabIndex={canActivate ? 0 : -1}
      ariaLabel={canActivate ? `Activate ${alt}` : undefined}
      onClick={onMediaActivate}
      onKeyDown={createMediaKeyDownHandler(onMediaActivate)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
      onDoubleClick={handleDoubleClick}
      containerSx={{
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          transformOrigin: "top left",
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
          cursor: isDragging ? "grabbing" : "grab",
          transition: isDragging ? "none" : "transform 0.12s ease-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={onLoad}
          className={className}
          style={style}
        />
      </Box>
    </InteractiveViewportShell>
  );
}
