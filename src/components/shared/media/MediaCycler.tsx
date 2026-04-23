"use client";

import * as React from "react";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Loop from "@mui/icons-material/Loop";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import MarkdownContent from "../content/MarkdownContent";
import type { MediaCyclerItem, MediaCyclerMediaType } from "@/types/media/mediaCycler";
import type { MediaCyclerProps } from "@/types/components/shared/media";
import { useMediaCyclerController } from "@/hooks/media/useMediaCyclerController";
import { flattenMediaCyclerSxArray, toMediaCyclerSxArray } from "@/utils/media/mediaCyclerSx";
import { PORTFOLIO_SHORTCUT_EVENT } from "@/consts/observability/telemetryEvents";
import { addPortfolioWindowEventListener } from "@/utils/observability/telemetryEvents";
import type { PortfolioTelemetryTrigger } from "@/types/observability/telemetryEvents";
import { MEDIA_RENDERER_FALLBACK_SX } from "@/consts/components/shared/mediaCycler";
import { VISUALIZATION_ANIMATION_TOKENS } from "@/consts/visualization/tokens";
import { createMediaActivateKeyDownHandler } from "@/utils/components/shared/media";
import { assertNever, resolveMediaActionContract } from "@/utils/components/shared/mediaCycler";
import MediaMetadataShell from "./media-cycler/MediaMetadataShell";
import MediaRenderShell from "./media-cycler/MediaRenderShell";
import {
  LazyDiagramRenderer,
  LazyImageRenderer,
  LazyPdfRenderer,
  LazyVideoRenderer,
  prefetchMediaTypeByIntent,
  resolveSectionPrefetchOrder,
} from "./media-cycler/rendererRegistry";
import { emitMediaActionTelemetry } from "@/utils/media/mediaActionTelemetry";
export type { MediaCyclerItem } from "@/types/media/mediaCycler";

