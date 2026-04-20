"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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

type RevealStep =
  | { kind: "work"; index: number }
  | { kind: "series"; index: number };

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
  const panelFrameHeight = { xs: "44dvh", md: "52dvh" };
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
    backgroundImage:
      "linear-gradient(180deg, var(--fabric-inner-glow), transparent 34%)",
    boxShadow: "inset 0 1px 0 var(--fabric-inner-glow)",
    backdropFilter: "blur(var(--fabric-blur-sm))",
  } as const;
  const mediaPanelSx = {
    ...panelChromeSx,
    p: 2.5,
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

  const getWorkLabel = (index: number) =>
    `${title} - Part ${index + 1} of ${totalWorkParts}`;
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
          boxShadow:
            "0 0 0 2px rgba(255,255,255,0.22) inset, 0 10px 24px rgba(127,29,29,0.18)",
          textShadow: "0 1px 0 rgba(255,255,255,0.3)",
          opacity: 0.92,
        }}
      >
        {rightsLabel}
      </Box>
    );
  };

  const renderPdfFrame = (
    src: string,
    titleText: string,
    linkLabel: string,
    onLoad?: () => void,
  ) => {
    const pdfSrc = `${withBasePath(src)}#view=FitH`;

    return (
      <Box sx={{ mt: 2 }}>
        <Box
          sx={(theme) => ({
            overflow: "hidden",
            borderRadius: "18px",
            border: "1px solid",
            borderColor: "var(--fabric-surface-border)",
            bgcolor:
              theme.palette.mode === "light"
                ? alpha(theme.palette.common.white, 0.8)
                : "rgba(15,23,42,0.48)",
          })}
        >
          <Box
            component="object"
            data={pdfSrc}
            type="application/pdf"
            aria-label={titleText}
            sx={{
              display: "block",
              width: "100%",
              height: panelFrameHeight,
            }}
          >
            <Box
              component="iframe"
              src={pdfSrc}
              title={titleText}
              onLoad={onLoad}
              sx={{
                width: "100%",
                height: panelFrameHeight,
                border: 0,
                bgcolor: (theme) =>
                  theme.palette.mode === "light"
                    ? alpha(theme.palette.common.white, 0.84)
                    : "rgba(15,23,42,0.48)",
              }}
            />
          </Box>
        </Box>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 1.25 }}
        >
          <Link
            href={withBasePath(src)}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="primary.main"
            sx={{ display: "inline-flex" }}
          >
            {linkLabel}
          </Link>
          <Typography variant="caption" color="text.secondary">
            Read inline or open the PDF in a separate tab.
          </Typography>
        </Stack>
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

  const renderChronologyChips = (scope: "main" | "panel") =>
    chronologySteps.map((item, index) => (
      <Box
        key={`${scope}-${item.key}`}
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
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
        {index < chronologySteps.length - 1 && (
          <Typography
            aria-hidden="true"
            sx={{
              fontSize: "1rem",
              fontWeight: 800,
              lineHeight: 1,
              color: item.active ? "primary.main" : "text.disabled",
              transform: "translateY(-1px)",
              transition: "color 180ms ease",
              userSelect: "none",
            }}
          >
            →
          </Typography>
        )}
      </Box>
    ));

  useEffect(() => {
    if (!isSmallScreen) {
      setIsInfoPanelMinimized(false);
    }
  }, [isSmallScreen]);

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
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {getWorkLabel(index)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Reveal the source document segment that anchors the concept.
      </Typography>
      {renderPdfFrame(
        part.src,
        `${title} ${getWorkLabel(index)}`,
        `Open ${getWorkLabel(index)}`,
        () => {
          scrollRevealIntoView(
            workCardRefs.current[index],
            workFooterRefs.current[index],
          );
        },
      )}
      {renderSource(part.source, part.sourceHref)}
      {part.caption && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: part.source ? 0.75 : 1.5 }}
        >
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
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {getSeriesLabel(index)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Push the written concept into motion as a series adaptation beat.
      </Typography>
      <MediaCycler
        spacing={0}
        singlePanel
        transitionMs={260}
        items={[
          {
            key: `series-media-${index}`,
            title: "",
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
              scrollRevealIntoView(
                seriesCardRefs.current[index],
                seriesFooterRefs.current[index],
              );
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
            assetFrameSx: {
              mt: 0,
              mb: 0,
              width: "100%",
            },
            previewVideoClassName:
              "block w-full rounded-[22px] bg-black/10 object-contain",
            previewVideoSx: {
              aspectRatio: mediaAspectRatio,
              maxWidth: mediaMaxWidth,
              maxHeight: panelFrameHeight,
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
      <Stack spacing={3} flexGrow={1}>
        <Stack
          spacing={2.5}
          direction={{ xs: "column", md: "row" }}
          flexGrow={1}
          sx={{
            alignItems: { xs: "stretch", md: "flex-start" },
            overflow: { xs: "hidden", md: "visible" },
          }}
        >
          <Box
            sx={{
              maxHeight: {
                xs: hasVisibleMedia ? "30dvh" : "100%",
                md: "100%",
              },
              width: "100%",
              minWidth: { xs: 0, md: hasVisibleMedia ? 400 : 0 },
              maxWidth: { xs: "100%", md: hasVisibleMedia ? 400 : "100%" },
              flexBasis: "100%",
              flexGrow: 1,
              order: { xs: 2, md: 2 },
              transition:
                "flex-basis 560ms cubic-bezier(.2,.8,.2,1), max-width 560ms cubic-bezier(.2,.8,.2,1), min-width 560ms cubic-bezier(.2,.8,.2,1), transform 560ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <Box
              sx={{
                height: "100%",
                position: {
                  xs: "static",
                  md: hasVisibleMedia ? "sticky" : "static",
                },
                top: { md: 104 },
                maxHeight: {
                  xs: "none",
                  md: hasVisibleMedia ? "calc(100dvh - 120px)" : "none",
                },
                overflowY: {
                  xs: "visible",
                  md: hasVisibleMedia ? "auto" : "visible",
                },
                overscrollBehaviorY: { md: "contain" },
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
                        maxHeight: isSmallScreen ? "15dvh" : "auto",
                        overflowY: isSmallScreen ? "auto" : "visible",
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
                        mt: 3,
                        position: {
                          xs: "static",
                          md: hasVisibleMedia ? "sticky" : "static",
                        },
                        bottom: { md: 0 },
                        pt: { md: hasVisibleMedia ? 1.5 : 0 },
                        pb: { md: hasVisibleMedia ? 0.25 : 0 },
                        zIndex: { md: 1 },
                        background: {
                          xs: "transparent",
                          md: hasVisibleMedia
                            ? (theme) =>
                                `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0)} 0%, ${alpha(theme.palette.background.paper, 0.72)} 24%, ${alpha(theme.palette.background.paper, 0.88)} 100%)`
                            : "transparent",
                        },
                        backdropFilter: {
                          md: hasVisibleMedia ? "blur(4px)" : "none",
                        },
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
                            <Button
                              variant="text"
                              onClick={resetReveal}
                              startIcon={
                                <EmojiGlyph
                                  glyph="🔁"
                                  slot="start"
                                  size="1rem"
                                />
                              }
                            >
                              Start Over
                            </Button>
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
                            <Button
                              variant="contained"
                              onClick={resetReveal}
                              endIcon={<EmojiGlyph glyph="🔁" slot="end" />}
                            >
                              Sequence Finished: Start Over
                            </Button>
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
              flex: "1 1 auto",
              width: "100%",
              height: hasVisibleMedia ? "80dvh" : 0,
              overflowY: "auto",
              overflowX: "hidden",
              pr: { md: 1.25 },
              maxWidth: {
                xs: hasVisibleMedia ? "100%" : 0,
                md: hasVisibleMedia ? "calc(100% - 400px)" : 0,
              },
              flexBasis: {
                xs: hasVisibleMedia ? "100%" : "0px",
                md: hasVisibleMedia ? "calc(100% - 400px)" : "0px",
              },
              opacity: hasVisibleMedia ? 1 : 0,
              transform: hasVisibleMedia
                ? "translate3d(0, 0, 0)"
                : "translate3d(28px, 0, 0)",
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
              renderSeriesPart(
                normalizedSeriesParts[current.index],
                current.index,
              )}
          </Stack>
        </Stack>
      </Stack>
    </AIShenaniganPanel>
  );
}
