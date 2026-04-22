"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Loop from "@mui/icons-material/Loop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import AIShenaniganPanel from "./AIShenaniganPanel";
import { EmojiGlyph, MediaCycler } from "@/components/shared";
import { useAudio } from "@/hooks/audio/useAudio";
import { rewindAndPlayAudio } from "@/utils/audio";
import { withBasePath } from "@/utils/basePath";
import type { AIShenaniganMovieOrientation } from "./AIShenanigan";

type WorkDocumentPart = {
  src: string;
  title?: string;
  source?: string;
  sourceHref?: string;
  caption?: string;
};

type SeriesMediaPart = {
  src: string;
  title?: string;
  source?: string;
  sourceHref?: string;
  caption?: string;
};

type RevealStep = { kind: "work"; index: number } | { kind: "series"; index: number };

type AIShenaniganWorkSeriesProps = {
  rank: number;
  title: string;
  blurb: string;
  orientation?: AIShenaniganMovieOrientation;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  workPdf?: string;
  workSource?: string;
  workSourceHref?: string;
  workCaption?: string;
  workParts?: WorkDocumentPart[];
  seriesMovie?: string;
  seriesSource?: string;
  seriesSourceHref?: string;
  seriesCaption?: string;
  seriesParts?: SeriesMediaPart[];
};

