"use client";

import * as React from "react";
import { alpha } from "@mui/material/styles";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import { CenterFocusStrong, Close, ZoomIn, ZoomOut } from "@mui/icons-material";
import type { ImageLightboxProps } from "@/types/components/shared/media";
import { usePanZoomViewport } from "@/hooks/html/usePanZoomViewport";
import { toSxArray } from "@/utils/sx/toSxArray";

export default function ImageLightbox(props: ImageLightboxProps) {
  const {
    src,
    alt,
    title,
    caption,
    children,
    triggerSx,
    previewImageSx,
    previewContainerSx,
    kenBurnsImageSx,
    stopEventPropagation = false,
    onOpen,
  } = props;
  const [open, setOpen] = React.useState(false);
  const {
    containerRef,
    viewportRef,
    scale,
    translateX,
    translateY,
    isDragging,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handlePointerDown,
    handlePointerMove,
    handlePointerUpOrLeave,
    handleDoubleClick,
  } = usePanZoomViewport({
    calibrationMediaType: "image",
    shouldIgnorePointerTarget: (target) => Boolean(target.closest("button")),
  });
  const previewContainerSxArray = React.useMemo(
    () => toSxArray(previewContainerSx),
    [previewContainerSx],
  );
  const previewImageSxArray = React.useMemo(() => toSxArray(previewImageSx), [previewImageSx]);
  const kenBurnsImageSxArray = React.useMemo(() => toSxArray(kenBurnsImageSx), [kenBurnsImageSx]);
  const triggerSxArray = React.useMemo(() => toSxArray(triggerSx), [triggerSx]);

  const handleOpen = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (stopEventPropagation) {
        event.preventDefault();
        event.stopPropagation();
      }
      onOpen?.("pointer", "image-lightbox-open");
      setOpen(true);
    },
    [onOpen, stopEventPropagation],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      if (stopEventPropagation) {
        event.preventDefault();
        event.stopPropagation();
      }
      onOpen?.("keyboard", "image-lightbox-open");
      setOpen(true);
    },
    [onOpen, stopEventPropagation],
  );

  React.useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [handleReset, open]);

  return (
    <>
      <Box
        component="span"
        role="button"
        tabIndex={0}
        aria-label={`Open full image: ${title?.trim() || alt}`}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        sx={[
          {
            all: "unset",
            display: "block",
            cursor: "zoom-in",
          },
          ...triggerSxArray,
          ...previewContainerSxArray,
        ]}
      >
        {children ? (
          children
        ) : (
          <Box
            component="img"
            src={src}
            alt={alt}
            sx={[
              {
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              },
              ...kenBurnsImageSxArray,
              ...previewImageSxArray,
            ]}
          />
        )}
      </Box>

      <Dialog
        fullScreen
        open={open}
        onClose={() => setOpen(false)}
        sx={(theme) => ({ zIndex: theme.zIndex.modal + 20 })}
      >
        <Box
          sx={(theme) => ({
            width: "100%",
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            bgcolor: theme.palette.mode === "dark" ? "rgba(0,0,0,0.96)" : "rgba(11,18,30,0.92)",
          })}
        >
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              flexShrink: 0,
              px: { xs: 1, md: 1.25 },
              pt: { xs: 1, md: 1.25 },
              pb: 0.75,
            }}
          >
            <Box
              sx={(theme) => ({
                minWidth: 0,
                flex: 1,
                px: 1.1,
                py: 0.75,
                borderRadius: 1,
                border: "1px solid",
                borderColor: alpha(theme.palette.common.white, 0.28),
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.45)"
                    : alpha(theme.palette.background.paper, 0.78),
              })}
            >
              <Typography
                variant="subtitle2"
                sx={(theme) => ({
                  lineHeight: 1.2,
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[100]
                      : theme.palette.text.primary,
                })}
              >
                {title?.trim() || alt}
              </Typography>
              {caption?.trim() ? (
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    display: "block",
                    mt: 0.35,
                    lineHeight: 1.25,
                    color:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[300]
                        : theme.palette.text.secondary,
                  })}
                >
                  {caption}
                </Typography>
              ) : null}
            </Box>
            <IconButton
              aria-label="Zoom out image"
              onClick={handleZoomOut}
              sx={(theme) => ({
                border: "1px solid",
                borderColor: alpha(theme.palette.common.white, 0.35),
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[100]
                    : theme.palette.common.white,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.45)"
                    : alpha(theme.palette.grey[900], 0.45),
              })}
            >
              <ZoomOut />
            </IconButton>
            <IconButton
              aria-label="Zoom in image"
              onClick={handleZoomIn}
              sx={(theme) => ({
                border: "1px solid",
                borderColor: alpha(theme.palette.common.white, 0.35),
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[100]
                    : theme.palette.common.white,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.45)"
                    : alpha(theme.palette.grey[900], 0.45),
              })}
            >
              <ZoomIn />
            </IconButton>
            <IconButton
              aria-label="Reset image transform"
              onClick={handleReset}
              sx={(theme) => ({
                border: "1px solid",
                borderColor: alpha(theme.palette.common.white, 0.35),
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[100]
                    : theme.palette.common.white,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.45)"
                    : alpha(theme.palette.grey[900], 0.45),
              })}
            >
              <CenterFocusStrong />
            </IconButton>
            <IconButton
              aria-label="Close full image"
              onClick={() => setOpen(false)}
              sx={(theme) => ({
                border: "1px solid",
                borderColor: alpha(theme.palette.common.white, 0.35),
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[100]
                    : theme.palette.common.white,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.45)"
                    : alpha(theme.palette.grey[900], 0.45),
              })}
            >
              <Close />
            </IconButton>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 1.5, md: 3 },
              touchAction: "none",
              overscrollBehavior: "contain",
            }}
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            onDoubleClick={handleDoubleClick}
          >
            <Box
              ref={viewportRef}
              sx={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <Box
                component="img"
                src={src}
                alt={alt}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                  transformOrigin: "top left",
                  transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                  cursor: isDragging ? "grabbing" : "grab",
                  transition: isDragging ? "none" : "transform 0.12s ease-out",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
