"use client";

import * as React from "react";
import { alpha } from "@mui/material/styles";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material/styles";

type ImageLightboxProps = {
  src: string;
  alt: string;
  title?: string;
  caption?: string;
  children?: React.ReactNode;
  triggerSx?: SxProps<Theme>;
  previewImageSx?: SxProps<Theme>;
  previewContainerSx?: SxProps<Theme>;
  kenBurnsImageSx?: SxProps<Theme>;
  stopEventPropagation?: boolean;
};

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
  } = props;
  const [open, setOpen] = React.useState(false);
  const previewContainerSxArray = React.useMemo(
    () =>
      previewContainerSx == null
        ? []
        : Array.isArray(previewContainerSx)
          ? previewContainerSx
          : [previewContainerSx],
    [previewContainerSx],
  );
  const previewImageSxArray = React.useMemo(
    () =>
      previewImageSx == null
        ? []
        : Array.isArray(previewImageSx)
          ? previewImageSx
          : [previewImageSx],
    [previewImageSx],
  );
  const kenBurnsImageSxArray = React.useMemo(
    () =>
      kenBurnsImageSx == null
        ? []
        : Array.isArray(kenBurnsImageSx)
          ? kenBurnsImageSx
          : [kenBurnsImageSx],
    [kenBurnsImageSx],
  );
  const triggerSxArray = React.useMemo(
    () =>
      triggerSx == null
        ? []
        : Array.isArray(triggerSx)
          ? triggerSx
          : [triggerSx],
    [triggerSx],
  );

  const handleOpen = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (stopEventPropagation) {
        event.preventDefault();
        event.stopPropagation();
      }
      setOpen(true);
    },
    [stopEventPropagation],
  );

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={`Open full image: ${title?.trim() || alt}`}
        onClick={handleOpen}
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
            position: "relative",
            width: "100%",
            height: "100%",
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(0,0,0,0.96)"
                : "rgba(11,18,30,0.92)",
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
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 1.5, md: 3 },
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
              }}
            />
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