const renderSource = (label?: string, href?: string) => {
  if (!label) {
    return null;
  }

  return (
    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
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
  allowSwipe = false,
}: MediaCyclerProps) {
  const stackSxArray = toMediaCyclerSxArray(stackSx);
  const stackFlatSxArray = flattenMediaCyclerSxArray(stackSxArray);
  const navigationControlSxArray = toMediaCyclerSxArray(navigationControlSx);
  const navigationControlFlatSxArray = flattenMediaCyclerSxArray(navigationControlSxArray);
  const expandControlSxArray = toMediaCyclerSxArray(expandControlSx);
  const {
    renderedItem,
    isVisible,
    transitionDirection,
    metadataDialogItem,
    setMetadataDialogItemKey,
    markdownByKey,
    previousDisabled,
    nextDisabled,
    showLoopAction,
    loopDisabled,
    hideNextChevron,
    handleChevronPrevious,
    handleChevronNext,
    handleLoopNavigation,
    handleSwipeStart,
    handleSwipeMove,
    handleSwipeEnd,
    handleSwipeCancel,
  } = useMediaCyclerController({
    items,
    singlePanel,
    singlePanelActiveKey,
    disableTransition,
    transitionMs,
    loopNavigation,
    loopFromBeginning,
    disableChevronPrevious,
    disableChevronNext,
    hideDisabledNextChevron,
    disableLoopNavigation,
    onChevronPrevious,
    onChevronNext,
    onLoopNavigation,
    allowSwipe,
  });

  const emitMediaTelemetry = React.useCallback(
    (
      kind:
        | "navigate.previous"
        | "navigate.next"
        | "navigate.loop"
        | "details.open"
        | "details.close",
      trigger: PortfolioTelemetryTrigger,
      item: MediaCyclerItem | null | undefined,
      control?: string,
    ) => {
      emitMediaActionTelemetry(
        resolveMediaActionContract({
          kind,
          trigger,
          control,
          itemKey: item?.key,
          mediaType: item?.mediaType,
          title: item?.title,
          source: item?.mediaSource,
        }),
      );
    },
    [],
  );

  const navigatePrevious = React.useCallback(
    (trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("navigate.previous", trigger, renderedItem, control);
      handleChevronPrevious();
    },
    [emitMediaTelemetry, handleChevronPrevious, renderedItem],
  );

  const navigateNext = React.useCallback(
    (trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("navigate.next", trigger, renderedItem, control);
      handleChevronNext();
    },
    [emitMediaTelemetry, handleChevronNext, renderedItem],
  );

  const navigateLoop = React.useCallback(
    (trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("navigate.loop", trigger, renderedItem, control);
      handleLoopNavigation();
    },
    [emitMediaTelemetry, handleLoopNavigation, renderedItem],
  );

  const openMetadataDialog = React.useCallback(
    (item: MediaCyclerItem, trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("details.open", trigger, item, control);
      setMetadataDialogItemKey(item.key);
    },
    [emitMediaTelemetry, setMetadataDialogItemKey],
  );

  const closeMetadataDialog = React.useCallback(
    (trigger: PortfolioTelemetryTrigger, control?: string) => {
      emitMediaTelemetry("details.close", trigger, metadataDialogItem, control);
      setMetadataDialogItemKey(null);
    },
    [emitMediaTelemetry, metadataDialogItem, setMetadataDialogItemKey],
  );

  const prefetchMediaType = React.useCallback((mediaType: MediaCyclerMediaType) => {
    prefetchMediaTypeByIntent(mediaType);
  }, []);

  const prefetchItemMediaByIntent = React.useCallback(
    (item: MediaCyclerItem) => {
      prefetchMediaType(item.mediaType);
    },
    [prefetchMediaType],
  );

  React.useEffect(() => {
    if (!items.length || typeof window === "undefined") {
      return;
    }

    const mediaTypes = new Set(items.map((item) => item.mediaType));
    const prefetch = () => {
      const sectionPrefetchOrder = resolveSectionPrefetchOrder();
      sectionPrefetchOrder.forEach((mediaType) => {
        if (mediaTypes.has(mediaType)) {
          prefetchMediaType(mediaType);
        }
      });

      mediaTypes.forEach((mediaType) => {
        if (!sectionPrefetchOrder.includes(mediaType)) {
          prefetchMediaType(mediaType);
        }
      });
    };

    if ("requestIdleCallback" in globalThis) {
      const idleId = globalThis.requestIdleCallback(prefetch, { timeout: 800 });
      return () => globalThis.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetch, 120);
    return () => globalThis.clearTimeout(timeoutId);
  }, [items, prefetchMediaType]);

  React.useEffect(() => {
    if (!renderedItem) {
      return;
    }

    prefetchItemMediaByIntent(renderedItem);
  }, [prefetchItemMediaByIntent, renderedItem]);

  React.useEffect(() => {
    if (!singlePanel) {
      return;
    }

    const removePreviousShortcut = addPortfolioWindowEventListener(
      PORTFOLIO_SHORTCUT_EVENT.MEDIA_PREV,
      () => navigatePrevious("keyboard-shortcut", "media-prev-shortcut"),
    );
    const removeNextShortcut = addPortfolioWindowEventListener(
      PORTFOLIO_SHORTCUT_EVENT.MEDIA_NEXT,
      () => navigateNext("keyboard-shortcut", "media-next-shortcut"),
    );
    const removeLoopShortcut = addPortfolioWindowEventListener(
      PORTFOLIO_SHORTCUT_EVENT.MEDIA_LOOP,
      () => navigateLoop("keyboard-shortcut", "media-loop-shortcut"),
    );

    return () => {
      removePreviousShortcut();
      removeNextShortcut();
      removeLoopShortcut();
    };
  }, [navigateLoop, navigateNext, navigatePrevious, singlePanel]);

  const handleSinglePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigatePrevious("keyboard", "ArrowLeft");
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateNext("keyboard", "ArrowRight");
      return;
    }

    if (event.key.toLowerCase() === "l") {
      event.preventDefault();
      navigateLoop("keyboard", "l");
    }
  };

  const renderItem = (item: MediaCyclerItem, navigationOverlay?: React.ReactNode) => {
    const mediaType = item.mediaType;
    const isDiagramItem = mediaType === "diagram";
    const canActivate = Boolean(item.onMediaActivate);
    const hasTitle = item.title.trim().length > 0;
    const imageAlt = item.mediaAlt || item.title;
    const lightboxTitle = item.mediaLightboxTitle || item.title;
    const panelSxArray = toMediaCyclerSxArray(item.panelSx);
    const panelFlatSxArray = flattenMediaCyclerSxArray(panelSxArray);
    const titleIconSxArray = toMediaCyclerSxArray(item.titleIconSx);
    const titleIconFlatSxArray = flattenMediaCyclerSxArray(titleIconSxArray);
    const titleSxArray = toMediaCyclerSxArray(item.titleSx);
    const titleFlatSxArray = flattenMediaCyclerSxArray(titleSxArray);
    const assetFrameSxArray = toMediaCyclerSxArray(item.assetFrameSx);
    const assetFrameFlatSxArray = flattenMediaCyclerSxArray(assetFrameSxArray);
    const previewVideoSxArray = toMediaCyclerSxArray(item.previewVideoSx);
    const markdownSxArray = toMediaCyclerSxArray(item.markdownSx);
    const markdownFlatSxArray = flattenMediaCyclerSxArray(markdownSxArray);
    const diagramSxArray = toMediaCyclerSxArray(item.diagramSx);
    const customContentSxArray = toMediaCyclerSxArray(item.customContentSx);
    const customContentFlatSxArray = flattenMediaCyclerSxArray(customContentSxArray);
    const pdfContainerSxArray = toMediaCyclerSxArray(item.pdfContainerSx);
    const pdfFrameSxArray = toMediaCyclerSxArray(item.pdfFrameSx);
    const pdfPreviewSxArray = toMediaCyclerSxArray(item.pdfPreviewSx);
    const pdfObjectSxArray = toMediaCyclerSxArray(item.pdfObjectSx);
    const pdfIframeSxArray = toMediaCyclerSxArray(item.pdfIframeSx);
    const hasMetadata = Boolean(item.mediaSource || item.mediaCaption);
    const hasSmallScreenInfoBlurb = Boolean(smallScreenInfoBlurb?.trim());
    const compactMetadata =
      compactMetadataOnSmallScreens && (hasMetadata || hasSmallScreenInfoBlurb);
    const inlineMetadataDisplay = compactMetadata ? { xs: "none", md: "block" } : "block";
    const resolvedMarkdownContent =
      mediaType === "markdown"
        ? (item.markdownContent ?? markdownByKey[item.key] ?? item.mediaUrl ?? "")
        : "";
    const itemIndex = items.findIndex((cycleItem) => cycleItem.key === item.key);
    const emitRendererMediaAction = (
      kind: "open" | "copy" | "export" | "zoom",
      trigger: PortfolioTelemetryTrigger,
      control?: string,
      metaAction?: string,
    ) => {
      emitMediaActionTelemetry(
        resolveMediaActionContract({
          kind,
          trigger,
          control,
          metaAction,
          itemKey: item.key,
          mediaType: item.mediaType,
          title: item.title,
          source: item.mediaSource,
        }),
      );
    };
    const previousDiagramItem = (() => {
      if (!isDiagramItem || itemIndex < 0) {
        return null;
      }

      for (let index = itemIndex - 1; index >= 0; index -= 1) {
        const candidate = items[index];
        if (candidate.mediaType === "diagram") {
          return candidate;
        }
      }

      if (loopNavigation) {
        for (let index = items.length - 1; index > itemIndex; index -= 1) {
          const candidate = items[index];
          if (candidate.mediaType === "diagram") {
            return candidate;
          }
        }
      }

      return null;
    })();
    const nextDiagramItem = (() => {
      if (!isDiagramItem || itemIndex < 0) {
        return null;
      }

      for (let index = itemIndex + 1; index < items.length; index += 1) {
        const candidate = items[index];
        if (candidate.mediaType === "diagram") {
          return candidate;
        }
      }

      if (loopNavigation) {
        for (let index = 0; index < itemIndex; index += 1) {
          const candidate = items[index];
          if (candidate.mediaType === "diagram") {
            return candidate;
          }
        }
      }

      return null;
    })();
    const canGoBackToPreviousDiagram = Boolean(previousDiagramItem?.onSelect);
    const canAdvanceToNextDiagram = Boolean(nextDiagramItem?.onSelect);

    return (
      <Box
        key={item.key}
        ref={item.panelRef}
        onPointerEnter={() => prefetchItemMediaByIntent(item)}
        onFocusCapture={() => prefetchItemMediaByIntent(item)}
        onTouchStart={() => prefetchItemMediaByIntent(item)}
        sx={[
          {
            minWidth: 0,
            width: "100%",
            maxWidth: "100%",
          },
          ...panelFlatSxArray,
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
                        ...titleIconFlatSxArray,
                      ]}
                    >
                      {item.titleIcon}
                    </Box>
                  ) : null}
                  <Typography
                    variant={item.titleVariant ?? "subtitle2"}
                    sx={[{ minWidth: 0, flex: 1 }, ...titleFlatSxArray]}
                  >
                    {item.title}
                  </Typography>
                </Box>
              ) : null}
              {compactMetadata && showCompactInfoButton ? (
                <IconButton
                  size="small"
                  aria-label={`Open media details: ${lightboxTitle}`}
                  onClick={() => openMetadataDialog(item, "pointer", "open-media-details")}
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
            ...assetFrameFlatSxArray,
          ]}
        >
          {(() => {
            const renderCustom = () => (
              <Box
                role={canActivate ? "button" : undefined}
                tabIndex={canActivate ? 0 : -1}
                aria-label={canActivate ? `Activate ${item.title}` : undefined}
                onClick={item.onMediaActivate}
                onKeyDown={createMediaActivateKeyDownHandler(item.onMediaActivate)}
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
                    ...customContentFlatSxArray,
                  ]}
                >
                  {item.customContent}
                </Box>
              </Box>
            );

            const renderMarkdown = () => (
              <Box
                role={canActivate ? "button" : undefined}
                tabIndex={canActivate ? 0 : -1}
                aria-label={canActivate ? `Activate ${item.title}` : undefined}
                onClick={item.onMediaActivate}
                onKeyDown={createMediaActivateKeyDownHandler(item.onMediaActivate)}
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
                    borderRadius: { xs: 0, sm: 0, md: "18px" },
                    border: { xs: 0, sm: 0, md: "1px solid" },
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
                    sx={[{ "& p": { mb: 1.1 } }, ...markdownFlatSxArray]}
                  />
                </Box>
              </Box>
            );

            const renderMedia = () => {
              switch (item.mediaType) {
                case "image":
                  return (
                    <LazyImageRenderer
                      item={item}
                      mediaUrl={item.mediaUrl}
                      imageAlt={imageAlt}
                      lightboxTitle={lightboxTitle}
                      showExpandIcon={showExpandIcon}
                      expandControlSxArray={expandControlSxArray}
                      onMediaAction={({ kind, trigger, control, metaAction }) => {
                        if (
                          kind === "open" ||
                          kind === "copy" ||
                          kind === "export" ||
                          kind === "zoom"
                        ) {
                          emitRendererMediaAction(kind, trigger, control, metaAction);
                        }
                      }}
                    />
                  );
                case "video":
                  return (
                    <LazyVideoRenderer
                      item={item}
                      mediaUrl={item.mediaUrl}
                      lightboxTitle={lightboxTitle}
                      canActivate={canActivate}
                      showExpandIcon={showExpandIcon}
                      expandControlSx={expandControlSx}
                      previewVideoSxArray={previewVideoSxArray}
                      onMediaAction={({ kind, trigger, control, metaAction }) => {
                        if (
                          kind === "open" ||
                          kind === "copy" ||
                          kind === "export" ||
                          kind === "zoom"
                        ) {
                          emitRendererMediaAction(kind, trigger, control, metaAction);
                        }
                      }}
                    />
                  );
                case "pdf":
                  return (
                    <LazyPdfRenderer
                      item={item}
                      pdfUrl={item.mediaUrl}
                      lightboxTitle={lightboxTitle}
                      canActivate={canActivate}
                      showExpandIcon={showExpandIcon}
                      expandControlSxArray={expandControlSxArray}
                      pdfPreviewSxArray={pdfPreviewSxArray}
                      pdfContainerSxArray={pdfContainerSxArray}
                      pdfFrameSxArray={pdfFrameSxArray}
                      pdfObjectSxArray={pdfObjectSxArray}
                      pdfIframeSxArray={pdfIframeSxArray}
                      onMediaAction={({ kind, trigger, control, metaAction }) => {
                        if (
                          kind === "open" ||
                          kind === "copy" ||
                          kind === "export" ||
                          kind === "zoom"
                        ) {
                          emitRendererMediaAction(kind, trigger, control, metaAction);
                        }
                      }}
                    />
                  );
                case "diagram":
                  return (
                    <LazyDiagramRenderer
                      item={item}
                      mediaUrl={item.mediaUrl}
                      canActivate={canActivate}
                      showExpandIcon={showExpandIcon}
                      expandControlSx={expandControlSx}
                      diagramSxArray={diagramSxArray}
                      onMediaAction={({ kind, trigger, control, metaAction }) => {
                        if (
                          kind === "open" ||
                          kind === "copy" ||
                          kind === "export" ||
                          kind === "zoom"
                        ) {
                          emitRendererMediaAction(kind, trigger, control, metaAction);
                        }
                      }}
                    />
                  );
                case "markdown":
                  return renderMarkdown();
                case "custom":
                case "project":
                case "projectPresentation":
                case "recognition":
                case "recommendation":
                  return renderCustom();
                default:
                  return assertNever(item);
              }
            };
            return (
              <React.Suspense fallback={<Box sx={MEDIA_RENDERER_FALLBACK_SX} />}>
                {renderMedia()}
              </React.Suspense>
            );
          })()}
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
        {isDiagramItem ? (
          <Box
            sx={{
              mt: 0.85,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Link
              component="button"
              type="button"
              underline="hover"
              color={canGoBackToPreviousDiagram ? "primary.main" : "text.disabled"}
              aria-disabled={!canGoBackToPreviousDiagram}
              tabIndex={canGoBackToPreviousDiagram ? 0 : -1}
              onClick={() => {
                if (!canGoBackToPreviousDiagram) {
                  return;
                }
                previousDiagramItem?.onSelect?.();
              }}
              sx={{
                p: 0,
                border: 0,
                background: "none",
                fontSize: "0.84rem",
                lineHeight: 1.2,
                fontWeight: 700,
                cursor: canGoBackToPreviousDiagram ? "pointer" : "default",
                pointerEvents: canGoBackToPreviousDiagram ? "auto" : "none",
              }}
            >
              {"<"} Back
            </Link>
            <Link
              component="button"
              type="button"
              underline="hover"
              color={canAdvanceToNextDiagram ? "primary.main" : "text.disabled"}
              aria-disabled={!canAdvanceToNextDiagram}
              tabIndex={canAdvanceToNextDiagram ? 0 : -1}
              onClick={() => {
                if (!canAdvanceToNextDiagram) {
                  return;
                }
                nextDiagramItem?.onSelect?.();
              }}
              sx={{
                p: 0,
                border: 0,
                background: "none",
                fontSize: "0.84rem",
                lineHeight: 1.2,
                fontWeight: 700,
                cursor: canAdvanceToNextDiagram ? "pointer" : "default",
                pointerEvents: canAdvanceToNextDiagram ? "auto" : "none",
              }}
            >
              Next {">"}
            </Link>
          </Box>
        ) : null}
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
            onClick={() => navigatePrevious("pointer", "Previous media panel")}
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
                  theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(2,6,23,0.65)"
                    : alpha(theme.palette.background.paper, 0.82),
              }),
              ...navigationControlFlatSxArray,
            ]}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}
        {showLoopAction ? (
          <IconButton
            type="button"
            aria-label={loopNavigationLabel}
            onClick={() => navigateLoop("pointer", loopNavigationLabel)}
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
                  theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
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
              ...navigationControlFlatSxArray,
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
            onClick={() => navigateNext("pointer", "Next media panel")}
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
                  theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(2,6,23,0.65)"
                    : alpha(theme.palette.background.paper, 0.82),
              }),
              ...navigationControlFlatSxArray,
            ]}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        ) : null}
      </Box>
    ) : null;

  return (
    <>
      <MediaRenderShell
        spacing={spacing}
        stackFlatSxArray={stackFlatSxArray}
        singlePanel={singlePanel}
        onKeyDown={handleSinglePanelKeyDown}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
        onTouchCancel={handleSwipeCancel}
        singlePanelItem={
          renderedItem ? (
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
                      ? `translateX(${VISUALIZATION_ANIMATION_TOKENS.mediaTransitionTranslatePx}px)`
                      : `translateX(-${VISUALIZATION_ANIMATION_TOKENS.mediaTransitionTranslatePx}px)`,
                transition: disableTransition
                  ? "none"
                  : `opacity ${transitionMs}ms ease, transform ${transitionMs}ms cubic-bezier(.2,.8,.2,1)`,
              }}
            >
              {renderItem(renderedItem, singlePanelNavigationOverlay)}
            </Box>
          ) : null
        }
        multiPanelItems={items.map((item) => renderItem(item))}
      />
      <MediaMetadataShell
        item={metadataDialogItem}
        smallScreenInfoBlurb={smallScreenInfoBlurb}
        onClose={closeMetadataDialog}
      />
    </>
  );
}
