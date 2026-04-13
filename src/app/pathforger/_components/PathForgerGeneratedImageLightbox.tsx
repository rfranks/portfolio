import * as React from "react";
import {
  Box,
  Dialog,
  IconButton,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material/styles";

type PathForgerGeneratedImageLightboxProps = {
  src: string;
  alt: string;
  previewImageSx?: SxProps<Theme>;
  previewContainerSx?: SxProps<Theme>;
  kenBurnsImageSx?: SxProps<Theme>;
  stopEventPropagation?: boolean;
};

export default function PathForgerGeneratedImageLightbox(
  props: PathForgerGeneratedImageLightboxProps,
) {
  const {
    src,
    alt,
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
        aria-label={`Open full image: ${alt}`}
        onClick={handleOpen}
        sx={[
          {
            all: "unset",
            width: "100%",
            height: "100%",
            display: "block",
            cursor: "zoom-in",
          },
          ...previewContainerSxArray,
        ]}
      >
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
      </Box>

      <Dialog
        fullScreen
        open={open}
        onClose={() => setOpen(false)}
        sx={(theme) => ({ zIndex: theme.zIndex.modal + 20 })}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            bgcolor: "rgba(0,0,0,0.96)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="caption" color="grey.100">
              Full image
            </Typography>
            <IconButton
              aria-label="Close full image"
              onClick={() => setOpen(false)}
              sx={{
                border: "1px solid",
                borderColor: "rgba(255,255,255,0.35)",
                color: "grey.100",
                bgcolor: "rgba(0,0,0,0.45)",
              }}
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
