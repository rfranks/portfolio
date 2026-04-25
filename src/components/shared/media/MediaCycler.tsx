"use client";

import * as React from "react";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Loop from "@mui/icons-material/Loop";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { alpha } from "@mui/material/styles";
import type { MediaCyclerItem } from "@/types/media/mediaCycler";
import type { MediaCyclerProps } from "@/types/components/shared/media";
import { VISUALIZATION_ANIMATION_TOKENS } from "@/consts/visualization/tokens";
import { useMediaCyclerController } from "@/hooks/media/useMediaCyclerController";
import { useMediaCyclerNavigation } from "@/hooks/media/useMediaCyclerNavigation";
import { useMediaCyclerPrefetch } from "@/hooks/media/useMediaCyclerPrefetch";
import { useMediaCyclerTelemetry } from "@/hooks/media/useMediaCyclerTelemetry";
import { flattenMediaCyclerSxArray, toMediaCyclerSxArray } from "@/utils/media/mediaCyclerSx";
import MediaCyclerItemRenderer from "./media-cycler/MediaCyclerItemRenderer";
import MediaMetadataShell from "./media-cycler/MediaMetadataShell";
import MediaRenderShell from "./media-cycler/MediaRenderShell";

export type { MediaCyclerItem } from "@/types/media/mediaCycler";

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
    previousItem,
    nextItem,
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

  const {
    emitMediaTelemetry,
    openMetadataDialog,
    closeMetadataDialog,
    handleRendererFirstRenderReady,
    emitRendererMediaAction,
  } = useMediaCyclerTelemetry({
    renderedItem,
    metadataDialogItem,
    setMetadataDialogItemKey,
  });

  const {
    prefetchItemMediaByIntent,
    handleSinglePanelPointerMove,
    handleSinglePanelPointerEnter,
    handleSinglePanelFocusCapture,
  } = useMediaCyclerPrefetch({
    items,
    renderedItem,
    previousItem,
    nextItem,
  });

  const { navigatePrevious, navigateNext, navigateLoop, handleSinglePanelKeyDown } =
    useMediaCyclerNavigation({
      singlePanel,
      renderedItem,
      handleChevronPrevious,
      handleChevronNext,
      handleLoopNavigation,
      emitMediaTelemetry,
    });

  const renderCyclerItem = React.useCallback(
    (item: MediaCyclerItem, navigationOverlay?: React.ReactNode) => (
      <MediaCyclerItemRenderer
        key={item.key}
        item={item}
        items={items}
        loopNavigation={loopNavigation}
        markdownByKey={markdownByKey}
        smallScreenInfoBlurb={smallScreenInfoBlurb}
        compactMetadataOnSmallScreens={compactMetadataOnSmallScreens}
        showCompactInfoButton={showCompactInfoButton}
        showExpandIcon={showExpandIcon}
        expandControlSx={expandControlSx}
        expandControlSxArray={expandControlSxArray}
        navigationOverlay={navigationOverlay}
        prefetchItemMediaByIntent={prefetchItemMediaByIntent}
        openMetadataDialog={openMetadataDialog}
        handleRendererFirstRenderReady={handleRendererFirstRenderReady}
        emitRendererMediaAction={emitRendererMediaAction}
      />
    ),
    [
      compactMetadataOnSmallScreens,
      emitRendererMediaAction,
      expandControlSx,
      expandControlSxArray,
      handleRendererFirstRenderReady,
      items,
      loopNavigation,
      markdownByKey,
      openMetadataDialog,
      prefetchItemMediaByIntent,
      showCompactInfoButton,
      showExpandIcon,
      smallScreenInfoBlurb,
    ],
  );

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
        {!previousDisabled ? (
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
        ) : null}

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
        onPointerMove={handleSinglePanelPointerMove}
        onMouseEnter={handleSinglePanelPointerEnter}
        onFocusCapture={handleSinglePanelFocusCapture}
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
              {renderCyclerItem(renderedItem, singlePanelNavigationOverlay)}
            </Box>
          ) : null
        }
        multiPanelItems={items.map((item) => renderCyclerItem(item))}
      />

      <MediaMetadataShell
        item={metadataDialogItem}
        smallScreenInfoBlurb={smallScreenInfoBlurb}
        onClose={closeMetadataDialog}
      />
    </>
  );
}