export default function AIShenaniganWorkSeries({
  rank,
  title,
  blurb,
  orientation = "landscape",
  intentToCopyright = false,
  rightsNotice,
  workPdf,
  workSource,
  workSourceHref,
  workCaption,
  workParts = [],
  seriesMovie,
  seriesSource,
  seriesSourceHref,
  seriesCaption,
  seriesParts = [],
}: AIShenaniganWorkSeriesProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [isInfoPanelMinimized, setIsInfoPanelMinimized] = useState(false);
  const [revealedWorkCount, setRevealedWorkCount] = useState(0);
  const [revealedSeriesCount, setRevealedSeriesCount] = useState(0);
  const [transitioning, setTransitioning] = useState<RevealStep | null>(null);
  const workSectionRef = useRef<HTMLDivElement | null>(null);
  const seriesSectionRef = useRef<HTMLDivElement | null>(null);
  const workCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const seriesCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const workFooterRefs = useRef<Array<HTMLDivElement | null>>([]);
  const seriesFooterRefs = useRef<Array<HTMLDivElement | null>>([]);
  const seriesVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const scrollStabilizersRef = useRef<Array<() => void>>([]);
  const workSfx = useAudio("/audio/open_003.ogg");
  const seriesSfx = useAudio("/audio/whoosh.ogg");
  const rewindSfx = useAudio("/audio/phaserDown2.ogg");
  const isPortrait = orientation === "portrait";
  const mediaAspectRatio = isPortrait ? "9 / 16" : "16 / 9";
  const mediaMaxWidth = isPortrait ? 360 : "100%";
  const mobileInfoPanelHeight = "clamp(220px, 30dvh, 320px)";
  const mobileSplitGap = "20px";
  const desktopInfoPanelBasis = "30%";
  const desktopInfoPanelMaxWidth = "36%";
  const desktopMediaPanelHeight = "100%";
  const normalizedWorkParts =
    workParts.length > 0
      ? workParts
      : workPdf
        ? [
            {
              src: workPdf,
              source: workSource,
              sourceHref: workSourceHref,
              caption: workCaption,
            },
          ]
        : [];
  const normalizedSeriesParts =
    seriesParts.length > 0
      ? seriesParts
      : seriesMovie
        ? [
            {
              src: seriesMovie,
              source: seriesSource,
              sourceHref: seriesSourceHref,
              caption: seriesCaption,
            },
          ]
        : [];
  const hasVisibleMedia = revealedWorkCount > 0 || revealedSeriesCount > 0;
  const formattedRank = `#${String(rank).padStart(2, "0")}`;
  const rightsLabel = rightsNotice || "Intent to Copyright";
  const rightsStampAngle = ((rank * 7) % 17) - 8;
  const panelChromeSx = {
    borderRadius: "24px",
    border: "1px solid",
    borderColor: "var(--fabric-surface-border)",
    backgroundColor: "var(--fabric-surface-1)",
    backgroundImage: "linear-gradient(180deg, var(--fabric-inner-glow), transparent 34%)",
    boxShadow: "inset 0 1px 0 var(--fabric-inner-glow)",
    backdropFilter: "blur(var(--fabric-blur-sm))",
  } as const;
  const mediaControlSx = (currentTheme: typeof theme) => ({
    color: currentTheme.palette.common.black,
    borderColor: currentTheme.palette.common.black,
    bgcolor: currentTheme.palette.common.white,
    "&:hover": {
      bgcolor: currentTheme.palette.common.white,
    },
    "&.Mui-disabled": {
      color: alpha(currentTheme.palette.common.black, 0.36),
      borderColor: alpha(currentTheme.palette.common.black, 0.36),
      bgcolor: alpha(currentTheme.palette.common.white, 0.8),
    },
  });
  const restartActionSx = (currentTheme: typeof theme) => ({
    border: "1px solid",
    ...mediaControlSx(currentTheme),
  });
  const mediaPanelSx = {
    ...panelChromeSx,
    p: 2.5,
    position: "relative",
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as const;
  const totalWorkParts = normalizedWorkParts.length;
  const totalSeriesParts = normalizedSeriesParts.length;

  const clearPendingTransitions = useCallback(() => {}, []);

  const stopSeriesVideos = () => {
    seriesVideoRefs.current.forEach((video) => {
      if (!video) {
        return;
      }
      video.pause();
      video.muted = false;
      video.currentTime = 0;
    });
  };

  const clearScrollStabilizers = useCallback(() => {
    scrollStabilizersRef.current.forEach((cleanup) => cleanup());
    scrollStabilizersRef.current = [];
  }, []);

  const scrollPanelIntoView = useCallback(
    (panel: HTMLElement | null, block: ScrollLogicalPosition = "nearest") => {
      if (!panel) {
        return;
      }

      clearScrollStabilizers();

      const scroll = () => {
        panel.scrollIntoView({
          behavior: "smooth",
          block,
        });
      };

      scroll();

      const cleanups: Array<() => void> = [];
      [180, 480, 1080].forEach((delay) => {
        const timeoutId = window.setTimeout(scroll, delay);
        cleanups.push(() => window.clearTimeout(timeoutId));
      });

      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => {
          scroll();
        });
        observer.observe(panel);
        cleanups.push(() => observer.disconnect());

        const observerTimeoutId = window.setTimeout(() => {
          observer.disconnect();
        }, 1600);
        cleanups.push(() => window.clearTimeout(observerTimeoutId));
      }

      scrollStabilizersRef.current = cleanups;
    },
    [clearScrollStabilizers],
  );

  const scrollRevealIntoView = useCallback(
    (
      panel: HTMLElement | null,
      footer: HTMLElement | null,
      block: ScrollLogicalPosition = "center",
    ) => {
      if (!panel) {
        return;
      }

      const shouldFavorFooter =
        Boolean(footer) &&
        typeof window !== "undefined" &&
        window.matchMedia("(max-width:1199.95px)").matches;

      if (!shouldFavorFooter || !footer) {
        scrollPanelIntoView(panel, block);
        return;
      }

      clearScrollStabilizers();

      const scrollPanel = () => {
        panel.scrollIntoView({
          behavior: "smooth",
          block,
        });
      };

      const scrollFooter = () => {
        footer.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      };

      scrollPanel();

      const cleanups: Array<() => void> = [];
      [220, 520, 1080].forEach((delay) => {
        const timeoutId = window.setTimeout(scrollFooter, delay);
        cleanups.push(() => window.clearTimeout(timeoutId));
      });

      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => {
          scrollFooter();
        });
        observer.observe(panel);
        observer.observe(footer);
        cleanups.push(() => observer.disconnect());

        const observerTimeoutId = window.setTimeout(() => {
          observer.disconnect();
        }, 1600);
        cleanups.push(() => window.clearTimeout(observerTimeoutId));
      }

      scrollStabilizersRef.current = cleanups;
    },
    [clearScrollStabilizers, scrollPanelIntoView],
  );

  const getWorkLabel = (index: number) => `${title} - Part ${index + 1} of ${totalWorkParts}`;
  const getSeriesLabel = (index: number) =>
    `${title} - Series - Part ${index + 1} of ${totalSeriesParts}`;

  const chronologySteps: Array<{
    key: string;
    label: string;
    active: boolean;
    reached: boolean;
    step: RevealStep;
  }> = [
    ...normalizedWorkParts.map((_, index) => ({
      key: `work-${index}`,
      label: getWorkLabel(index),
      active: revealedWorkCount === index + 1 && revealedSeriesCount === 0,
      reached: revealedWorkCount > index,
      step: { kind: "work" as const, index },
    })),
    ...normalizedSeriesParts.map((_, index) => ({
      key: `series-${index}`,
      label: getSeriesLabel(index),
      active: revealedSeriesCount === index + 1,
      reached: revealedSeriesCount > index,
      step: { kind: "series" as const, index },
    })),
  ];

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

  const renderRightsStamp = () => {
    if (!intentToCopyright) {
      return null;
    }

    return (
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: { xs: 52, md: 60 },
          right: { xs: 14, md: 22 },
          zIndex: 2,
          pointerEvents: "none",
          px: 1.4,
          py: 0.7,
          borderRadius: "10px",
          border: "3px solid rgba(185,28,28,0.85)",
          color: "rgba(127,29,29,0.96)",
          bgcolor: "rgba(255,244,244,0.82)",
          fontSize: { xs: "0.7rem", md: "0.82rem" },
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transform: `rotate(${rightsStampAngle}deg)`,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.22) inset, 0 10px 24px rgba(127,29,29,0.18)",
          textShadow: "0 1px 0 rgba(255,255,255,0.3)",
          opacity: 0.92,
        }}
      >
        {rightsLabel}
      </Box>
    );
  };

  const renderInlineRightsStamp = () => {
    if (!intentToCopyright) {
      return null;
    }

    return (
      <Box
        sx={{
          px: 0.9,
          py: 0.45,
          borderRadius: "8px",
          border: "2px solid rgba(185,28,28,0.82)",
          color: "rgba(127,29,29,0.96)",
          bgcolor: "rgba(255,244,244,0.9)",
          fontSize: "0.58rem",
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {rightsLabel}
      </Box>
    );
  };

  const renderMobilePanelHeader = (subtitle: string, source?: string) => {
    if (!isSmDown) {
      return null;
    }

    const subtitleLine = source?.trim() ? `${subtitle} • ${source.trim()}` : subtitle;

    return (
      <Box sx={{ mb: 1.25 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.15 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, lineHeight: 1.3 }}>
              {subtitleLine}
            </Typography>
          </Box>
          {renderInlineRightsStamp()}
        </Stack>
      </Box>
    );
  };

  const renderPdfFrame = (
    src: string,
    titleText: string,
    onLoad?: () => void,
    onChevronPrevious?: () => void,
    onChevronNext?: () => void,
    disableChevronPrevious?: boolean,
    disableChevronNext?: boolean,
    loopNavigation?: boolean,
    onLoopNavigation?: () => void,
    disableLoopNavigation?: boolean,
  ) => {
    return (
      <Box sx={{ mt: 2, flex: 1, minHeight: 0, display: "flex" }}>
        <MediaCycler
          spacing={0}
          singlePanel
          transitionMs={260}
          showChevronNavigation
          showCompactInfoButton={false}
          navigationControlSx={mediaControlSx}
          expandControlSx={mediaControlSx}
          onChevronPrevious={onChevronPrevious}
          onChevronNext={onChevronNext}
          disableChevronPrevious={disableChevronPrevious}
          disableChevronNext={disableChevronNext}
          loopNavigation={loopNavigation}
          onLoopNavigation={onLoopNavigation}
          disableLoopNavigation={disableLoopNavigation}
          stackSx={{
            height: "100%",
            minHeight: 0,
            display: "flex",
            overflow: "hidden",
          }}
          items={[
            {
              key: `${titleText}-${src}`,
              title: "",
              mediaType: "pdf",
              mediaUrl: withBasePath(src),
              mediaLightboxTitle: titleText,
              onMediaLoaded: onLoad,
              panelSx: {
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              },
              assetFrameSx: {
                mt: 0,
                mb: 0,
                width: "100%",
                flex: "1 1 auto",
                minHeight: 0,
                display: "flex",
              },
              pdfPreviewSx: {
                height: "100%",
              },
              pdfContainerSx: {
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                flex: "1 1 auto",
              },
              pdfFrameSx: {
                flex: "1 1 auto",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              },
              pdfObjectSx: {
                flex: "1 1 auto",
                minHeight: 0,
              },
              pdfIframeSx: {
                flex: "1 1 auto",
                minHeight: 0,
              },
              pdfShowOpenLink: true,
              pdfOpenLinkLabel: "or open the PDF in a separate tab.",
              pdfOpenLinkDescription: null,
            },
          ]}
        />
      </Box>
    );
  };

  const currentStep = (): RevealStep | null => {
    if (revealedSeriesCount > 0) {
      return { kind: "series", index: revealedSeriesCount - 1 };
    }
    if (revealedWorkCount > 0) {
      return { kind: "work", index: revealedWorkCount - 1 };
    }
    return null;
  };

  const nextStep = (): RevealStep | null => {
    if (revealedWorkCount < totalWorkParts) {
      return { kind: "work", index: revealedWorkCount };
    }
    if (revealedSeriesCount < totalSeriesParts) {
      return { kind: "series", index: revealedSeriesCount };
    }
    return null;
  };

  const renderNextAction = () => {
    const step = nextStep();
    if (!step) {
      return null;
    }

    if (step.kind === "work") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealNextStep}
          disabled={transitioning !== null}
          endIcon={<EmojiGlyph glyph="📖" slot="end" />}
        >
          {`Reveal ${getWorkLabel(step.index)}`}
        </Button>
      );
    }

    return (
      <Button
        variant="contained"
        onClick={handleRevealNextStep}
        disabled={transitioning !== null}
        endIcon={<EmojiGlyph glyph="🎬" slot="end" />}
      >
        {`Reveal ${getSeriesLabel(step.index)}`}
      </Button>
    );
  };

  const rewindToStep = (target: RevealStep) => {
    if (transitioning !== null) {
      return;
    }

    rewindAndPlayAudio(rewindSfx, { volume: 0.24 });
    clearPendingTransitions();
    setTransitioning(null);
    stopSeriesVideos();

    if (target.kind === "work") {
      setRevealedWorkCount(target.index + 1);
      setRevealedSeriesCount(0);
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          workCardRefs.current[target.index] || workSectionRef.current,
          workFooterRefs.current[target.index],
        );
      });
      return;
    }

    setRevealedWorkCount(totalWorkParts);
    setRevealedSeriesCount(target.index + 1);
    window.requestAnimationFrame(() => {
      scrollRevealIntoView(
        seriesCardRefs.current[target.index] || seriesSectionRef.current,
        seriesFooterRefs.current[target.index],
      );
    });
  };

  const renderChronologyChips = (scope: "main" | "panel") => {
    const useCondensedChronology = chronologySteps.length > 3;
    const activeIndex = chronologySteps.findIndex((item) => item.active);
    let currentIndex = activeIndex;

    if (currentIndex === -1) {
      for (let index = chronologySteps.length - 1; index >= 0; index -= 1) {
        if (chronologySteps[index]?.reached) {
          currentIndex = index;
          break;
        }
      }
    }

    if (currentIndex === -1) {
      currentIndex = 0;
    }

    const firstIndex = 0;
    const lastIndex = Math.max(chronologySteps.length - 1, 0);
    const displayedIndices = useCondensedChronology
      ? (() => {
          const condensedIndices = new Set([firstIndex, currentIndex, lastIndex]);

          if (condensedIndices.size < 3) {
            if (currentIndex === firstIndex && firstIndex + 1 < lastIndex) {
              condensedIndices.add(firstIndex + 1);
            }

            if (currentIndex === lastIndex && lastIndex - 1 > firstIndex) {
              condensedIndices.add(lastIndex - 1);
            }
          }

          if (condensedIndices.size < 3) {
            const middleIndex = Math.floor((firstIndex + lastIndex) / 2);
            if (middleIndex > firstIndex && middleIndex < lastIndex) {
              condensedIndices.add(middleIndex);
            }
          }

          return Array.from(condensedIndices).sort((left, right) => left - right);
        })()
      : chronologySteps.map((_, index) => index);

    return displayedIndices.map((index, chipPosition) => {
      const item = chronologySteps[index];
      if (!item) {
        return null;
      }

      const hasNextChip = chipPosition < displayedIndices.length - 1;

      return (
        <Box key={`${scope}-${item.key}`} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={item.label}
            color={item.active ? "primary" : "default"}
            variant={item.active ? "filled" : "outlined"}
            size="small"
            clickable={item.reached}
            onClick={item.reached ? () => rewindToStep(item.step) : undefined}
            sx={
              item.reached
                ? undefined
                : {
                    borderStyle: "dashed",
                    borderColor: "rgba(148,163,184,0.55)",
                    color: "rgba(148,163,184,0.88)",
                    backgroundColor: "rgba(148,163,184,0.06)",
                    "& .MuiChip-label": {
                      fontStyle: "italic",
                    },
                  }
            }
          />
          {hasNextChip && (
            <Typography
              aria-hidden="true"
              sx={{
                fontSize: "1rem",
                fontWeight: 800,
                lineHeight: 1,
                color: useCondensedChronology
                  ? "text.disabled"
                  : item.active
                    ? "primary.main"
                    : "text.disabled",
                transform: "translateY(-1px)",
                transition: "color 180ms ease",
                userSelect: "none",
              }}
            >
              {useCondensedChronology ? "..." : "→"}
            </Typography>
          )}
        </Box>
      );
    });
  };

  useEffect(() => {
    if (!isSmallScreen) {
      setIsInfoPanelMinimized(false);
    }
  }, [isSmallScreen]);

  useEffect(() => {
    if (!isSmDown || hasVisibleMedia) {
      return;
    }

    if (totalWorkParts > 0) {
      setRevealedWorkCount(1);
      setRevealedSeriesCount(0);
      return;
    }

    if (totalSeriesParts > 0) {
      setRevealedWorkCount(0);
      setRevealedSeriesCount(1);
    }
  }, [hasVisibleMedia, isSmDown, totalSeriesParts, totalWorkParts]);

  useEffect(() => {
    if (revealedSeriesCount === 0) {
      return;
    }

    const video = seriesVideoRefs.current[revealedSeriesCount - 1];
    if (!video) {
      return;
    }

    video.muted = false;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Controls remain available if autoplay fails.
    });
  }, [revealedSeriesCount]);

  useEffect(() => {
    return () => {
      clearPendingTransitions();
      clearScrollStabilizers();
    };
  }, [clearPendingTransitions, clearScrollStabilizers]);

  const resetReveal = () => {
    rewindAndPlayAudio(rewindSfx, { volume: 0.24 });
    clearPendingTransitions();
    clearScrollStabilizers();
    setTransitioning(null);
    setRevealedWorkCount(0);
    setRevealedSeriesCount(0);
    stopSeriesVideos();
    seriesVideoRefs.current = [];
  };

  const handleRevealNextStep = () => {
    const step = nextStep();
    if (!step || transitioning) {
      return;
    }

    setTransitioning(step);
    rewindAndPlayAudio(step.kind === "work" ? workSfx : seriesSfx, {
      volume: step.kind === "work" ? 0.34 : 0.3,
    });

    if (step.kind === "work") {
      window.requestAnimationFrame(() => {
        setRevealedWorkCount((current) => Math.max(current, step.index + 1));
        setTransitioning(null);
        window.requestAnimationFrame(() => {
          scrollRevealIntoView(
            workCardRefs.current[step.index] || workSectionRef.current,
            workFooterRefs.current[step.index],
          );
        });
      });
      return;
    }

    if (revealedSeriesCount === 0) {
      setRevealedWorkCount(totalWorkParts);
      setRevealedSeriesCount(1);
      setTransitioning(null);
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          seriesCardRefs.current[0] || seriesSectionRef.current,
          seriesFooterRefs.current[0],
        );
      });
      return;
    }

    window.requestAnimationFrame(() => {
      setRevealedSeriesCount((current) => Math.max(current, step.index + 1));
      setTransitioning(null);
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          seriesCardRefs.current[step.index] || seriesSectionRef.current,
          seriesFooterRefs.current[step.index],
        );
      });
    });
  };

  const renderWorkPart = (part: WorkDocumentPart, index: number) => (
    <Box
      key={`${part.src}-${index}`}
      ref={(node: HTMLDivElement | null) => {
        workCardRefs.current[index] = node;
      }}
      sx={mediaPanelSx}
    >
      {renderMobilePanelHeader(getWorkLabel(index), part.source)}
      {!isSmDown && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {getWorkLabel(index)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Reveal the source document segment that anchors the concept.
          </Typography>
        </>
      )}
      {renderPdfFrame(
        part.src,
        `${title} ${getWorkLabel(index)}`,
        () => {
          scrollRevealIntoView(workCardRefs.current[index], workFooterRefs.current[index]);
        },
        index > 0 ? () => rewindToStep({ kind: "work", index: index - 1 }) : undefined,
        () => {
          handleRevealNextStep();
        },
        transitioning !== null || index <= 0,
        transitioning !== null ||
          !(
            (nextStep()?.kind === "work" && nextStep()?.index === index + 1) ||
            (nextStep()?.kind === "series" && index === totalWorkParts - 1)
          ),
        index === revealedWorkCount - 1 && nextStep() === null,
        () => {
          rewindToStep({ kind: "work", index: 0 });
        },
        transitioning !== null,
      )}
      {!isSmDown && renderSource(part.source, part.sourceHref)}
      {!isSmDown && part.caption && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: part.source ? 0.75 : 1.5 }}>
          {part.caption}
        </Typography>
      )}
    </Box>
  );

  const renderSeriesPart = (part: SeriesMediaPart, index: number) => (
    <Box
      key={`${part.src}-${index}`}
      ref={(node: HTMLDivElement | null) => {
        seriesCardRefs.current[index] = node;
      }}
      sx={mediaPanelSx}
    >
      {isSmDown && renderRightsStamp()}
      {!isSmDown && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {getSeriesLabel(index)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Push the written concept into motion as a series adaptation beat.
          </Typography>
        </>
      )}
      <MediaCycler
        spacing={0}
        singlePanel
        transitionMs={260}
        showChevronNavigation
        showCompactInfoButton={false}
        navigationControlSx={mediaControlSx}
        expandControlSx={mediaControlSx}
        onChevronPrevious={() => {
          if (transitioning) {
            return;
          }

          if (index > 0) {
            rewindToStep({ kind: "series", index: index - 1 });
            return;
          }

          if (totalWorkParts > 0) {
            rewindToStep({ kind: "work", index: totalWorkParts - 1 });
          }
        }}
        onChevronNext={() => {
          if (transitioning) {
            return;
          }

          const upcoming = nextStep();
          const isLatestRevealedCard = index === revealedSeriesCount - 1;
          if (isLatestRevealedCard && upcoming?.kind === "series") {
            handleRevealNextStep();
            return;
          }

          if (index < revealedSeriesCount - 1) {
            rewindToStep({ kind: "series", index: index + 1 });
          }
        }}
        disableChevronPrevious={transitioning !== null || (index === 0 && totalWorkParts === 0)}
        disableChevronNext={
          transitioning !== null ||
          !(
            index < revealedSeriesCount - 1 ||
            (index === revealedSeriesCount - 1 && nextStep()?.kind === "series")
          )
        }
        loopNavigation={index === revealedSeriesCount - 1 && nextStep() === null}
        onLoopNavigation={() => {
          if (totalWorkParts > 0) {
            rewindToStep({ kind: "work", index: 0 });
            return;
          }

          rewindToStep({ kind: "series", index: 0 });
        }}
        disableLoopNavigation={transitioning !== null}
        stackSx={{
          flexGrow: 1,
          minHeight: 0,
          height: "100%",
          overflow: "hidden",
        }}
        items={[
          {
            key: `series-media-${index}`,
            title: isSmDown ? title : "",
            description: isSmDown
              ? part.source?.trim()
                ? `${getSeriesLabel(index)} • ${part.source.trim()}`
                : getSeriesLabel(index)
              : undefined,
            mediaType: "video",
            mediaUrl: withBasePath(part.src),
            mediaLightboxTitle: `${title} ${getSeriesLabel(index)}`,
            mediaCaption: part.caption,
            mediaSource: part.source,
            mediaSourceHref: part.sourceHref,
            videoRef: (node: HTMLVideoElement | null) => {
              seriesVideoRefs.current[index] = node;
            },
            controls: true,
            autoPlay: index === revealedSeriesCount - 1,
            playsInline: true,
            onMediaLoaded: () => {
              scrollRevealIntoView(seriesCardRefs.current[index], seriesFooterRefs.current[index]);
            },
            onMediaActivate: () => {
              if (transitioning) {
                return;
              }

              const upcoming = nextStep();
              const isLatestRevealedCard = index === revealedSeriesCount - 1;
              const shouldRevealNextSeriesPart =
                isLatestRevealedCard && upcoming?.kind === "series";

              if (shouldRevealNextSeriesPart) {
                handleRevealNextStep();
                return;
              }

              rewindToStep({ kind: "series", index });
            },
            panelSx: {
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            },
            assetFrameSx: {
              mt: 0,
              mb: 0,
              width: "100%",
              flex: "1 1 auto",
              minHeight: 0,
              display: "flex",
            },
            previewVideoClassName: "block w-full rounded-[22px] bg-black/10 object-contain",
            previewVideoSx: {
              aspectRatio: mediaAspectRatio,
              maxWidth: mediaMaxWidth,
              maxHeight: "100%",
              height: "100%",
              mx: isPortrait ? "auto" : undefined,
            },
          },
        ]}
      />
    </Box>
  );

  const current = currentStep();

  return (
    <AIShenaniganPanel className="overflow-hidden">
      <Stack spacing={3} flexGrow={1} sx={{ minWidth: 0, maxWidth: "100%" }}>
        <Stack
          spacing={2.5}
          direction={{ xs: "column", md: "row" }}
          flexGrow={1}
          sx={{
            minWidth: 0,
            maxWidth: "100%",
            minHeight: 0,
            height: "100%",
            alignItems: "stretch",
            overflowX: "hidden",
            overflowY: "hidden",
          }}
        >
          <Box
            sx={{
              display: { xs: isSmDown ? "none" : "flex", md: "flex" },
              height: {
                xs: hasVisibleMedia ? mobileInfoPanelHeight : "100%",
                md: "100%",
              },
              width: { xs: "100%", md: "auto" },
              maxWidth: {
                xs: "100%",
                md: hasVisibleMedia ? desktopInfoPanelMaxWidth : "100%",
              },
              minWidth: 0,
              flex: {
                xs: "0 0 auto",
                md: hasVisibleMedia ? `0 1 ${desktopInfoPanelBasis}` : "1 1 100%",
              },
              flexBasis: {
                md: hasVisibleMedia ? desktopInfoPanelBasis : "100%",
              },
              flexShrink: { xs: 0, md: 1 },
              flexGrow: { xs: 0, md: hasVisibleMedia ? 0 : 1 },
              order: { xs: 2, md: 2 },
              transition:
                "flex-basis 560ms cubic-bezier(.2,.8,.2,1), max-width 560ms cubic-bezier(.2,.8,.2,1), min-width 560ms cubic-bezier(.2,.8,.2,1), transform 560ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <Box
              sx={{
                height: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                maxHeight: "100%",
                overflow: "hidden",
                pr: { md: hasVisibleMedia ? 0.5 : 0 },
                transition: "transform 560ms cubic-bezier(.2,.8,.2,1)",
              }}
            >
              <Box
                className="relative overflow-hidden"
                sx={{
                  ...panelChromeSx,
                  display: "flex",
                  flexDirection: "column",
                  p: { xs: 3, md: 3.5 },
                  boxShadow: "none",
                  height: "100%",
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 18,
                    fontSize: { xs: "2.8rem", sm: "3.5rem" },
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "-0.08em",
                    color: "transparent",
                    WebkitTextStroke: "1px rgba(96,165,250,0.5)",
                    textShadow: "0 12px 30px rgba(37,99,235,0.18)",
                    opacity: 0.95,
                    userSelect: "none",
                  }}
                >
                  {formattedRank}
                </Box>
                {renderRightsStamp()}
                <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>
                  {title}
                </Typography>
                {/* <Button
                  size="small"
                  variant="text"
                  onClick={() =>
                    setIsInfoPanelMinimized((currentValue) => !currentValue)
                  }
                  endIcon={
                    <EmojiGlyph
                      glyph={isInfoPanelMinimized ? "🔽" : "🔼"}
                      slot="end"
                      size="0.95rem"
                    />
                  }
                  sx={{
                    mt: 0.25,
                    mb: 1,
                    display: { xs: "inline-flex", md: "none" },
                    alignSelf: "flex-start",
                  }}
                >
                  {isInfoPanelMinimized ? "Expand Panel" : "Minimize Panel"}
                </Button> */}
                {!(isSmallScreen && isInfoPanelMinimized) && (
                  <>
                    <Typography
                      color="text.secondary"
                      className="leading-7"
                      sx={{
                        flexShrink: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        pr: 0.5,
                      }}
                    >
                      {blurb}
                    </Typography>
                    {!isSmallScreen && (
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{
                          mt: 2.5,
                          alignItems: "center",
                          display: {
                            xs: current ? "none" : "flex",
                            md: "flex",
                          },
                        }}
                      >
                        {renderChronologyChips("main")}
                      </Stack>
                    )}
                    <Box
                      sx={{
                        mt: "auto",
                        pt: 2.25,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "flex-end",
                        gap: 1.5,
                        flexGrow: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      {!isSmallScreen && (
                        <Box>
                          {current && renderNextAction() && (
                            <IconButton
                              aria-label="Start over"
                              onClick={resetReveal}
                              sx={restartActionSx}
                            >
                              <Loop fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      )}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1.5,
                          flexWrap: "wrap",
                        }}
                      >
                        {renderNextAction() ??
                          (current && (
                            <IconButton
                              aria-label="Sequence finished: start over"
                              onClick={resetReveal}
                              sx={restartActionSx}
                            >
                              <Loop fontSize="small" />
                            </IconButton>
                          ))}
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Box>
          <Stack
            spacing={2}
            sx={{
              minWidth: 0,
              flex: {
                xs: hasVisibleMedia ? "1 1 0px" : "0 0 auto",
                md: "1 1 0%",
              },
              width: { xs: "100%", md: 0 },
              height: {
                xs: hasVisibleMedia
                  ? isSmDown
                    ? "100%"
                    : `calc(100% - ${mobileInfoPanelHeight} - ${mobileSplitGap})`
                  : 0,
                md: hasVisibleMedia ? desktopMediaPanelHeight : 0,
              },
              minHeight: 0,
              overflow: "hidden",
              pr: { md: 1.25 },
              maxWidth: "100%",
              flexBasis: {
                xs: hasVisibleMedia ? "100%" : "0px",
                md: hasVisibleMedia ? 0 : "0px",
              },
              opacity: hasVisibleMedia ? 1 : 0,
              transform: hasVisibleMedia ? "translate3d(0, 0, 0)" : "translate3d(28px, 0, 0)",
              pointerEvents: hasVisibleMedia ? "auto" : "none",
              order: { xs: 1, md: 1 },
              transition:
                "opacity 320ms ease, transform 560ms cubic-bezier(.2,.8,.2,1), flex-basis 560ms cubic-bezier(.2,.8,.2,1), max-width 560ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            {current?.kind === "work" &&
              normalizedWorkParts[current.index] &&
              renderWorkPart(normalizedWorkParts[current.index], current.index)}

            {current?.kind === "series" &&
              normalizedSeriesParts[current.index] &&
              renderSeriesPart(normalizedSeriesParts[current.index], current.index)}
          </Stack>
        </Stack>
      </Stack>
    </AIShenaniganPanel>
  );
}
