"use client";

import * as React from "react";
import Image from "next/image";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import OpenInFull from "@mui/icons-material/OpenInFull";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import EmojiGlyph from "../controls/EmojiGlyph";
import ImageLightbox from "./ImageLightbox";
import VideoLightbox from "./VideoLightbox";

export type MediaCyclerItem = {
  key: string;
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  mediaAlt?: string;
  mediaLightboxTitle?: string;
  lightboxCaption?: string;
  mediaCaption?: string;
  mediaSource?: string;
  mediaSourceHref?: string;
  onSelect?: () => void;
  onMediaActivate?: () => void;
  onMediaLoaded?: () => void;
  panelRef?: React.Ref<HTMLDivElement>;
  panelSx?: SxProps<Theme>;
  assetFrameSx?: SxProps<Theme>;
  imageWidth?: number;
  imageHeight?: number;
  imageClassName?: string;
  imageStyle?: React.CSSProperties;
  previewVideoClassName?: string;
  previewVideoSx?: SxProps<Theme>;
  videoRef?: React.Ref<HTMLVideoElement>;
  controls?: boolean;
  autoPlay?: boolean;
  playsInline?: boolean;
  loop?: boolean;
  muted?: boolean;
  videoProps?: Omit<React.ComponentPropsWithoutRef<"video">, "src" | "children">;
  extraContent?: React.ReactNode;
};

type MediaCyclerProps = {
  items: MediaCyclerItem[];
  spacing?: number;
  stackSx?: SxProps<Theme>;
  singlePanel?: boolean;
  singlePanelActiveKey?: string;
  transitionMs?: number;
  disableTransition?: boolean;
  showChevronNavigation?: boolean;
  loopNavigation?: boolean;
  loopNavigationLabel?: string;
  loopNavigationGlyph?: string;
  disableLoopNavigation?: boolean;
  showExpandIcon?: boolean;
  disableChevronPrevious?: boolean;
  disableChevronNext?: boolean;
  onChevronPrevious?: () => void;
  onChevronNext?: () => void;
  onLoopNavigation?: () => void;
};

const toSxArray = (value?: SxProps<Theme>) => {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const renderSource = (label?: string, href?: string) => {
  if (!label) {
    return null;
  }

  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ mt: 1.5, display: "block" }}
    >
      Source:{" "}
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary.main"
        >
          {label}
        </Link>
      ) : (
        label
      )}
    </Typography>
  );
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

