import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import GridView from "@mui/icons-material/GridView";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { keyframes, type SxProps, type Theme } from "@mui/material/styles";
import { useAudio } from "@/hooks/audio/useAudio";
import { rewindAndPlayAudio } from "@/utils/audio";

export interface GridCloudNavigationSlideProps {
  viewMode: "cloud" | "list";
  onViewModeChange: (nextCloudView: boolean) => void;
  listContent: ReactNode;
  cloudContent: ReactNode;
  isMdUp?: boolean;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  showFooterOnMobile?: boolean;
  showViewToggle?: boolean;
  rootSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  footerSx?: SxProps<Theme>;
  listViewAriaLabel?: string;
  cloudViewAriaLabel?: string;
  enableStaggeredReveal?: boolean;
  staggerRevealKey?: string | number;
}

const mergeSx = (base: SxProps<Theme>, override?: SxProps<Theme>): SxProps<Theme> =>
  (override ? [base, override] : base) as SxProps<Theme>;

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

const STAGGER_REVEAL_BASE_DELAY_MS = 130;
const STAGGER_REVEAL_STEP_MS = 105;
const STAGGER_REVEAL_MAX_INDEX = 16;
const STAGGER_REVEAL_SFX_PATH = "/audio/click_004.ogg";
const STAGGER_REVEAL_SFX_VOLUME = 0.22;
const STAGGER_REVEAL_SFX_POOL_SIZE = 4;

const buildStaggerNthRules = (selector: string) => {
  const rules: Record<string, Record<string, string>> = {};
  for (let index = 1; index <= STAGGER_REVEAL_MAX_INDEX; index += 1) {
    rules[`& ${selector}:nth-of-type(${index})`] = {
      animationDelay: `${STAGGER_REVEAL_BASE_DELAY_MS + STAGGER_REVEAL_STEP_MS * (index - 1)}ms`,
    };
  }
  return rules;
};

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
  const staggerRevealSfxA = useAudio(STAGGER_REVEAL_SFX_PATH);
  const staggerRevealSfxB = useAudio(STAGGER_REVEAL_SFX_PATH);
  const staggerRevealSfxC = useAudio(STAGGER_REVEAL_SFX_PATH);
  const staggerRevealSfxD = useAudio(STAGGER_REVEAL_SFX_PATH);
  const staggerRevealSfxPool = useMemo(
    () =>
      [staggerRevealSfxA, staggerRevealSfxB, staggerRevealSfxC, staggerRevealSfxD].slice(
        0,
        STAGGER_REVEAL_SFX_POOL_SIZE,
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
      const delay = STAGGER_REVEAL_BASE_DELAY_MS + index * STAGGER_REVEAL_STEP_MS;
      const timeoutId = window.setTimeout(() => {
        const sfxRef = staggerRevealSfxPool[index % staggerRevealSfxPool.length];
        rewindAndPlayAudio(sfxRef, { volume: STAGGER_REVEAL_SFX_VOLUME });
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
          animation: `${gridCloudStackedRevealKeyframes} 980ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        },
        "& .MuiAccordion-root, & .MuiListItem-root, & .MuiChip-root, & .MuiPaper-root, & .MuiCard-root":
          {
            opacity: 0,
            animation: `${gridCloudStackedRevealKeyframes} 980ms cubic-bezier(0.22, 1, 0.36, 1) both`,
          },
        "& [data-grid-cloud-stagger-leaf='true']": {
          opacity: 0,
          animation: `${gridCloudStackedRevealKeyframes} 980ms cubic-bezier(0.22, 1, 0.36, 1) both`,
          animationDelay: `calc(${STAGGER_REVEAL_BASE_DELAY_MS}ms + var(--grid-cloud-leaf-index, 0) * ${STAGGER_REVEAL_STEP_MS}ms)`,
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
