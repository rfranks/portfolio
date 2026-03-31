"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FadeInSection from "@/components/app/FadeInSection";
import AIShenaniganAdaptation from "@/components/app/AIShenaniganAdaptation";
import AIShenaniganWorkSeries from "@/components/app/AIShenaniganWorkSeries";
import TronPaper from "@/components/app/TronPaper";
import { useAudio } from "@/hooks/audio/useAudio";
import { withBasePath } from "@/utils/basePath";
import { rewindAndPlayAudio } from "@/utils/lightgun-web/audio";

export type AIShenaniganMovieOrientation = "landscape" | "portrait" | undefined;
export type AIShenaniganType =
  | "default"
  | "book-to-limited-series"
  | "work-to-series-adaptation";

type AIShenaniganProps = {
  type?: AIShenaniganType;
  rank: number;
  title: string;
  blurb: string;
  orientation?: AIShenaniganMovieOrientation;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  realisticImage: string;
  realisticSource?: string;
  realisticSourceHref?: string;
  realisticCaption?: string;
  stylizedRendering?: string;
  stylizedSource?: string;
  stylizedSourceHref?: string;
  stylizedCaption?: string;
  movieRendering?: string | null;
  movieSource?: string;
  movieSourceHref?: string;
  movieCaption?: string;
  bookCoverImage?: string;
  bookSource?: string;
  bookSourceHref?: string;
  bookCaption?: string;
  manuscriptPdf?: string;
  manuscriptSource?: string;
  manuscriptSourceHref?: string;
  manuscriptCaption?: string;
  episodesPdf?: string;
  episodesSource?: string;
  episodesSourceHref?: string;
  episodesCaption?: string;
  episodeMedia?: Array<{
    title: string;
    episodeNumber?: number;
    seasonNumber?: number;
    src: string;
    source?: string;
    sourceHref?: string;
    caption?: string;
  }>;
  workPdf?: string;
  workSource?: string;
  workSourceHref?: string;
  workCaption?: string;
  seriesMovie?: string;
  seriesSource?: string;
  seriesSourceHref?: string;
  seriesCaption?: string;
};

type RevealStage = "intro" | "realistic" | "stylized" | "movie";
type ArrowDirection = "right" | "down";
const ARROW_REVEAL_MS = 280;

export default function AIShenanigan(props: AIShenaniganProps) {
  if (props.type === "book-to-limited-series") {
    return (
      <AIShenaniganAdaptation
        rank={props.rank}
        title={props.title}
        blurb={props.blurb}
        intentToCopyright={props.intentToCopyright}
        rightsNotice={props.rightsNotice}
        bookCoverImage={props.bookCoverImage || props.realisticImage}
        bookSource={props.bookSource || props.realisticSource}
        bookSourceHref={props.bookSourceHref || props.realisticSourceHref}
        bookCaption={props.bookCaption || props.realisticCaption}
        manuscriptPdf={props.manuscriptPdf || ""}
        manuscriptSource={props.manuscriptSource}
        manuscriptSourceHref={props.manuscriptSourceHref}
        manuscriptCaption={props.manuscriptCaption}
        episodesPdf={props.episodesPdf || ""}
        episodesSource={props.episodesSource}
        episodesSourceHref={props.episodesSourceHref}
        episodesCaption={props.episodesCaption}
        episodeMedia={props.episodeMedia}
      />
    );
  }

  if (props.type === "work-to-series-adaptation") {
    return (
      <AIShenaniganWorkSeries
        rank={props.rank}
        title={props.title}
        blurb={props.blurb}
        orientation={props.orientation}
        intentToCopyright={props.intentToCopyright}
        rightsNotice={props.rightsNotice}
        workPdf={props.workPdf || ""}
        workSource={props.workSource || props.realisticSource}
        workSourceHref={props.workSourceHref || props.realisticSourceHref}
        workCaption={props.workCaption || props.realisticCaption}
        seriesMovie={props.seriesMovie || props.movieRendering || ""}
        seriesSource={props.seriesSource || props.movieSource}
        seriesSourceHref={props.seriesSourceHref || props.movieSourceHref}
        seriesCaption={props.seriesCaption || props.movieCaption}
      />
    );
  }

  return <DefaultAIShenanigan {...props} />;
}