export default function MediaCycler({
  items,
  spacing = 2,
  stackSx,
  singlePanel = false,
  singlePanelActiveKey,
  transitionMs = 260,
  disableTransition = false,
  showChevronNavigation = false,
  loopNavigation = false,
  loopNavigationLabel = "Start Over",
  loopNavigationGlyph = "🔁",
  disableLoopNavigation = false,
  showExpandIcon = true,
  disableChevronPrevious,
  disableChevronNext,
  onChevronPrevious,
  onChevronNext,
  onLoopNavigation,
}: MediaCyclerProps) {
  const resolveActiveItem = React.useCallback(() => {
    if (items.length === 0) {
      return null;
    }

    if (singlePanelActiveKey) {
      return items.find((item) => item.key === singlePanelActiveKey) ?? items[0];
    }

    return items[0];
  }, [items, singlePanelActiveKey]);

  const initialItem = resolveActiveItem();
  const [renderedItem, setRenderedItem] = React.useState<MediaCyclerItem | null>(
    initialItem,
  );
  const [isVisible, setIsVisible] = React.useState(true);
  const [transitionDirection, setTransitionDirection] = React.useState<
    "left" | "right"
  >("right");

  React.useEffect(() => {
    if (!singlePanel) {
      return;
    }

    const nextItem = resolveActiveItem();
    const currentKey = renderedItem?.key ?? null;
    const nextKey = nextItem?.key ?? null;

    if (currentKey === nextKey) {
      return;
    }

    if (disableTransition) {
      setRenderedItem(nextItem);
      setIsVisible(true);
      return;
    }

    if (currentKey && nextKey) {
      const currentIndex = items.findIndex((item) => item.key === currentKey);
      const nextIndex = items.findIndex((item) => item.key === nextKey);
      if (currentIndex !== -1 && nextIndex !== -1) {
        setTransitionDirection(nextIndex > currentIndex ? "right" : "left");
      }
    }

    setIsVisible(false);
    const swapDelay = Math.max(120, Math.floor(transitionMs * 0.45));
    const timeoutId = window.setTimeout(() => {
      setRenderedItem(nextItem);
      window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, swapDelay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    disableTransition,
    items,
    renderedItem,
    resolveActiveItem,
    singlePanel,
    transitionMs,
  ]);

  const activeKey = renderedItem?.key ?? null;
  const activeIndex =
    activeKey == null ? -1 : items.findIndex((item) => item.key === activeKey);
  const previousItem = activeIndex > 0 ? items[activeIndex - 1] : null;
  const nextItem = activeIndex >= 0 ? items[activeIndex + 1] || null : null;
  const isAtFinalItem =
    activeIndex >= 0 && activeIndex === Math.max(items.length - 1, 0);
  const previousDisabled =
    disableChevronPrevious ?? (!previousItem || !Boolean(previousItem.onSelect));
  const nextDisabled =
    disableChevronNext ?? (!nextItem || !Boolean(nextItem.onSelect));
  const showLoopAction = loopNavigation && isAtFinalItem;
  const loopDisabled = disableLoopNavigation;

  const handleChevronPrevious = React.useCallback(() => {
    if (previousDisabled) {
      return;
    }

    if (onChevronPrevious) {
      onChevronPrevious();
      return;
    }

    previousItem?.onSelect?.();
  }, [onChevronPrevious, previousDisabled, previousItem]);

  const handleChevronNext = React.useCallback(() => {
    if (nextDisabled) {
      return;
    }

    if (onChevronNext) {
      onChevronNext();
      return;
    }

    nextItem?.onSelect?.();
  }, [nextDisabled, nextItem, onChevronNext]);

  const handleLoopNavigation = React.useCallback(() => {
    if (loopDisabled) {
      return;
    }

    if (onLoopNavigation) {
      onLoopNavigation();
      return;
    }

    const firstCycleItem = items[0];
    firstCycleItem?.onSelect?.();
  }, [items, loopDisabled, onLoopNavigation]);

  const renderItem = (item: MediaCyclerItem) => {
    const canActivate = Boolean(item.onMediaActivate);
    const hasTitle = item.title.trim().length > 0;
    const imageAlt = item.mediaAlt || item.title;
    const lightboxTitle = item.mediaLightboxTitle || item.title;
    const panelSxArray = toSxArray(item.panelSx);
    const assetFrameSxArray = toSxArray(item.assetFrameSx);
    const previewVideoSxArray = toSxArray(item.previewVideoSx);

    return (
      <Box
        key={item.key}
        ref={item.panelRef}
        sx={[
          {
            minWidth: 0,
          },
          ...panelSxArray,
        ]}
      >
        {hasTitle ? (
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {item.title}
          </Typography>
        ) : null}
        {item.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {item.description}
          </Typography>
        ) : null}

        <Box
          sx={[
            {
              width: "100%",
            },
            ...assetFrameSxArray,
          ]}
        >
          {item.mediaType === "image" ? (
            <Box
              role={canActivate ? "button" : undefined}
              tabIndex={canActivate ? 0 : -1}
              aria-label={canActivate ? `Activate ${item.title}` : undefined}
              onClick={item.onMediaActivate}
              onKeyDown={createMediaKeyDownHandler(item.onMediaActivate)}
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canActivate ? "pointer" : "default",
              }}
            >
              <Image
                src={item.mediaUrl}
                alt={imageAlt}
                width={item.imageWidth || 1200}
                height={item.imageHeight || 900}
                onLoad={item.onMediaLoaded}
                className={item.imageClassName}
                style={item.imageStyle}
              />
              {showExpandIcon ? (
                <Box
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    zIndex: 2,
                  }}
                >
                  <ImageLightbox
                    src={item.mediaUrl}
                    alt={imageAlt}
                    title={lightboxTitle}
                    caption={
                      item.lightboxCaption || item.mediaCaption || item.mediaSource
                    }
                    stopEventPropagation
                    triggerSx={{
                      all: "unset",
                      display: "inline-flex",
                      cursor: "zoom-in",
                    }}
                  >
                    <IconButton
                      type="button"
                      aria-label={`Open full image: ${lightboxTitle}`}
                      sx={(theme) => ({
                        border: "1px solid",
                        borderColor: alpha(theme.palette.common.white, 0.32),
                        color: theme.palette.common.white,
                        bgcolor: alpha(theme.palette.grey[900], 0.58),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.grey[900], 0.76),
                        },
                      })}
                    >
                      <OpenInFull fontSize="small" />
                    </IconButton>
                  </ImageLightbox>
                </Box>
              ) : null}
            </Box>
          ) : (
            <Box
              role={canActivate ? "button" : undefined}
              tabIndex={canActivate ? 0 : -1}
              aria-label={canActivate ? `Activate ${item.title}` : undefined}
              onClick={item.onMediaActivate}
              onKeyDown={createMediaKeyDownHandler(item.onMediaActivate)}
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: canActivate ? "pointer" : "default",
              }}
            >
              <VideoLightbox
                ref={item.videoRef}
                src={item.mediaUrl}
                title={lightboxTitle}
                caption={item.lightboxCaption || item.mediaCaption}
                controls={item.controls}
                autoPlay={item.autoPlay}
                playsInline={item.playsInline}
                loop={item.loop}
                muted={item.muted}
                stopEventPropagation={canActivate}
                showExpandButton={showExpandIcon}
                previewVideoClassName={item.previewVideoClassName}
                previewVideoSx={previewVideoSxArray}
                onLoadedData={item.onMediaLoaded}
                {...item.videoProps}
              />
            </Box>
          )}
        </Box>

        {renderSource(item.mediaSource, item.mediaSourceHref)}
        {item.mediaCaption ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: item.mediaSource ? 0.75 : 1.5 }}
          >
            {item.mediaCaption}
          </Typography>
        ) : null}

        {item.extraContent}
      </Box>
    );
  };

  if (singlePanel) {
    return (
      <Stack spacing={spacing} sx={stackSx}>
        <Box sx={{ position: "relative" }}>
          {showChevronNavigation && renderedItem ? (
            <>
              <IconButton
                type="button"
                aria-label="Previous media panel"
                onClick={handleChevronPrevious}
                disabled={previousDisabled}
                sx={(theme) => ({
                  position: "absolute",
                  left: { xs: 6, md: 8 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 3,
                  border: "1px solid",
                  borderColor: alpha(theme.palette.common.white, 0.22),
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[100]
                      : theme.palette.grey[900],
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(2,6,23,0.65)"
                      : alpha(theme.palette.background.paper, 0.82),
                })}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
              {showLoopAction ? (
                <Button
                  type="button"
                  aria-label={loopNavigationLabel}
                  onClick={handleLoopNavigation}
                  disabled={loopDisabled}
                  variant="contained"
                  size="small"
                  endIcon={
                    <EmojiGlyph
                      glyph={loopNavigationGlyph}
                      slot="end"
                      size="0.95rem"
                    />
                  }
                  sx={(theme) => ({
                    position: "absolute",
                    right: { xs: 6, md: 8 },
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 3,
                    borderRadius: "999px",
                    border: "1px solid",
                    borderColor: alpha(theme.palette.common.white, 0.22),
                    color:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[100]
                        : theme.palette.grey[900],
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(2,6,23,0.72)"
                        : alpha(theme.palette.background.paper, 0.88),
                    px: 1.1,
                    py: 0.35,
                    minHeight: 32,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(2,6,23,0.84)"
                          : alpha(theme.palette.background.paper, 0.96),
                    },
                  })}
                >
                  {loopNavigationLabel}
                </Button>
              ) : (
                <IconButton
                  type="button"
                  aria-label="Next media panel"
                  onClick={handleChevronNext}
                  disabled={nextDisabled}
                  sx={(theme) => ({
                    position: "absolute",
                    right: { xs: 6, md: 8 },
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 3,
                    border: "1px solid",
                    borderColor: alpha(theme.palette.common.white, 0.22),
                    color:
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[100]
                        : theme.palette.grey[900],
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(2,6,23,0.65)"
                        : alpha(theme.palette.background.paper, 0.82),
                  })}
                >
                  <ChevronRight fontSize="small" />
                </IconButton>
              )}
            </>
          ) : null}
          {renderedItem ? (
            <Box
              key={renderedItem.key}
              sx={{
                opacity: disableTransition ? 1 : isVisible ? 1 : 0,
                transform: disableTransition
                  ? "translateX(0px)"
                  : isVisible
                    ? "translateX(0px)"
                    : transitionDirection === "right"
                      ? "translateX(24px)"
                      : "translateX(-24px)",
                transition: disableTransition
                  ? "none"
                  : `opacity ${transitionMs}ms ease, transform ${transitionMs}ms cubic-bezier(.2,.8,.2,1)`,
              }}
            >
              {renderItem(renderedItem)}
            </Box>
          ) : null}
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={spacing} sx={stackSx}>
      {items.map((item) => renderItem(item))}
    </Stack>
  );
}
