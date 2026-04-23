import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import GridView from "@mui/icons-material/GridView";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { keyframes, type SxProps, type Theme } from "@mui/material/styles";
import {
  GRID_CLOUD_STAGGER_REVEAL,
  VIRTUALIZED_LIST_DEFAULT_OVERSCAN,
} from "@/consts/components/shared/gridCloudNavigationSlide";
import { useAudio } from "@/hooks/audio/useAudio";
import type {
  GridCloudNavigationSlideProps,
  VirtualizedPanelListProps,
} from "@/types/components/shared/gridCloudNavigationSlide";
import { rewindAndPlayAudio } from "@/utils/audio";
import {
  buildStaggerNthRules,
  clampVirtualizedIndex,
  mergeSx,
} from "@/utils/components/shared/gridCloudNavigationSlide";

export function VirtualizedPanelList<TItem>({
  items,
  renderItem,
  itemKey,
  estimateItemHeight = 108,
  overscan = VIRTUALIZED_LIST_DEFAULT_OVERSCAN,
  virtualizationEnabled = true,
  sx,
  contentSx,
}: VirtualizedPanelListProps<TItem>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const safeEstimateHeight = Math.max(56, estimateItemHeight);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const measure = () => {
      setViewportHeight(container.clientHeight);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (scrollTop <= container.scrollHeight - container.clientHeight) {
      return;
    }
    setScrollTop(Math.max(0, container.scrollHeight - container.clientHeight));
  }, [items.length, scrollTop]);

  const visibleRange = useMemo(() => {
    if (!virtualizationEnabled || items.length === 0) {
      return {
        startIndex: 0,
        endIndexExclusive: items.length,
      };
    }

    const computedStart = Math.floor(scrollTop / safeEstimateHeight) - overscan;
    const startIndex = clampVirtualizedIndex(computedStart, 0, Math.max(0, items.length - 1));
    const estimatedVisibleCount = Math.ceil(
      (viewportHeight || safeEstimateHeight) / safeEstimateHeight,
    );
    const computedEnd = startIndex + estimatedVisibleCount + overscan * 2;
    const endIndexExclusive = clampVirtualizedIndex(computedEnd, startIndex + 1, items.length);

    return {
      startIndex,
      endIndexExclusive,
    };
  }, [
    items.length,
    overscan,
    safeEstimateHeight,
    scrollTop,
    viewportHeight,
    virtualizationEnabled,
  ]);

  const leadingSpacerHeight = virtualizationEnabled
    ? visibleRange.startIndex * safeEstimateHeight
    : 0;
  const trailingSpacerHeight = virtualizationEnabled
    ? Math.max(0, (items.length - visibleRange.endIndexExclusive) * safeEstimateHeight)
    : 0;
  const visibleItems = virtualizationEnabled
    ? items.slice(visibleRange.startIndex, visibleRange.endIndexExclusive)
    : items;

  return (
    <Box
      ref={containerRef}
      onScroll={(event) => {
        if (!virtualizationEnabled) {
          return;
        }
        setScrollTop(event.currentTarget.scrollTop);
      }}
      sx={mergeSx(
        {
          minHeight: 0,
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
        },
        sx,
      )}
    >
      <Box sx={contentSx}>
        {virtualizationEnabled ? <Box sx={{ height: leadingSpacerHeight }} aria-hidden /> : null}
        {visibleItems.map((item, index) => {
          const actualIndex = virtualizationEnabled ? visibleRange.startIndex + index : index;
          const key = itemKey ? itemKey(item, actualIndex) : `virtualized-item-${actualIndex}`;
          return (
            <Box key={key} data-grid-cloud-stagger-leaf="true">
              {renderItem(item, actualIndex)}
            </Box>
          );
        })}
        {virtualizationEnabled ? <Box sx={{ height: trailingSpacerHeight }} aria-hidden /> : null}
      </Box>
    </Box>
  );
}

const gridCloudStackedRevealKeyframes = keyframes`
  0% {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
    filter: blur(0.6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
`;

