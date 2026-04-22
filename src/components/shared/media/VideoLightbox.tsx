"use client";

import * as React from "react";
import { OpenInFull, Close } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type VideoLightboxProps = Omit<React.ComponentPropsWithoutRef<"video">, "children" | "src"> & {
  src: string;
  title: string;
  caption?: string;
  triggerSx?: SxProps<Theme>;
  previewVideoSx?: SxProps<Theme>;
  previewVideoClassName?: string;
  lightboxVideoSx?: SxProps<Theme>;
  stopEventPropagation?: boolean;
  openAriaLabel?: string;
  showExpandButton?: boolean;
  expandButtonSx?: SxProps<Theme>;
};

function toSxArray(value?: SxProps<Theme>) {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

const VideoLightbox = React.forwardRef<HTMLVideoElement, VideoLightboxProps>(
  function VideoLightbox(props, forwardedRef) {
    const {
      src,
      title,
      caption,
      triggerSx,
      previewVideoSx,
      previewVideoClassName,
      lightboxVideoSx,
      stopEventPropagation = false,
      openAriaLabel,
      showExpandButton = true,
      expandButtonSx,
      controls = true,
      autoPlay,
      playsInline,
      loop,
      muted,
      poster,
      preload,
      crossOrigin,
      disablePictureInPicture,
      controlsList,
      onLoadedData,
      ...previewVideoProps
    } = props;
    const [open, setOpen] = React.useState(false);
    const triggerSxArray = React.useMemo(() => toSxArray(triggerSx), [triggerSx]);
    const expandButtonSxArray = React.useMemo(() => toSxArray(expandButtonSx), [expandButtonSx]);
    const previewVideoSxArray = React.useMemo(() => toSxArray(previewVideoSx), [previewVideoSx]);
    const lightboxVideoSxArray = React.useMemo(() => toSxArray(lightboxVideoSx), [lightboxVideoSx]);
    const previewVideoRef = React.useRef<HTMLVideoElement | null>(null);

    const assignPreviewRef = React.useCallback(
      (node: HTMLVideoElement | null) => {
        previewVideoRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
          return;
        }
        if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    const handleOpen = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (stopEventPropagation) {
          event.preventDefault();
          event.stopPropagation();
        }
        previewVideoRef.current?.pause();
        setOpen(true);
      },
      [stopEventPropagation],
    );

    const lightboxLabel = title.trim() || "video";

    return (
      <>
        <Box
          sx={[
            {
              position: "relative",
              width: "100%",
              height: "100%",
            },
            ...triggerSxArray,
          ]}
        >
          <Box
            component="video"
            ref={assignPreviewRef}
            src={src}
            controls={controls}
            autoPlay={autoPlay}
            playsInline={playsInline}
            loop={loop}
            muted={muted}
            poster={poster}
            preload={preload}
            crossOrigin={crossOrigin}
            disablePictureInPicture={disablePictureInPicture}
            controlsList={controlsList}
            onLoadedData={onLoadedData}
            className={previewVideoClassName}
            sx={[{ display: "block" }, ...previewVideoSxArray]}
            {...previewVideoProps}
          />

          {showExpandButton ? (
            <IconButton
              type="button"
              aria-label={openAriaLabel || `Open full video: ${lightboxLabel}`}
              onClick={handleOpen}
              sx={[
                (theme) => ({
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: theme.zIndex.tooltip + 2,
                  width: 38,
                  height: 38,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.common.white, 0.5),
                  color: theme.palette.common.white,
                  bgcolor: "rgba(2,6,23,0.78)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.22) inset, 0 10px 18px rgba(2,6,23,0.45)",
                  backdropFilter: "blur(6px)",
                  opacity: 1,
                  pointerEvents: "auto",
                  "&:hover": {
                    bgcolor: "rgba(2,6,23,0.9)",
                  },
                }),
                ...expandButtonSxArray,
              ]}
            >
              <OpenInFull fontSize="small" />
            </IconButton>
          ) : null}
        </Box>

        <Dialog
          fullScreen
          open={open}
          onClose={() => setOpen(false)}
          sx={(theme) => ({ zIndex: theme.zIndex.modal + 20 })}
        >
          <Box
            sx={(theme) => ({
              position: "relative",
              width: "100%",
              height: "100%",
              bgcolor: theme.palette.mode === "dark" ? "rgba(0,0,0,0.96)" : "rgba(11,18,30,0.92)",
            })}
          >
            <Box
              sx={{
                position: "absolute",
                top: 10,
                left: 10,
                right: 10,
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
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
                  {lightboxLabel}
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
                aria-label="Close full video"
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
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: 1.5, md: 3 },
              }}
            >
              <Box
                component="video"
                src={src}
                controls={controls}
                autoPlay={autoPlay}
                playsInline={playsInline}
                loop={loop}
                muted={muted}
                poster={poster}
                preload={preload}
                crossOrigin={crossOrigin}
                disablePictureInPicture={disablePictureInPicture}
                controlsList={controlsList}
                sx={[
                  {
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  },
                  ...lightboxVideoSxArray,
                ]}
              />
            </Box>
          </Box>
        </Dialog>
      </>
    );
  },
);

export default VideoLightbox;
