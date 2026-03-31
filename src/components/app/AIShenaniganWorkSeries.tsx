"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FadeInSection from "@/components/app/FadeInSection";
import TronPaper from "@/components/app/TronPaper";
import { useAudio } from "@/hooks/audio/useAudio";
import { rewindAndPlayAudio } from "@/utils/lightgun-web/audio";
import { withBasePath } from "@/utils/basePath";
import type { AIShenaniganMovieOrientation } from "@/components/app/AIShenanigan";

type ArrowDirection = "right" | "down";

const ARROW_REVEAL_MS = 280;

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
  const [revealedWorkCount, setRevealedWorkCount] = useState(0);
  const [revealedSeriesCount, setRevealedSeriesCount] = useState(0);
  const [showSeriesArrow, setShowSeriesArrow] = useState(false);
  const [transitioning, setTransitioning] = useState<RevealStep | null>(null);
  const seriesArrowTimeoutRef = useRef<number | null>(null);
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
  const mediaMaxWidth = isPortrait ? 420 : "100%";
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
    border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  } as const;
  const mediaPanelSx = {
    ...panelChromeSx,
    p: 2.5,
  } as const;
  const totalWorkParts = normalizedWorkParts.length;
  const totalSeriesParts = normalizedSeriesParts.length;

  const clearPendingTransitions = useCallback(() => {
    if (seriesArrowTimeoutRef.current) {
      window.clearTimeout(seriesArrowTimeoutRef.current);
      seriesArrowTimeoutRef.current = null;
    }
  }, []);

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

  const scrollPanelIntoView = useCallback((
    panel: HTMLElement | null,
    block: ScrollLogicalPosition = "nearest",
  ) => {
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
  }, [clearScrollStabilizers]);

  const scrollRevealIntoView = useCallback((
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
  }, [clearScrollStabilizers, scrollPanelIntoView]);

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

  const renderArrow = (direction: ArrowDirection, active: boolean) => (
    <Box
      aria-hidden="true"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: active ? 1 : 0,
        transform: active
          ? "translate3d(0, 0, 0) scale(1)"
          : direction === "right"
            ? "translate3d(-8px, 0, 0) scale(0.92)"
            : "translate3d(0, -8px, 0) scale(0.92)",
        transition:
          "opacity 260ms ease, transform 320ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          ...(direction === "right"
            ? { width: 88, height: 48 }
            : { width: 48, height: 72 }),
        }}
      >
        <Box
          sx={{
            position: "absolute",
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(34,211,238,0.2) 0%, rgba(59,130,246,0.95) 52%, rgba(14,165,233,0.9) 100%)",
            boxShadow: "0 0 22px rgba(56,189,248,0.35)",
            ...(direction === "right"
              ? {
                  top: "50%",
                  left: 8,
                  right: 18,
                  height: 4,
                  transform: "translateY(-50%)",
                }
              : {
                  top: 8,
                  bottom: 18,
                  left: "50%",
                  width: 4,
                  transform: "translateX(-50%)",
                }),
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 18,
            height: 18,
            borderTop: "4px solid",
            borderRight: "4px solid",
            borderColor: "rgb(59,130,246)",
            filter: "drop-shadow(0 0 12px rgba(59,130,246,0.6))",
            ...(direction === "right"
              ? {
                  top: "50%",
                  right: 6,
                  transform: "translateY(-50%) rotate(45deg)",
                }
              : {
                  bottom: 6,
                  left: "50%",
                  transform: "translateX(-50%) rotate(135deg)",
                }),
          }}
        />
      </Box>
    </Box>
  );

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
          sx={{
            overflow: "hidden",
            borderRadius: "18px",
            border: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "rgba(15,23,42,0.48)",
          }}
        >
          <Box
            component="object"
            data={pdfSrc}
            type="application/pdf"
            aria-label={titleText}
            sx={{
              display: "block",
              width: "100%",
              height: { xs: 520, md: 680, lg: 760 },
            }}
          >
            <Box
              component="iframe"
              src={pdfSrc}
              title={titleText}
              onLoad={onLoad}
              sx={{
                width: "100%",
                height: { xs: 520, md: 680, lg: 760 },
                border: 0,
                bgcolor: "rgba(15,23,42,0.48)",
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
        >
          {`Reveal ${getWorkLabel(step.index)} 📖`}
        </Button>
      );
    }

    return (
      <Button
        variant="contained"
        onClick={handleRevealNextStep}
        disabled={transitioning !== null}
      >
        {`Reveal ${getSeriesLabel(step.index)} 🎬`}
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
      setShowSeriesArrow(false);
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
    setShowSeriesArrow(true);
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

  const renderMobilePanelFooter = (
    showFooter: boolean,
    footerRef: { current: HTMLDivElement | null },
  ) => {
    if (!showFooter) {
      return null;
    }

    const nextAction = renderNextAction();
    const sequenceFinished = !nextAction;

    return (
      <Box
        ref={footerRef}
        sx={{
          display: { xs: "block", lg: "none" },
          mt: 2,
          pt: 2,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ alignItems: "center" }}
        >
          {renderChronologyChips("panel")}
        </Stack>
        <Box
          sx={{
            mt: 1.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box>
            {!sequenceFinished && currentStep() && (
              <Button variant="text" onClick={resetReveal}>
                Start Over
              </Button>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            {nextAction ?? (
              <Chip
                label="Sequence Finished: Start Over 🔁"
                color="primary"
                variant="outlined"
                size="small"
                clickable
                onClick={resetReveal}
              />
            )}
          </Box>
        </Box>
      </Box>
    );
  };

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
    setShowSeriesArrow(false);
    stopSeriesVideos();
    seriesVideoRefs.current = [];
  };

  const handleRevealNextStep = () => {
    const step = nextStep();
    if (!step || transitioning) {
      return;
    }

    setTransitioning(step);
    rewindAndPlayAudio(
      step.kind === "work" ? workSfx : seriesSfx,
      { volume: step.kind === "work" ? 0.34 : 0.3 },
    );

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
      setShowSeriesArrow(true);
      seriesArrowTimeoutRef.current = window.setTimeout(() => {
        setRevealedWorkCount(totalWorkParts);
        setRevealedSeriesCount(1);
        setTransitioning(null);
        seriesArrowTimeoutRef.current = null;
        window.requestAnimationFrame(() => {
          scrollRevealIntoView(
            seriesCardRefs.current[0] || seriesSectionRef.current,
            seriesFooterRefs.current[0],
          );
        });
      }, ARROW_REVEAL_MS);
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

  const renderWorkPart = (
    part: WorkDocumentPart,
    index: number,
  ) => (
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
          scrollRevealIntoView(workCardRefs.current[index], workFooterRefs.current[index]);
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
      {renderMobilePanelFooter(
        revealedSeriesCount === 0 && revealedWorkCount === index + 1,
        {
          get current() {
            return workFooterRefs.current[index];
          },
          set current(value: HTMLDivElement | null) {
            workFooterRefs.current[index] = value;
          },
        },
      )}
    </Box>
  );

  const renderSeriesPart = (
    part: SeriesMediaPart,
    index: number,
  ) => (
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
      <Box
        component="video"
        ref={(node: HTMLVideoElement | null) => {
          seriesVideoRefs.current[index] = node;
        }}
        src={withBasePath(part.src)}
        controls
        autoPlay={index === revealedSeriesCount - 1}
        playsInline
        onLoadedData={() => {
          scrollRevealIntoView(
            seriesCardRefs.current[index],
            seriesFooterRefs.current[index],
          );
        }}
        className="block w-full rounded-[22px] bg-black/10 object-contain"
        sx={{
          aspectRatio: mediaAspectRatio,
          maxWidth: mediaMaxWidth,
          mx: isPortrait ? "auto" : undefined,
        }}
      />
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
      {renderMobilePanelFooter(
        revealedSeriesCount === index + 1,
        {
          get current() {
            return seriesFooterRefs.current[index];
          },
          set current(value: HTMLDivElement | null) {
            seriesFooterRefs.current[index] = value;
          },
        },
      )}
    </Box>
  );

  const current = currentStep();

  return (
    <FadeInSection>
      <TronPaper className="overflow-hidden">
        <Stack spacing={3}>
          <Stack
            spacing={2.5}
            direction={{ xs: "column", lg: "row" }}
            sx={{ alignItems: { xs: "stretch", lg: "flex-start" }, overflow: "hidden" }}
          >
            <Box
              sx={{
                width: "100%",
                minWidth: { xs: 0, lg: hasVisibleMedia ? 340 : 0 },
                maxWidth: { xs: "100%", lg: hasVisibleMedia ? 340 : "100%" },
                flexBasis: { xs: "100%", lg: hasVisibleMedia ? "340px" : "100%" },
                flexShrink: 0,
                transition:
                  "flex-basis 560ms cubic-bezier(.2,.8,.2,1), max-width 560ms cubic-bezier(.2,.8,.2,1), min-width 560ms cubic-bezier(.2,.8,.2,1), transform 560ms cubic-bezier(.2,.8,.2,1)",
              }}
            >
              <Box
                sx={{
                  position: { xs: "static", lg: hasVisibleMedia ? "sticky" : "static" },
                  top: 104,
                  transition: "transform 560ms cubic-bezier(.2,.8,.2,1)",
                }}
              >
                <Box className="relative overflow-hidden" sx={{ ...panelChromeSx, p: { xs: 3, md: 3.5 }, boxShadow: "none" }}>
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
                  <Typography variant="overline" color="primary">
                    AI Shenanigan
                  </Typography>
                  {renderRightsStamp()}
                  <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>
                    {title}
                  </Typography>
                  <Typography color="text.secondary" className="leading-7">
                    {blurb}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{
                      mt: 2.5,
                      alignItems: "center",
                      display: { xs: current ? "none" : "flex", lg: "flex" },
                    }}
                  >
                    {renderChronologyChips("main")}
                  </Stack>
                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      {current && renderNextAction() && (
                        <Button variant="text" onClick={resetReveal}>
                          Start Over
                        </Button>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
                      {renderNextAction() ?? (
                        current && (
                          <Chip
                            label="Sequence Finished: Start Over 🔁"
                            color="primary"
                            variant="outlined"
                            clickable
                            onClick={resetReveal}
                          />
                        )
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Stack
              spacing={2}
              sx={{
                minWidth: 0,
                flex: "1 1 auto",
                width: "100%",
                maxWidth: { xs: "100%", lg: hasVisibleMedia ? "calc(100% - 340px)" : 0 },
                flexBasis: { xs: "100%", lg: hasVisibleMedia ? "calc(100% - 340px)" : "0px" },
                opacity: hasVisibleMedia ? 1 : 0,
                transform: hasVisibleMedia ? "translate3d(0, 0, 0)" : "translate3d(28px, 0, 0)",
                overflow: "hidden",
                pointerEvents: hasVisibleMedia ? "auto" : "none",
                transition:
                  "opacity 320ms ease, transform 560ms cubic-bezier(.2,.8,.2,1), flex-basis 560ms cubic-bezier(.2,.8,.2,1), max-width 560ms cubic-bezier(.2,.8,.2,1)",
              }}
            >
              {revealedWorkCount > 0 && (
                <Stack ref={workSectionRef} spacing={2}>
                  {normalizedWorkParts
                    .slice(0, revealedWorkCount)
                    .map((part, index) => renderWorkPart(part, index))}
                </Stack>
              )}

              {revealedWorkCount === totalWorkParts && totalSeriesParts > 0 && (
                <>
                  <Box sx={{ display: { xs: "flex", xl: "none" }, justifyContent: "center" }}>
                    {renderArrow("down", showSeriesArrow)}
                  </Box>
                  <Box sx={{ display: { xs: "none", xl: "flex" }, justifyContent: "center" }}>
                    {renderArrow("right", showSeriesArrow)}
                  </Box>
                </>
              )}

              {revealedSeriesCount > 0 && (
                <Stack ref={seriesSectionRef} spacing={2}>
                  {normalizedSeriesParts
                    .slice(0, revealedSeriesCount)
                    .map((part, index) => renderSeriesPart(part, index))}
                </Stack>
              )}
            </Stack>
          </Stack>
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