export default function GridCloudNavigationSlide({
  viewMode,
  onViewModeChange,
  listContent,
  cloudContent,
  isMdUp = true,
  footerStart,
  footerEnd,
  showFooterOnMobile = false,
  showViewToggle = true,
  rootSx,
  contentSx,
  footerSx,
  listViewAriaLabel = "Show list view",
  cloudViewAriaLabel = "Show panel view",
  enableStaggeredReveal = true,
  staggerRevealKey,
}: GridCloudNavigationSlideProps) {
  const isCloudView = viewMode === "cloud";
  const shouldRenderViewToggle = showViewToggle && (isMdUp || showFooterOnMobile);
  const shouldRenderFooter = shouldRenderViewToggle || Boolean(footerStart || footerEnd);
  const [staggerActive, setStaggerActive] = useState(false);
  const staggerTargetRef = useRef<HTMLDivElement | null>(null);
  const staggerRevealTimeoutsRef = useRef<number[]>([]);
  const staggerRevealObserverTimeoutRef = useRef<number | null>(null);
  const staggerRevealSfxA = useAudio(GRID_CLOUD_STAGGER_REVEAL.SFX_PATH);
  const staggerRevealSfxB = useAudio(GRID_CLOUD_STAGGER_REVEAL.SFX_PATH);
  const staggerRevealSfxC = useAudio(GRID_CLOUD_STAGGER_REVEAL.SFX_PATH);
  const staggerRevealSfxD = useAudio(GRID_CLOUD_STAGGER_REVEAL.SFX_PATH);
  const staggerRevealSfxPool = useMemo(
    () =>
      [staggerRevealSfxA, staggerRevealSfxB, staggerRevealSfxC, staggerRevealSfxD].slice(
        0,
        GRID_CLOUD_STAGGER_REVEAL.SFX_POOL_SIZE,
      ),
    [staggerRevealSfxA, staggerRevealSfxB, staggerRevealSfxC, staggerRevealSfxD],
  );

  const clearStaggerRevealTimeouts = useCallback(() => {
    if (staggerRevealTimeoutsRef.current.length === 0) {
      return;
    }
    for (const timeoutId of staggerRevealTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    staggerRevealTimeoutsRef.current = [];
  }, []);

  const clearObserverTimeout = useCallback(() => {
    if (staggerRevealObserverTimeoutRef.current == null) {
      return;
    }
    window.clearTimeout(staggerRevealObserverTimeoutRef.current);
    staggerRevealObserverTimeoutRef.current = null;
  }, []);

  const scheduleStaggerRevealAudio = useCallback(() => {
    if (isCloudView || !staggerTargetRef.current) {
      clearStaggerRevealTimeouts();
      return;
    }

    clearStaggerRevealTimeouts();
    const targetNode = staggerTargetRef.current;
    const leafNodes = Array.from(
      targetNode.querySelectorAll("[data-grid-cloud-stagger-leaf='true']"),
    );
    const visibleLeafCount = leafNodes.filter(
      (node) => node instanceof HTMLElement && node.getClientRects().length > 0,
    ).length;
    const visibleRootChildrenCount = Array.from(targetNode.children).filter(
      (node) => node instanceof HTMLElement && node.getClientRects().length > 0,
    ).length;
    const revealCount = visibleLeafCount > 0 ? visibleLeafCount : visibleRootChildrenCount;
    if (revealCount <= 0 || staggerRevealSfxPool.length === 0) {
      return;
    }

    for (let index = 0; index < revealCount; index += 1) {
      const delay =
        GRID_CLOUD_STAGGER_REVEAL.BASE_DELAY_MS + index * GRID_CLOUD_STAGGER_REVEAL.STEP_MS;
      const timeoutId = window.setTimeout(() => {
        const sfxRef = staggerRevealSfxPool[index % staggerRevealSfxPool.length];
        rewindAndPlayAudio(sfxRef, { volume: GRID_CLOUD_STAGGER_REVEAL.SFX_VOLUME });
      }, delay);
      staggerRevealTimeoutsRef.current.push(timeoutId);
    }
  }, [clearStaggerRevealTimeouts, isCloudView, staggerRevealSfxPool]);

  useEffect(() => {
    if (!enableStaggeredReveal) {
      setStaggerActive(false);
      clearStaggerRevealTimeouts();
      clearObserverTimeout();
      return;
    }

    clearStaggerRevealTimeouts();
    clearObserverTimeout();
    setStaggerActive(false);
    const frameId = window.requestAnimationFrame(() => setStaggerActive(true));
    return () => {
      window.cancelAnimationFrame(frameId);
      clearStaggerRevealTimeouts();
      clearObserverTimeout();
    };
  }, [
    clearObserverTimeout,
    clearStaggerRevealTimeouts,
    enableStaggeredReveal,
    viewMode,
    staggerRevealKey,
  ]);

  useEffect(() => {
    if (!enableStaggeredReveal || isCloudView || !staggerActive || !staggerTargetRef.current) {
      clearStaggerRevealTimeouts();
      clearObserverTimeout();
      return;
    }

    scheduleStaggerRevealAudio();

    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(() => {
        clearObserverTimeout();
        staggerRevealObserverTimeoutRef.current = window.setTimeout(() => {
          scheduleStaggerRevealAudio();
          staggerRevealObserverTimeoutRef.current = null;
        }, 24);
      });
      observer.observe(staggerTargetRef.current, {
        subtree: true,
        childList: true,
      });

      return () => {
        observer.disconnect();
        clearObserverTimeout();
        clearStaggerRevealTimeouts();
      };
    }

    return () => {
      clearStaggerRevealTimeouts();
      clearObserverTimeout();
    };
  }, [
    clearObserverTimeout,
    clearStaggerRevealTimeouts,
    enableStaggeredReveal,
    isCloudView,
    scheduleStaggerRevealAudio,
    staggerActive,
  ]);

  const staggerTargetSx: SxProps<Theme> = staggerActive
    ? {
        "& > *": {
          opacity: 0,
          animation: `${gridCloudStackedRevealKeyframes} ${GRID_CLOUD_STAGGER_REVEAL.DURATION_MS}ms ${GRID_CLOUD_STAGGER_REVEAL.EASING} both`,
        },
        "& .MuiAccordion-root, & .MuiListItem-root, & .MuiChip-root, & .MuiPaper-root, & .MuiCard-root":
          {
            opacity: 0,
            animation: `${gridCloudStackedRevealKeyframes} ${GRID_CLOUD_STAGGER_REVEAL.DURATION_MS}ms ${GRID_CLOUD_STAGGER_REVEAL.EASING} both`,
          },
        "& [data-grid-cloud-stagger-leaf='true']": {
          opacity: 0,
          animation: `${gridCloudStackedRevealKeyframes} ${GRID_CLOUD_STAGGER_REVEAL.DURATION_MS}ms ${GRID_CLOUD_STAGGER_REVEAL.EASING} both`,
          animationDelay: `calc(${GRID_CLOUD_STAGGER_REVEAL.BASE_DELAY_MS}ms + var(--grid-cloud-leaf-index, 0) * ${GRID_CLOUD_STAGGER_REVEAL.STEP_MS}ms)`,
        },
        ...buildStaggerNthRules("> *"),
        ...buildStaggerNthRules(".MuiAccordion-root"),
        ...buildStaggerNthRules(".MuiListItem-root"),
        ...buildStaggerNthRules(".MuiChip-root"),
        ...buildStaggerNthRules(".MuiPaper-root"),
        ...buildStaggerNthRules(".MuiCard-root"),
      }
    : {};

  return (
    <Box
      sx={mergeSx(
        {
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        rootSx,
      )}
    >
      <Box
        sx={mergeSx(
          {
            minHeight: 0,
            flex: "1 1 auto",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
          contentSx,
        )}
      >
        <Box
          ref={staggerTargetRef}
          sx={[
            {
              minHeight: 0,
              flex: "1 1 auto",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              contentVisibility: { xs: "auto", md: "visible" },
              containIntrinsicSize: { xs: "680px", md: "auto" },
            },
            staggerTargetSx,
          ]}
        >
          {isCloudView ? cloudContent : listContent}
        </Box>
      </Box>
      {shouldRenderFooter ? (
        <Box
          sx={mergeSx(
            {
              py: 1.25,
              minHeight: "fit-content",
              display: "flex",
              alignItems: "center",
              justifyContent: footerStart || footerEnd ? "space-between" : "center",
              gap: 1,
              flexWrap: "wrap",
            },
            footerSx,
          )}
        >
          {footerStart ? (
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>{footerStart}</Box>
          ) : null}
          {shouldRenderViewToggle ? (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                View
              </Typography>
              <IconButton
                size="small"
                aria-label={listViewAriaLabel}
                onClick={() => onViewModeChange(false)}
                sx={{ p: 0.35 }}
              >
                <FormatListBulleted fontSize="small" color={isCloudView ? "disabled" : "primary"} />
              </IconButton>
              <Switch
                checked={isCloudView}
                onChange={(event) => onViewModeChange(event.target.checked)}
                inputProps={{ "aria-label": "Toggle view mode" }}
                color="primary"
                size="small"
              />
              <IconButton
                size="small"
                aria-label={cloudViewAriaLabel}
                onClick={() => onViewModeChange(true)}
                sx={{ p: 0.35 }}
              >
                <GridView fontSize="small" color={isCloudView ? "primary" : "disabled"} />
              </IconButton>
            </Stack>
          ) : (
            <Box />
          )}
          {footerEnd ? (
            <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>{footerEnd}</Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

export type {
  GridCloudNavigationSlideProps,
  VirtualizedPanelListProps,
} from "@/types/components/shared/gridCloudNavigationSlide";
