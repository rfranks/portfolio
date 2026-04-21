"use client";

import * as React from "react";
import Image from "next/image";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Close from "@mui/icons-material/Close";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Loop from "@mui/icons-material/Loop";
import OpenInFull from "@mui/icons-material/OpenInFull";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import MarkdownContent from "../content/MarkdownContent";
import PDFContent from "../content/PDFContent";
import type { DiagramProps } from "../visualization";
import { Diagram } from "../visualization";
import ImageLightbox from "./ImageLightbox";
import VideoLightbox from "./VideoLightbox";

export type MediaCyclerItem = {
  key: string;
  title: string;
  titleIcon?: React.ReactNode;
  titleIconAriaLabel?: string;
  titleIconSx?: SxProps<Theme>;
  titleVariant?: TypographyProps["variant"];
  titleSx?: SxProps<Theme>;
  description?: string;
  mediaUrl: string;
  mediaType:
    | "image"
    | "video"
    | "pdf"
    | "markdown"
    | "diagram"
    | "custom"
    | "project"
    | "projectPresentation"
    | "recognition"
    | "recommendation";
  mediaAlt?: string;
  mediaLightboxTitle?: string;
  lightboxCaption?: string;
  mediaCaption?: string;
  mediaSource?: string;
  mediaSourceHref?: string;
  customContent?: React.ReactNode;
  customContentSx?: SxProps<Theme>;
  markdownContent?: string;
  markdownPath?: string;
  markdownSx?: SxProps<Theme>;
  diagramProps?: Omit<DiagramProps, "diagram" | "id">;
  diagramSx?: SxProps<Theme>;
  pdfContainerSx?: SxProps<Theme>;
  pdfFrameSx?: SxProps<Theme>;
  pdfPreviewSx?: SxProps<Theme>;
  pdfObjectSx?: SxProps<Theme>;
  pdfIframeSx?: SxProps<Theme>;
  pdfShowOpenLink?: boolean;
  pdfOpenLinkLabel?: string;
  pdfOpenLinkHref?: string;
  pdfOpenLinkDescription?: React.ReactNode;
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
  videoProps?: Omit<
    React.ComponentPropsWithoutRef<"video">,
    "src" | "children"
  >;
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
  loopNavigationIcon?: "loop" | "leftChevron" | "rightChevron";
  disableLoopNavigation?: boolean;
  loopFromBeginning?: boolean;
  loppFromBeginniner?: boolean;
  compactMetadataOnSmallScreens?: boolean;
  showExpandIcon?: boolean;
  disableChevronPrevious?: boolean;
  disableChevronNext?: boolean;
  hideDisabledNextChevron?: boolean;
  onChevronPrevious?: () => void;
  onChevronNext?: () => void;
  onLoopNavigation?: () => void;
  smallScreenInfoBlurb?: string;
  navigationControlSx?: SxProps<Theme>;
  expandControlSx?: SxProps<Theme>;
  showCompactInfoButton?: boolean;
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
  (onMediaActivate?: () => void) =>
  (event: React.KeyboardEvent<HTMLElement>) => {
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
  loopNavigationLabel = "Loop media cycle",
  loopNavigationIcon = "loop",
  disableLoopNavigation = false,
  loopFromBeginning = false,
  loppFromBeginniner = false,
  compactMetadataOnSmallScreens = false,
  showExpandIcon = true,
  disableChevronPrevious,
  disableChevronNext,
  hideDisabledNextChevron = false,
  onChevronPrevious,
  onChevronNext,
  onLoopNavigation,
  smallScreenInfoBlurb,
  navigationControlSx,
  expandControlSx,
  showCompactInfoButton = true,
}: MediaCyclerProps) {
  const resolveActiveItem = React.useCallback(() => {
    if (items.length === 0) {
      return null;
    }

    if (singlePanelActiveKey) {
      return (
        items.find((item) => item.key === singlePanelActiveKey) ?? items[0]
      );
    }

    return items[0];
  }, [items, singlePanelActiveKey]);

  const initialItem = resolveActiveItem();
  const [renderedItem, setRenderedItem] =
    React.useState<MediaCyclerItem | null>(initialItem);
  const [isVisible, setIsVisible] = React.useState(true);
  const [transitionDirection, setTransitionDirection] = React.useState<
    "left" | "right"
  >("right");
  const [metadataDialogItemKey, setMetadataDialogItemKey] = React.useState<
    string | null
  >(null);

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
  const stackSxArray = toSxArray(stackSx);
  const navigationControlSxArray = toSxArray(navigationControlSx);
  const expandControlSxArray = toSxArray(expandControlSx);
  const activeIndex =
    activeKey == null ? -1 : items.findIndex((item) => item.key === activeKey);
  const hasMultipleItems = items.length > 1;
  const loopFromFirstToLast = loopFromBeginning || loppFromBeginniner;
  const previousItem = activeIndex > 0 ? items[activeIndex - 1] : null;
  const nextItem = activeIndex >= 0 ? items[activeIndex + 1] || null : null;
  const isAtFinalItem =
    activeIndex >= 0 && activeIndex === Math.max(items.length - 1, 0);
  const canWrapToFirst = loopNavigation && isAtFinalItem && hasMultipleItems;
  const canWrapToLast =
    loopNavigation &&
    loopFromFirstToLast &&
    activeIndex === 0 &&
    hasMultipleItems;
  const previousDisabledRaw =
    disableChevronPrevious ??
    (!previousItem || !Boolean(previousItem.onSelect));
  const nextDisabledRaw =
    disableChevronNext ?? (!nextItem || !Boolean(nextItem.onSelect));
  const previousDisabled = previousDisabledRaw && !canWrapToLast;
  const nextDisabled = nextDisabledRaw && !canWrapToFirst;
  const showLoopAction = canWrapToFirst;
  const loopDisabled = disableLoopNavigation;
  const hideNextChevron =
    hideDisabledNextChevron && !showLoopAction && nextDisabled;

  const handleChevronPrevious = React.useCallback(() => {
    if (previousDisabled) {
      return;
    }

    if (onChevronPrevious) {
      onChevronPrevious();
      return;
    }

    if (previousItem?.onSelect) {
      previousItem.onSelect();
      return;
    }

    if (canWrapToLast) {
      const lastItem = items[items.length - 1];
      lastItem?.onSelect?.();
    }
  }, [canWrapToLast, items, onChevronPrevious, previousDisabled, previousItem]);

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

  const metadataDialogItem =
    metadataDialogItemKey == null
      ? null
      : items.find((item) => item.key === metadataDialogItemKey) || null;
  const [markdownByKey, setMarkdownByKey] = React.useState<
    Record<string, string>
  >({});

  React.useEffect(() => {
    const markdownItems = items.filter(
      (item) => item.mediaType === "markdown" && item.markdownPath?.trim(),
    );

    if (markdownItems.length === 0) {
      return;
    }

    const abortControllers: AbortController[] = [];
    let cancelled = false;

    const loadMarkdown = async () => {
      const entries = await Promise.all(
        markdownItems.map(async (item) => {
          const controller = new AbortController();
          abortControllers.push(controller);

          try {
            const response = await fetch(item.markdownPath as string, {
              signal: controller.signal,
            });
            if (!response.ok) {
              return [item.key, ""] as const;
            }
            const text = await response.text();
            return [item.key, text] as const;
          } catch {
            return [item.key, ""] as const;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setMarkdownByKey((current) => {
        const next = { ...current };
        entries.forEach(([key, content]) => {
          next[key] = content;
        });
        return next;
      });
    };

    void loadMarkdown();

    return () => {
      cancelled = true;
      abortControllers.forEach((controller) => controller.abort());
    };
  }, [items]);

  const renderItem = (
    item: MediaCyclerItem,
    navigationOverlay?: React.ReactNode,
  ) => {
    const canActivate = Boolean(item.onMediaActivate);
    const hasTitle = item.title.trim().length > 0;
    const imageAlt = item.mediaAlt || item.title;
    const lightboxTitle = item.mediaLightboxTitle || item.title;
    const panelSxArray = toSxArray(item.panelSx);
    const titleIconSxArray = toSxArray(item.titleIconSx);
    const titleSxArray = toSxArray(item.titleSx);
    const assetFrameSxArray = toSxArray(item.assetFrameSx);
    const previewVideoSxArray = toSxArray(item.previewVideoSx);
    const markdownSxArray = toSxArray(item.markdownSx);
    const diagramSxArray = toSxArray(item.diagramSx);
    const customContentSxArray = toSxArray(item.customContentSx);
    const pdfContainerSxArray = toSxArray(item.pdfContainerSx);
    const pdfFrameSxArray = toSxArray(item.pdfFrameSx);
    const pdfPreviewSxArray = toSxArray(item.pdfPreviewSx);
    const pdfObjectSxArray = toSxArray(item.pdfObjectSx);
    const pdfIframeSxArray = toSxArray(item.pdfIframeSx);
    const hasMetadata = Boolean(item.mediaSource || item.mediaCaption);
    const hasSmallScreenInfoBlurb = Boolean(smallScreenInfoBlurb?.trim());
    const compactMetadata =
      compactMetadataOnSmallScreens && (hasMetadata || hasSmallScreenInfoBlurb);
    const inlineMetadataDisplay = compactMetadata
      ? { xs: "none", md: "block" }
      : "block";
    const resolvedMarkdownContent =
      item.mediaType === "markdown"
        ? (item.markdownContent ??
          markdownByKey[item.key] ??
          item.mediaUrl ??
          "") as string
        : "";
    const pdfUrl = item.mediaUrl;

    return (
      <Box
        key={item.key}
        ref={item.panelRef}
        sx={[
          {
            minWidth: 0,
            width: "100%",
            maxWidth: "100%",
          },
          ...panelSxArray,
        ]}
      >
        {hasTitle || item.description || compactMetadata ? (
          <Box sx={{ mb: 1.25 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: hasTitle ? "space-between" : "flex-end",
                gap: 1,
              }}
            >
              {hasTitle ? (
                <Box
                  sx={{
                    minWidth: 0,
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {item.titleIcon ? (
                    <Box
                      aria-label={item.titleIconAriaLabel}
                      sx={[
                        (theme) => ({
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          border: "1px solid",
                          borderColor:
                            theme.palette.mode === "dark"
                              ? alpha(theme.palette.common.white, 0.28)
                              : alpha(theme.palette.common.black, 0.26),
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? alpha(theme.palette.background.paper, 0.54)
                              : alpha(theme.palette.background.paper, 0.9),
                          color:
                            theme.palette.mode === "dark"
                              ? theme.palette.grey[100]
                              : theme.palette.grey[900],
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }),
                        ...titleIconSxArray,
                      ]}
                    >
                      {item.titleIcon}
                    </Box>
                  ) : null}
                  <Typography
                    variant={item.titleVariant ?? "subtitle2"}
                    sx={[{ minWidth: 0, flex: 1 }, ...titleSxArray]}
                  >
                    {item.title}
                  </Typography>
                </Box>
              ) : null}
              {compactMetadata && showCompactInfoButton ? (
                <IconButton
                  size="small"
                  aria-label={`Open media details: ${lightboxTitle}`}
                  onClick={() => setMetadataDialogItemKey(item.key)}
                  sx={(theme) => ({
                    display: { xs: "inline-flex", md: "none" },
                    flexShrink: 0,
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
                  <InfoOutlined fontSize="small" />
                </IconButton>
              ) : null}
            </Box>
            {item.description ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                {item.description}
              </Typography>
            ) : null}
          </Box>
        ) : null}

        <Box
          sx={[
            {
              width: "100%",
              maxWidth: "100%",
              position: "relative",
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
                      item.lightboxCaption ||
                      item.mediaCaption ||
                      item.mediaSource
                    }
                    stopEventPropagation
                    triggerSx={{
                      all: "unset",
                      display: "inline-flex",
                      cursor: "zoom-in",
                    }}
                  >
                    <Box
                      component="span"
                      sx={[
                        (theme) => ({
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          border: "1px solid",
                          borderColor: alpha(theme.palette.common.white, 0.32),
                          color: theme.palette.common.white,
                          bgcolor: alpha(theme.palette.grey[900], 0.58),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.grey[900], 0.76),
                          },
                        }),
                        ...expandControlSxArray,
                      ]}
                    >
                      <OpenInFull fontSize="small" />
                    </Box>
                  </ImageLightbox>
                </Box>
              ) : null}
            </Box>
          ) : item.mediaType === "video" ? (
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
                expandButtonSx={expandControlSx}
                previewVideoClassName={item.previewVideoClassName}
                previewVideoSx={previewVideoSxArray}
                onLoadedData={item.onMediaLoaded}
                {...item.videoProps}
              />
            </Box>
          ) : item.mediaType === "pdf" ? (
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
                alignItems: "stretch",
                justifyContent: "center",
                cursor: canActivate ? "pointer" : "default",
              }}
            >
              <PDFContent
                src={pdfUrl}
                title={lightboxTitle}
                onLoad={item.onMediaLoaded}
                previewSx={[{ height: "100%" }, ...pdfPreviewSxArray]}
                containerSx={pdfContainerSxArray}
                frameSx={pdfFrameSxArray}
                objectSx={pdfObjectSxArray}
                iframeSx={pdfIframeSxArray}
                showOpenLink={item.pdfShowOpenLink ?? false}
                openLinkLabel={item.pdfOpenLinkLabel}
                openLinkHref={item.pdfOpenLinkHref}
                openLinkDescription={item.pdfOpenLinkDescription}
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
                  <Box
                    component="a"
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open full document: ${lightboxTitle}`}
                    onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                      event.stopPropagation();
                    }}
                    sx={[
                      {
                        all: "unset",
                        display: "inline-flex",
                        cursor: "pointer",
                      },
                    ]}
                  >
                    <Box
                      component="span"
                      sx={[
                        (theme) => ({
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          border: "1px solid",
                          borderColor: alpha(theme.palette.common.white, 0.32),
                          color: theme.palette.common.white,
                          bgcolor: alpha(theme.palette.grey[900], 0.58),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.grey[900], 0.76),
                          },
                        }),
                        ...expandControlSxArray,
                      ]}
                    >
                      <OpenInFull fontSize="small" />
                    </Box>
                  </Box>
                </Box>
              ) : null}
            </Box>
          ) : item.mediaType === "diagram" ? (
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
                minHeight: 0,
                cursor: canActivate ? "pointer" : "default",
              }}
            >
              <Box
                sx={[
                  {
                    width: "100%",
                    height: "100%",
                    minHeight: 0,
                    overflow: "hidden",
                    "& [id$='-container']": {
                      width: "100% !important",
                      height: "100% !important",
                      minHeight: 0,
                    },
                    "& .mermaid svg": {
                      maxWidth: "100%",
                      height: "auto",
                    },
                  },
                  ...diagramSxArray,
                ]}
              >
                <Diagram
                  diagram={item.mediaUrl}
                  title={item.diagramProps?.title ?? item.title}
                  type={item.diagramProps?.type}
                  orientation={item.diagramProps?.orientation}
                  syntax={item.diagramProps?.syntax}
                  steps={item.diagramProps?.steps}
                  height={item.diagramProps?.height ?? "100%"}
                  width={item.diagramProps?.width ?? "100%"}
                  showToolbar={item.diagramProps?.showToolbar ?? true}
                  showDots={item.diagramProps?.showDots ?? false}
                />
              </Box>
            </Box>
          ) : item.mediaType === "custom" ||
            item.mediaType === "project" ||
            item.mediaType === "projectPresentation" ||
            item.mediaType === "recognition" ||
            item.mediaType === "recommendation" ? (
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
                minHeight: 0,
                cursor: canActivate ? "pointer" : "default",
              }}
            >
              <Box
                sx={[
                  {
                    width: "100%",
                    height: "100%",
                    minHeight: 0,
                  },
                  ...customContentSxArray,
                ]}
              >
                {item.customContent}
              </Box>
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
                minHeight: 0,
                cursor: canActivate ? "pointer" : "default",
              }}
            >
              <Box
                sx={(theme) => ({
                  width: "100%",
                  height: "100%",
                  minHeight: 0,
                  overflow: "auto",
                  borderRadius: "18px",
                  border: "1px solid",
                  borderColor: "var(--fabric-surface-border)",
                  bgcolor:
                    theme.palette.mode === "light"
                      ? alpha(theme.palette.common.white, 0.7)
                      : "rgba(15,23,42,0.35)",
                  p: 2,
                })}
              >
                <MarkdownContent
                  content={resolvedMarkdownContent}
                  variant="body2"
                  sx={[
                    { "& p": { mb: 1.1 } },
                    ...markdownSxArray,
                  ]}
                />
              </Box>
            </Box>
          )}
          {navigationOverlay}
        </Box>

        {renderSource(item.mediaSource, item.mediaSourceHref) ? (
          <Box sx={{ display: inlineMetadataDisplay }}>
            {renderSource(item.mediaSource, item.mediaSourceHref)}
          </Box>
        ) : null}
        {item.mediaCaption ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: item.mediaSource ? 0.75 : 1.5,
              display: inlineMetadataDisplay,
            }}
          >
            {item.mediaCaption}
          </Typography>
        ) : null}
        {item.extraContent}
      </Box>
    );
  };

  const singlePanelNavigationOverlay =
    showChevronNavigation && renderedItem ? (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 3,
        }}
      >
        {!previousDisabled && (
          <IconButton
            type="button"
            aria-label="Previous media panel"
            onClick={handleChevronPrevious}
            disabled={previousDisabled}
            sx={[
              (theme) => ({
                position: "absolute",
                left: { xs: 6, md: 8 },
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "auto",
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
              }),
              ...navigationControlSxArray,
            ]}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}
        {showLoopAction ? (
          <IconButton
            type="button"
            aria-label={loopNavigationLabel}
            onClick={handleLoopNavigation}
            disabled={loopDisabled}
            sx={[
              (theme) => ({
                position: "absolute",
                right: { xs: 6, md: 8 },
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "auto",
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
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(2,6,23,0.84)"
                      : alpha(theme.palette.background.paper, 0.96),
                },
              }),
              ...navigationControlSxArray,
            ]}
          >
            {loopNavigationIcon === "leftChevron" ? (
              <ChevronLeft fontSize="small" />
            ) : loopNavigationIcon === "rightChevron" ? (
              <ChevronRight fontSize="small" />
            ) : (
              <Loop fontSize="small" />
            )}
          </IconButton>
        ) : !hideNextChevron ? (
          <IconButton
            type="button"
            aria-label="Next media panel"
            onClick={handleChevronNext}
            disabled={nextDisabled}
            sx={[
              (theme) => ({
                position: "absolute",
                right: { xs: 6, md: 8 },
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "auto",
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
              }),
              ...navigationControlSxArray,
            ]}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        ) : null}
      </Box>
    ) : null;

  if (singlePanel) {
    return (
      <>
        <Stack
          spacing={spacing}
          sx={[
            {
              minWidth: 0,
              width: "100%",
              maxWidth: "100%",
            },
            ...stackSxArray,
          ]}
        >
          <Box sx={{ position: "relative", height: "100%", minHeight: 0 }}>
            {renderedItem ? (
              <Box
                key={renderedItem.key}
                sx={{
                  height: "100%",
                  minHeight: 0,
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
                {renderItem(renderedItem, singlePanelNavigationOverlay)}
              </Box>
            ) : null}
          </Box>
        </Stack>
        <Dialog
          open={Boolean(metadataDialogItem)}
          onClose={() => setMetadataDialogItemKey(null)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle sx={{ pr: 6 }}>
            {metadataDialogItem?.mediaLightboxTitle ||
              metadataDialogItem?.title ||
              "Media details"}
            <IconButton
              aria-label="Close media details"
              onClick={() => setMetadataDialogItemKey(null)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {smallScreenInfoBlurb?.trim() ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb:
                    metadataDialogItem?.mediaSource ||
                    metadataDialogItem?.mediaCaption
                      ? 1.25
                      : 0,
                }}
              >
                {smallScreenInfoBlurb}
              </Typography>
            ) : null}
            {metadataDialogItem?.mediaSource ? (
              <Typography variant="body2" color="text.secondary">
                Source:{" "}
                {metadataDialogItem.mediaSourceHref ? (
                  <Link
                    href={metadataDialogItem.mediaSourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    color="primary.main"
                  >
                    {metadataDialogItem.mediaSource}
                  </Link>
                ) : (
                  metadataDialogItem.mediaSource
                )}
              </Typography>
            ) : null}
            {metadataDialogItem?.mediaCaption ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: metadataDialogItem.mediaSource ? 1.25 : 0 }}
              >
                {metadataDialogItem.mediaCaption}
              </Typography>
            ) : null}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Stack
        spacing={spacing}
        sx={[
          {
            minWidth: 0,
            width: "100%",
            maxWidth: "100%",
          },
          ...stackSxArray,
        ]}
      >
        {items.map((item) => renderItem(item))}
      </Stack>
      <Dialog
        open={Boolean(metadataDialogItem)}
        onClose={() => setMetadataDialogItemKey(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pr: 6 }}>
          {metadataDialogItem?.mediaLightboxTitle ||
            metadataDialogItem?.title ||
            "Media details"}
          <IconButton
            aria-label="Close media details"
            onClick={() => setMetadataDialogItemKey(null)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {smallScreenInfoBlurb?.trim() ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb:
                  metadataDialogItem?.mediaSource || metadataDialogItem?.mediaCaption
                    ? 1.25
                    : 0,
              }}
            >
              {smallScreenInfoBlurb}
            </Typography>
          ) : null}
          {metadataDialogItem?.mediaSource ? (
            <Typography variant="body2" color="text.secondary">
              Source:{" "}
              {metadataDialogItem.mediaSourceHref ? (
                <Link
                  href={metadataDialogItem.mediaSourceHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  color="primary.main"
                >
                  {metadataDialogItem.mediaSource}
                </Link>
              ) : (
                metadataDialogItem.mediaSource
              )}
            </Typography>
          ) : null}
          {metadataDialogItem?.mediaCaption ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: metadataDialogItem.mediaSource ? 1.25 : 0 }}
            >
              {metadataDialogItem.mediaCaption}
            </Typography>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
