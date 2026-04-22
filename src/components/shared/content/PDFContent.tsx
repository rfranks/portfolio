"use client";

import type * as React from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

type PDFContentProps = {
  src: string;
  title: string;
  onLoad?: () => void;
  onMediaActivate?: () => void;
  previewSx?: SxProps<Theme>;
  containerSx?: SxProps<Theme>;
  frameSx?: SxProps<Theme>;
  objectSx?: SxProps<Theme>;
  iframeSx?: SxProps<Theme>;
  showOpenLink?: boolean;
  openLinkLabel?: string;
  openLinkHref?: string;
  openLinkDescription?: React.ReactNode;
};

const toSxArray = (value?: SxProps<Theme>) => {
  if (value == null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
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

export default function PDFContent({
  src,
  title,
  onLoad,
  onMediaActivate,
  previewSx,
  containerSx,
  frameSx,
  objectSx,
  iframeSx,
  showOpenLink = true,
  openLinkLabel = "Open document",
  openLinkHref,
  openLinkDescription = "or open the PDF in a separate tab.",
}: PDFContentProps) {
  const previewSxArray = toSxArray(previewSx);
  const containerSxArray = toSxArray(containerSx);
  const frameSxArray = toSxArray(frameSx);
  const objectSxArray = toSxArray(objectSx);
  const iframeSxArray = toSxArray(iframeSx);
  const resolvedPdfSrc = src.includes("#") ? src : `${src}#view=FitH`;
  const resolvedOpenLinkHref = openLinkHref || src;
  const canActivate = Boolean(onMediaActivate);

  return (
    <Box sx={containerSxArray}>
      <Box
        sx={[
          (theme) => ({
            overflow: "hidden",
            borderRadius: "18px",
            border: "1px solid",
            borderColor: "var(--fabric-surface-border)",
            cursor: canActivate ? "pointer" : "default",
            bgcolor:
              theme.palette.mode === "light"
                ? alpha(theme.palette.common.white, 0.8)
                : "rgba(15,23,42,0.48)",
          }),
          ...frameSxArray,
        ]}
        role={canActivate ? "button" : undefined}
        tabIndex={canActivate ? 0 : -1}
        onClick={onMediaActivate}
        onKeyDown={createMediaKeyDownHandler(onMediaActivate)}
      >
        <Box
          component="object"
          data={resolvedPdfSrc}
          type="application/pdf"
          aria-label={title}
          sx={[
            {
              display: "block",
              width: "100%",
              height: "100%",
            },
            ...previewSxArray,
            ...objectSxArray,
          ]}
        >
          <Box
            component="iframe"
            src={resolvedPdfSrc}
            title={title}
            onLoad={onLoad}
            sx={[
              (theme) => ({
                width: "100%",
                height: "100%",
                border: 0,
                bgcolor:
                  theme.palette.mode === "light"
                    ? alpha(theme.palette.common.white, 0.84)
                    : "rgba(15,23,42,0.48)",
              }),
              ...previewSxArray,
              ...iframeSxArray,
            ]}
          />
        </Box>
      </Box>
      {showOpenLink ? (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 1.25 }}
        >
          Read inline{" "}
          <Link
            href={resolvedOpenLinkHref}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="primary.main"
            sx={{ display: "inline-flex" }}
          >
            {openLinkLabel}
          </Link>
          {openLinkDescription ? (
            <Typography variant="caption" color="text.secondary">
              {openLinkDescription}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}
