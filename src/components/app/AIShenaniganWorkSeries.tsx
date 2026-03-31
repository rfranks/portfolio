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

type RevealStage = "intro" | "work" | "series";
type ArrowDirection = "right" | "down";

const ARROW_REVEAL_MS = 280;

type AIShenaniganWorkSeriesProps = {
  rank: number;
  title: string;
  blurb: string;
  orientation?: AIShenaniganMovieOrientation;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  workPdf: string;
  workSource?: string;
  workSourceHref?: string;
  workCaption?: string;
  seriesMovie: string;
  seriesSource?: string;
  seriesSourceHref?: string;
  seriesCaption?: string;
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
  seriesMovie,
  seriesSource,
  seriesSourceHref,
  seriesCaption,
}: AIShenaniganWorkSeriesProps) {
  const [stage, setStage] = useState<RevealStage>("intro");
  const [workVisible, setWorkVisible] = useState(false);
  const [seriesVisible, setSeriesVisible] = useState(false);
  const [showSeriesArrow, setShowSeriesArrow] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState<RevealStage | null>(
    null,
  );
  const seriesTimeoutRef = useRef<number | null>(null);
  const workSectionRef = useRef<HTMLDivElement | null>(null);
  const seriesSectionRef = useRef<HTMLDivElement | null>(null);
  const workFooterRef = useRef<HTMLDivElement | null>(null);
  const seriesFooterRef = useRef<HTMLDivElement | null>(null);
  const seriesVideoRef = useRef<HTMLVideoElement | null>(null);
  const scrollStabilizersRef = useRef<Array<() => void>>([]);
  const workSfx = useAudio("/audio/open_003.ogg");
  const seriesSfx = useAudio("/audio/whoosh.ogg");
  const rewindSfx = useAudio("/audio/phaserDown2.ogg");
  const isPortrait = orientation === "portrait";
  const hasVisibleMedia = workVisible;
  const mediaAspectRatio = isPortrait ? "9 / 16" : "16 / 9";
  const mediaMaxWidth = isPortrait ? 420 : "100%";
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

  const clearPendingTransitions = useCallback(() => {
    if (seriesTimeoutRef.current) {
      window.clearTimeout(seriesTimeoutRef.current);
      seriesTimeoutRef.current = null;
    }
  }, []);

  const stopSeriesVideo = () => {
    if (!seriesVideoRef.current) {
      return;
    }
    seriesVideoRef.current.pause();
    seriesVideoRef.current.muted = false;
    seriesVideoRef.current.currentTime = 0;
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

  const revealLabels = [
    {
      key: "work" as const,
      label: "Work",
      active: workVisible,
      reached: workVisible,
    },
    {
      key: "series" as const,
      label: "Series Adaptation",
      active: seriesVisible || showSeriesArrow,
      reached: seriesVisible,
    },
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
            Open document
          </Link>
          <Typography variant="caption" color="text.secondary">
            Read inline or open the PDF in a separate tab.
          </Typography>
        </Stack>
      </Box>
    );
  };

  const renderNextAction = () => {
    if (stage === "intro") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealWork}
          disabled={transitioningTo !== null}
        >
          Reveal Work 📖
        </Button>
      );
    }

    if (stage === "work") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealSeries}
          disabled={transitioningTo !== null}
        >
          Reveal Series Adaptation 🎬
        </Button>
      );
    }

    return null;
  };

  const handleChronologySelect = (target: "work" | "series") => {
    if (transitioningTo !== null) {
      return;
    }

    rewindAndPlayAudio(rewindSfx, { volume: 0.24 });
    clearPendingTransitions();
    setTransitioningTo(null);
    setWorkVisible(true);
    setShowSeriesArrow(target === "series");
    setSeriesVisible(target === "series");
    setStage(target);

    if (target !== "series") {
      stopSeriesVideo();
    }

    window.requestAnimationFrame(() => {
      if (target === "work") {
        scrollRevealIntoView(workSectionRef.current, workFooterRef.current);
        return;
      }
      scrollRevealIntoView(seriesSectionRef.current, seriesFooterRef.current);
    });
  };

  const renderChronologyChips = (scope: "main" | "panel") =>
    revealLabels.map((item, index) => (
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
          onClick={item.reached ? () => handleChronologySelect(item.key) : undefined}
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
        {index < revealLabels.length - 1 && (
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
    const sequenceFinished = stage !== "intro" && !nextAction;

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
            {stage !== "intro" && !sequenceFinished && (
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
                label="Sequence Finished: Start Over"
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
    if (stage !== "series") {
      return;
    }

    const video = seriesVideoRef.current;

    if (!video) {
      return;
    }

    video.muted = false;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Controls remain available if autoplay failures occur.
    });
  }, [stage]);

  useEffect(() => {
    return () => {
      clearPendingTransitions();
      clearScrollStabilizers();
    };
  }, [clearPendingTransitions, clearScrollStabilizers]);

  const resetReveal = () => {
    clearPendingTransitions();
    clearScrollStabilizers();
    setTransitioningTo(null);
    setStage("intro");
    setWorkVisible(false);
    setShowSeriesArrow(false);
    setSeriesVisible(false);
    stopSeriesVideo();
  };

  const handleRevealWork = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("work");
    rewindAndPlayAudio(workSfx, { volume: 0.34 });
    window.requestAnimationFrame(() => {
      setWorkVisible(true);
      setStage("work");
      setTransitioningTo(null);
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(workSectionRef.current, workFooterRef.current);
      });
    });
  };

  const handleRevealSeries = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("series");
    rewindAndPlayAudio(seriesSfx, { volume: 0.3 });
    setShowSeriesArrow(true);
    seriesTimeoutRef.current = window.setTimeout(() => {
      setSeriesVisible(true);
      setStage("series");
      setTransitioningTo(null);
      seriesTimeoutRef.current = null;
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(seriesSectionRef.current, seriesFooterRef.current);
      });
    }, ARROW_REVEAL_MS);
  };

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
                      display: { xs: stage === "intro" ? "flex" : "none", lg: "flex" },
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
                      {stage !== "intro" && renderNextAction() && (
                        <Button variant="text" onClick={resetReveal}>
                          Start Over
                        </Button>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
                      {renderNextAction() ?? (
                        stage !== "intro" && (
                          <Chip
                            label="Sequence Finished: Start Over"
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
              {workVisible && (
                <Box ref={workSectionRef} sx={mediaPanelSx}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Work
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Reveal the source document that anchors the concept before the adaptation step.
                  </Typography>
                  {renderPdfFrame(workPdf, `${title} work`, () => {
                    scrollRevealIntoView(workSectionRef.current, workFooterRef.current);
                  })}
                  {renderSource(workSource, workSourceHref)}
                  {workCaption && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: workSource ? 0.75 : 1.5 }}>
                      {workCaption}
                    </Typography>
                  )}
                  {renderMobilePanelFooter(stage === "work", workFooterRef)}
                </Box>
              )}

              {workVisible && (
                <>
                  <Box sx={{ display: { xs: "flex", xl: "none" }, justifyContent: "center" }}>
                    {renderArrow("down", showSeriesArrow)}
                  </Box>
                  <Box sx={{ display: { xs: "none", xl: "flex" }, justifyContent: "center" }}>
                    {renderArrow("right", showSeriesArrow)}
                  </Box>
                </>
              )}

              {seriesVisible && (
                <Box ref={seriesSectionRef} sx={mediaPanelSx}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Series Adaptation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Push the written concept into motion as a series-style adaptation beat.
                  </Typography>
                  <Box
                    component="video"
                    ref={seriesVideoRef}
                    src={withBasePath(seriesMovie)}
                    controls
                    autoPlay
                    playsInline
                    onLoadedData={() => {
                      scrollRevealIntoView(
                        seriesSectionRef.current,
                        seriesFooterRef.current,
                      );
                    }}
                    className="block w-full rounded-[22px] bg-black/10 object-contain"
                    sx={{
                      aspectRatio: mediaAspectRatio,
                      maxWidth: mediaMaxWidth,
                      mx: isPortrait ? "auto" : undefined,
                    }}
                  />
                  {renderSource(seriesSource, seriesSourceHref)}
                  {seriesCaption && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: seriesSource ? 0.75 : 1.5 }}>
                      {seriesCaption}
                    </Typography>
                  )}
                  {renderMobilePanelFooter(stage === "series", seriesFooterRef)}
                </Box>
              )}
            </Stack>
          </Stack>
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
