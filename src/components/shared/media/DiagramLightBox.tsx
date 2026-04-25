"use client";

import * as React from "react";
import { Close, OpenInFull } from "@mui/icons-material";
import { Box, Dialog, IconButton, Typography, Tooltip, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Diagram } from "../visualization";
import type { DiagramLightBoxProps } from "@/types/components/shared/media";
import { toSxArray } from "@/utils/sx/toSxArray";

export default function DiagramLightBox({
  diagram,
  title,
  subtitle,
  caption,
  diagramProps,
  showExpandButton = true,
  expandButtonSx,
  stopEventPropagation = false,
  containerSx,
  onOpen,
}: DiagramLightBoxProps) {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const expandButtonSxArray = React.useMemo(() => toSxArray(expandButtonSx), [expandButtonSx]);
  const containerSxArray = React.useMemo(() => toSxArray(containerSx), [containerSx]);

  const baseId = diagramProps?.id;
  const inlineId = baseId ? `${baseId}-inline` : undefined;
  const lightboxId = baseId ? `${baseId}-lightbox` : undefined;
  const lightboxLabel = title.trim() || "diagram";

  const handleOpen = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (stopEventPropagation) {
        event.preventDefault();
        event.stopPropagation();
      }
      const trigger = event.detail === 0 ? "keyboard" : "pointer";
      onOpen?.(trigger, "diagram-lightbox-open");
      setOpen(true);
    },
    [onOpen, stopEventPropagation],
  );

  const desktopToolbarExpandAction =
    !isSmDown && showExpandButton ? (
      <>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={`Open full diagram: ${lightboxLabel}`}>
          <IconButton aria-label={`Open full diagram: ${lightboxLabel}`} onClick={handleOpen}>
            <OpenInFull fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    ) : null;

  return (
    <>
      <Box
        sx={[
          {
            width: "100%",
            height: "100%",
            minHeight: 0,
            position: "relative",
          },
          ...containerSxArray,
        ]}
      >
        <Diagram
          {...diagramProps}
          id={inlineId}
          diagram={diagram}
          title={diagramProps?.title ?? title}
          showToolbar={diagramProps?.showToolbar ?? true}
          alwaysShowToolbar={diagramProps?.alwaysShowToolbar ?? false}
          toolbarActions={
            <>
              {diagramProps?.toolbarActions}
              {desktopToolbarExpandAction}
            </>
          }
        />

        {isSmDown && showExpandButton ? (
          <IconButton
            type="button"
            aria-label={`Open full diagram: ${lightboxLabel}`}
            onClick={handleOpen}
            sx={[
              (nextTheme) => ({
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: nextTheme.zIndex.tooltip + 2,
                width: 38,
                height: 38,
                border: "1px solid",
                borderColor: nextTheme.palette.common.black,
                color: nextTheme.palette.common.black,
                bgcolor: nextTheme.palette.common.white,
                boxShadow: "0 10px 18px rgba(2,6,23,0.2)",
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
        sx={(nextTheme) => ({ zIndex: nextTheme.zIndex.modal + 20 })}
      >
        <Box
          sx={(nextTheme) => ({
            width: "100%",
            height: "100%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            bgcolor: nextTheme.palette.mode === "dark" ? "rgba(0,0,0,0.96)" : "rgba(11,18,30,0.92)",
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
              sx={(nextTheme) => ({
                minWidth: 0,
                flex: 1,
                px: 1.1,
                py: 0.75,
                borderRadius: 1,
                border: "1px solid",
                borderColor: alpha(nextTheme.palette.common.white, 0.28),
                bgcolor: alpha(nextTheme.palette.grey[900], 0.52),
                backdropFilter: "blur(6px)",
              })}
            >
              <Typography
                variant="subtitle2"
                sx={(nextTheme) => ({
                  lineHeight: 1.2,
                  color: alpha(nextTheme.palette.common.white, 0.95),
                })}
              >
                {lightboxLabel}
              </Typography>
              {subtitle?.trim() ? (
                <Typography
                  variant="body2"
                  sx={(nextTheme) => ({
                    display: "block",
                    mt: 0.35,
                    lineHeight: 1.25,
                    color: alpha(nextTheme.palette.common.white, 0.86),
                  })}
                >
                  {subtitle}
                </Typography>
              ) : null}
              {caption?.trim() ? (
                <Typography
                  variant="caption"
                  sx={(nextTheme) => ({
                    display: "block",
                    mt: 0.35,
                    lineHeight: 1.25,
                    color: alpha(nextTheme.palette.common.white, 0.78),
                  })}
                >
                  {caption}
                </Typography>
              ) : null}
            </Box>
            <IconButton
              aria-label="Close full diagram"
              onClick={() => setOpen(false)}
              sx={(nextTheme) => ({
                border: "1px solid",
                borderColor: alpha(nextTheme.palette.common.white, 0.35),
                color: alpha(nextTheme.palette.common.white, 0.94),
                bgcolor: alpha(nextTheme.palette.grey[900], 0.52),
                backdropFilter: "blur(6px)",
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
              alignItems: "stretch",
              justifyContent: "stretch",
              p: { xs: 1.5, md: 3 },
            }}
          >
            <Box
              sx={(nextTheme) => ({
                width: "100%",
                height: "100%",
                minHeight: 0,
                "& .MuiToolbar-root": {
                  border: "1px solid",
                  borderColor: nextTheme.palette.divider,
                  borderBottom: 0,
                  color: nextTheme.palette.text.primary,
                  bgcolor:
                    nextTheme.palette.mode === "dark"
                      ? alpha(nextTheme.palette.background.paper, 0.84)
                      : alpha(nextTheme.palette.background.paper, 0.96),
                },
                "& .MuiToolbar-root .MuiIconButton-root": {
                  color: nextTheme.palette.text.primary,
                },
                "& .MuiToolbar-root .MuiIconButton-root.Mui-disabled": {
                  color: nextTheme.palette.text.disabled,
                },
                "& .MuiToolbar-root .MuiDivider-root": {
                  borderColor: nextTheme.palette.divider,
                },
                "& [id$='-container']": {
                  borderColor: nextTheme.palette.divider,
                },
              })}
            >
              <Diagram
                {...diagramProps}
                id={lightboxId}
                diagram={diagram}
                title={diagramProps?.title ?? title}
                showToolbar
                alwaysShowToolbar
                height={diagramProps?.height ?? "100%"}
                width={diagramProps?.width ?? "100%"}
              />
            </Box>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