function DefaultAIShenanigan({
  rank,
  title,
  blurb,
  orientation = "landscape",
  intentToCopyright = false,
  rightsNotice,
  realisticImage,
  realisticSource,
  realisticSourceHref,
  realisticCaption,
  stylizedRendering,
  stylizedSource,
  stylizedSourceHref,
  stylizedCaption,
  movieRendering,
  movieSource,
  movieSourceHref,
  movieCaption,
}: AIShenaniganProps) {

  const [stage, setStage] = useState<RevealStage>("intro");
  const [realisticVisible, setRealisticVisible] = useState(false);
  const [showStylizedArrow, setShowStylizedArrow] = useState(false);
  const [showMovieArrow, setShowMovieArrow] = useState(false);
  const [stylizedVisible, setStylizedVisible] = useState(false);
  const [movieVisible, setMovieVisible] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState<RevealStage | null>(
    null,
  );
  const realisticSectionRef = useRef<HTMLDivElement | null>(null);
  const stylizedSectionRef = useRef<HTMLDivElement | null>(null);
  const motionSectionRef = useRef<HTMLDivElement | null>(null);
  const realisticFooterRef = useRef<HTMLDivElement | null>(null);
  const stylizedFooterRef = useRef<HTMLDivElement | null>(null);
  const movieFooterRef = useRef<HTMLDivElement | null>(null);
  const motionVideoRef = useRef<HTMLVideoElement | null>(null);
  const scrollStabilizersRef = useRef<Array<() => void>>([]);
  const stylizedTimeoutRef = useRef<number | null>(null);
  const movieTimeoutRef = useRef<number | null>(null);
  const inspirationSfx = useAudio("/audio/highUp.ogg");
  const stylizedSfx = useAudio("/audio/powerUp3.ogg");
  const motionSfx = useAudio("/audio/whoosh.ogg");
  const rewindSfx = useAudio("/audio/phaserDown2.ogg");
  const hasStylized = Boolean(stylizedRendering);
  const hasMovie = Boolean(movieRendering);
  const isPortrait = orientation === "portrait";
  const hasVisibleMedia = realisticVisible;
  const mediaAspectRatio = isPortrait ? "9 / 16" : "16 / 9";
  const stillAspectRatio = isPortrait ? "3 / 4" : "4 / 3";
  const mediaMaxWidth = isPortrait ? 420 : "100%";
  const stillMaxWidth = isPortrait ? 520 : undefined;
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

  const clearPendingTransitions = () => {
    if (stylizedTimeoutRef.current) {
      window.clearTimeout(stylizedTimeoutRef.current);
      stylizedTimeoutRef.current = null;
    }
    if (movieTimeoutRef.current) {
      window.clearTimeout(movieTimeoutRef.current);
      movieTimeoutRef.current = null;
    }
  };

  const stopMotionVideo = () => {
    if (!motionVideoRef.current) {
      return;
    }
    motionVideoRef.current.pause();
    motionVideoRef.current.muted = false;
    motionVideoRef.current.currentTime = 0;
  };

  const clearScrollStabilizers = () => {
    scrollStabilizersRef.current.forEach((cleanup) => cleanup());
    scrollStabilizersRef.current = [];
  };

  const scrollPanelIntoView = (
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
  };

  const scrollRevealIntoView = (
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
  };

  const revealLabels = useMemo(
    () => [
      {
        key: "realistic" as const,
        label: "Realistic source",
        active: realisticVisible,
        reached: realisticVisible,
      },
      ...(hasStylized
        ? [
            {
              key: "stylized" as const,
              label: "Stylized rendering",
              active: stylizedVisible || showStylizedArrow,
              reached: stylizedVisible,
            },
          ]
        : []),
      ...(hasMovie
        ? [
            {
              key: "movie" as const,
              label: "Motion rendering",
              active: movieVisible || (hasStylized && showMovieArrow),
              reached: movieVisible,
            },
          ]
        : []),
    ],
    [
      hasStylized,
      hasMovie,
      movieVisible,
      realisticVisible,
      showMovieArrow,
      showStylizedArrow,
      stylizedVisible,
    ],
  );

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
            ? {
                width: 88,
                height: 48,
              }
            : {
                width: 48,
                height: 72,
              }),
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

  const renderNextAction = () => {
    if (stage === "intro") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealRealistic}
          disabled={transitioningTo !== null}
        >
          Reveal Inspiration 💡
        </Button>
      );
    }

    if (stage === "realistic" && hasStylized) {
      return (
        <Button
          variant="contained"
          onClick={handleRevealStylized}
          disabled={transitioningTo !== null}
        >
          Reveal Stylized 🎨
        </Button>
      );
    }

    if ((stage === "realistic" && !hasStylized && hasMovie) || (stage === "stylized" && hasMovie)) {
      return (
        <Button
          variant="contained"
          onClick={handleRevealMovie}
          disabled={transitioningTo !== null}
        >
          Reveal Motion 🎬
        </Button>
      );
    }

    return null;
  };

  const handleChronologySelect = (target: "realistic" | "stylized" | "movie") => {
    if (transitioningTo !== null) {
      return;
    }

    rewindAndPlayAudio(rewindSfx, { volume: 0.24 });
    clearPendingTransitions();
    setTransitioningTo(null);
    setRealisticVisible(true);
    setShowStylizedArrow(hasStylized && target !== "realistic");
    setShowMovieArrow(target === "movie");
    setStylizedVisible(hasStylized && target !== "realistic");
    setMovieVisible(target === "movie");
    setStage(target);

    if (target !== "movie") {
      stopMotionVideo();
    }

    window.requestAnimationFrame(() => {
      if (target === "realistic") {
        scrollRevealIntoView(
          realisticSectionRef.current,
          realisticFooterRef.current,
        );
        return;
      }
      if (target === "stylized") {
        scrollRevealIntoView(
          stylizedSectionRef.current,
          stylizedFooterRef.current,
        );
        return;
      }
      scrollRevealIntoView(motionSectionRef.current, movieFooterRef.current);
    });
  };

  const renderChronologyChips = (scope: "main" | "panel") => {
    const visibleLabels = revealLabels;

    return visibleLabels.map((item, index) => (
      <Box
        key={`${scope}-${item.key}`}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
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
        {index < visibleLabels.length - 1 && (
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
  };

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
    if (stage !== "movie") {
      return;
    }

    const video = motionVideoRef.current;

    if (!video) {
      return;
    }

    video.muted = false;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Ignore autoplay failures; controls remain available.
    });
  }, [stage]);

  useEffect(() => {
    return () => {
      clearPendingTransitions();
      clearScrollStabilizers();
    };
  }, []);

  const resetReveal = () => {
    clearPendingTransitions();
    setTransitioningTo(null);
    setStage("intro");
    setRealisticVisible(false);
    setShowStylizedArrow(false);
    setShowMovieArrow(false);
    setStylizedVisible(false);
    setMovieVisible(false);
    stopMotionVideo();
    clearScrollStabilizers();
  };

  const handleRevealRealistic = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("realistic");
    rewindAndPlayAudio(inspirationSfx, { volume: 0.32 });
    window.requestAnimationFrame(() => {
      setRealisticVisible(true);
      setStage("realistic");
      setTransitioningTo(null);
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          realisticSectionRef.current,
          realisticFooterRef.current,
        );
      });
    });
  };

  const handleRevealStylized = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("stylized");
    rewindAndPlayAudio(stylizedSfx, { volume: 0.34 });
    setShowStylizedArrow(true);
    stylizedTimeoutRef.current = window.setTimeout(() => {
      setStylizedVisible(true);
      setStage("stylized");
      setTransitioningTo(null);
      stylizedTimeoutRef.current = null;
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          stylizedSectionRef.current,
          stylizedFooterRef.current,
        );
      });
    }, ARROW_REVEAL_MS);
  };

  const handleRevealMovie = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("movie");
    rewindAndPlayAudio(motionSfx, { volume: 0.3 });
    if (hasStylized) {
      setShowMovieArrow(true);
    }
    movieTimeoutRef.current = window.setTimeout(() => {
      setMovieVisible(true);
      setStage("movie");
      setTransitioningTo(null);
      movieTimeoutRef.current = null;
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(motionSectionRef.current, movieFooterRef.current);
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
            sx={{
              alignItems: { xs: "stretch", lg: "flex-start" },
              overflow: "hidden",
            }}
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
                <Box
                  className="relative overflow-hidden"
                  sx={{
                    ...panelChromeSx,
                    p: { xs: 3, md: 3.5 },
                    boxShadow: "none",
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
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1.5,
                        flexWrap: "wrap",
                      }}
                    >
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
                transform: hasVisibleMedia
                  ? "translate3d(0, 0, 0)"
                  : "translate3d(28px, 0, 0)",
                overflow: "hidden",
                pointerEvents: hasVisibleMedia ? "auto" : "none",
                transition:
                  "opacity 320ms ease, transform 560ms cubic-bezier(.2,.8,.2,1), flex-basis 560ms cubic-bezier(.2,.8,.2,1), max-width 560ms cubic-bezier(.2,.8,.2,1)",
              }}
            >
              <Stack
                spacing={2}
                direction={{ xs: "column", xl: "row" }}
                sx={{ alignItems: { xs: "stretch", xl: "center" } }}
              >
                {realisticVisible && (
                  <>
                    <Box
                      ref={realisticSectionRef}
                      sx={{
                        ...mediaPanelSx,
                        minWidth: 0,
                        flexBasis: { xl: stylizedVisible ? "50%" : "100%" },
                        maxWidth: { xl: stylizedVisible ? "50%" : "100%" },
                        opacity: 1,
                        transform: "translate3d(0, 0, 0)",
                        transition:
                          "opacity 320ms ease, transform 360ms cubic-bezier(.2,.8,.2,1), flex-basis 360ms cubic-bezier(.2,.8,.2,1), max-width 360ms cubic-bezier(.2,.8,.2,1)",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Realistic source
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        The grounded starting point.
                      </Typography>
                      <Image
                        src={withBasePath(realisticImage)}
                        alt={`${title} realistic source`}
                        width={1200}
                        height={900}
                        onLoad={() => {
                          if (realisticVisible) {
                            scrollRevealIntoView(
                              realisticSectionRef.current,
                              realisticFooterRef.current,
                            );
                          }
                        }}
                        className="h-auto w-full rounded-[22px] bg-black/10 object-contain"
                        style={{
                          aspectRatio: stillAspectRatio,
                          maxWidth: stillMaxWidth,
                          marginInline: "auto",
                        }}
                      />
                      {renderSource(realisticSource, realisticSourceHref)}
                      {realisticCaption && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: realisticSource ? 0.75 : 1.5 }}
                        >
                          {realisticCaption}
                        </Typography>
                      )}
                      {renderMobilePanelFooter(
                        stage === "realistic",
                        realisticFooterRef,
                      )}
                    </Box>
                    {hasStylized && (
                      <Box
                        sx={{
                          display: { xs: "flex", xl: "none" },
                          justifyContent: "center",
                        }}
                      >
                        {renderArrow("down", showStylizedArrow)}
                      </Box>
                    )}
                    {hasStylized && (
                      <Box
                        sx={{
                          display: { xs: "none", xl: "flex" },
                          justifyContent: "center",
                        }}
                      >
                        {renderArrow("right", showStylizedArrow)}
                      </Box>
                    )}
                    {stylizedVisible && stylizedRendering && (
                      <Box
                        ref={stylizedSectionRef}
                        sx={{
                          ...mediaPanelSx,
                          minWidth: 0,
                          flexBasis: { xl: "50%" },
                          maxWidth: { xl: "50%" },
                          opacity: 1,
                          transform: "translate3d(0, 0, 0)",
                          transition:
                            "opacity 320ms ease, transform 360ms cubic-bezier(.2,.8,.2,1), flex-basis 360ms cubic-bezier(.2,.8,.2,1), max-width 360ms cubic-bezier(.2,.8,.2,1)",
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Stylized rendering
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Push the portrait into caricature.
                        </Typography>
                        <Image
                          src={withBasePath(stylizedRendering)}
                          alt={`${title} stylized rendering`}
                          width={1200}
                          height={900}
                          onLoad={() => {
                            if (stylizedVisible) {
                              scrollRevealIntoView(
                                stylizedSectionRef.current,
                                stylizedFooterRef.current,
                              );
                            }
                          }}
                          className="h-auto w-full rounded-[22px] bg-black/10 object-contain"
                          style={{
                            aspectRatio: stillAspectRatio,
                            maxWidth: stillMaxWidth,
                            marginInline: "auto",
                          }}
                        />
                        {renderSource(stylizedSource, stylizedSourceHref)}
                        {stylizedCaption && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: stylizedSource ? 0.75 : 1.5 }}
                          >
                            {stylizedCaption}
                          </Typography>
                        )}
                        {renderMobilePanelFooter(
                          stage === "stylized",
                          stylizedFooterRef,
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Stack>
              {hasMovie && (movieVisible || (hasStylized ? showMovieArrow : realisticVisible)) && (
                <>
                  {hasStylized && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 0.5 }}
                    >
                      {renderArrow("down", showMovieArrow)}
                    </Box>
                  )}
                  {movieVisible && (
                    <Box
                      ref={motionSectionRef}
                      sx={mediaPanelSx}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Motion rendering
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        Let the caricature move.
                      </Typography>
                      <Box
                        component="video"
                        ref={motionVideoRef}
                        src={withBasePath(movieRendering!)}
                        controls
                        autoPlay
                        playsInline
                        onLoadedData={() => {
                          if (movieVisible) {
                            scrollRevealIntoView(
                              motionSectionRef.current,
                              movieFooterRef.current,
                            );
                          }
                        }}
                        className="block w-full rounded-[22px] bg-black/10 object-contain"
                        sx={{
                          aspectRatio: mediaAspectRatio,
                          maxWidth: mediaMaxWidth,
                          mx: isPortrait ? "auto" : undefined,
                        }}
                      />
                      {renderSource(movieSource, movieSourceHref)}
                      {movieCaption && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: movieSource ? 0.75 : 1.5 }}
                        >
                          {movieCaption}
                        </Typography>
                      )}
                      {renderMobilePanelFooter(stage === "movie", movieFooterRef)}
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </Stack>
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
