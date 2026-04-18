"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import AIShenaniganPanel from "./AIShenaniganPanel";
import EmojiGlyph from "@/components/shared/EmojiGlyph";
import ImageLightbox from "@/components/shared/ImageLightbox";
import VideoLightbox from "@/components/shared/VideoLightbox";
import { useAudio } from "@/hooks/audio/useAudio";
import { rewindAndPlayAudio } from "@/utils/audio";
import { withBasePath } from "@/utils/basePath";

type RevealStage = "intro" | "book" | "manuscript" | "trailer" | "episodes";
type ArrowDirection = "right" | "down";
type TrailerOrientation = "landscape" | "portrait" | undefined;

const ARROW_REVEAL_MS = 280;

type AIShenaniganAdaptationProps = {
  rank: number;
  title: string;
  blurb: string;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  bookCoverImage: string;
  bookSource?: string;
  bookSourceHref?: string;
  bookCaption?: string;
  manuscriptPdf: string;
  manuscriptSource?: string;
  manuscriptSourceHref?: string;
  manuscriptCaption?: string;
  trailerMovie?: string;
  trailerOrientation?: TrailerOrientation;
  trailerSource?: string;
  trailerSourceHref?: string;
  trailerCaption?: string;
  episodesPdf: string;
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
};

export default function AIShenaniganAdaptation({
  rank,
  title,
  blurb,
  intentToCopyright = false,
  rightsNotice,
  bookCoverImage,
  bookSource,
  bookSourceHref,
  bookCaption,
  manuscriptPdf,
  manuscriptSource,
  manuscriptSourceHref,
  manuscriptCaption,
  trailerMovie,
  trailerOrientation = "landscape",
  trailerSource,
  trailerSourceHref,
  trailerCaption,
  episodesPdf,
  episodesSource,
  episodesSourceHref,
  episodesCaption,
  episodeMedia = [],
}: AIShenaniganAdaptationProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [isInfoPanelMinimized, setIsInfoPanelMinimized] = useState(false);
  const [stage, setStage] = useState<RevealStage>("intro");
  const [bookVisible, setBookVisible] = useState(false);
  const [bookCoverLoaded, setBookCoverLoaded] = useState(false);
  const [manuscriptVisible, setManuscriptVisible] = useState(false);
  const [trailerVisible, setTrailerVisible] = useState(false);
  const [trailerLoaded, setTrailerLoaded] = useState(false);
  const [pendingTrailerReveal, setPendingTrailerReveal] = useState(false);
  const [episodesVisible, setEpisodesVisible] = useState(false);
  const [revealedEpisodeCount, setRevealedEpisodeCount] = useState(0);
  const [showManuscriptArrow, setShowManuscriptArrow] = useState(false);
  const [showTrailerArrow, setShowTrailerArrow] = useState(false);
  const [showEpisodesArrow, setShowEpisodesArrow] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState<RevealStage | null>(
    null,
  );
  const manuscriptTimeoutRef = useRef<number | null>(null);
  const trailerTimeoutRef = useRef<number | null>(null);
  const episodesTimeoutRef = useRef<number | null>(null);
  const bookSectionRef = useRef<HTMLDivElement | null>(null);
  const bookCoverRef = useRef<HTMLDivElement | null>(null);
  const manuscriptSectionRef = useRef<HTMLDivElement | null>(null);
  const trailerSectionRef = useRef<HTMLDivElement | null>(null);
  const episodesSectionRef = useRef<HTMLDivElement | null>(null);
  const bookFooterRef = useRef<HTMLDivElement | null>(null);
  const manuscriptFooterRef = useRef<HTMLDivElement | null>(null);
  const trailerFooterRef = useRef<HTMLDivElement | null>(null);
  const episodesFooterRef = useRef<HTMLDivElement | null>(null);
  const episodeCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const episodeFooterRefs = useRef<Array<HTMLDivElement | null>>([]);
  const trailerVideoRef = useRef<HTMLVideoElement | null>(null);
  const episodeVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const scrollStabilizersRef = useRef<Array<() => void>>([]);
  const bookSfx = useAudio("/audio/highUp.ogg");
  const manuscriptSfx = useAudio("/audio/open_003.ogg");
  const trailerSfx = useAudio("/audio/whoosh.ogg");
  const episodesSfx = useAudio("/audio/select_004.ogg");
  const nextEpisodeSfx = useAudio("/audio/whoosh.ogg");
  const rewindSfx = useAudio("/audio/phaserDown2.ogg");
  const formattedRank = `#${String(rank).padStart(2, "0")}`;
  const rightsLabel = rightsNotice || "Intent to Copyright";
  const rightsStampAngle = ((rank * 7) % 17) - 8;
  const hasVisibleMedia = bookVisible;
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
  const hasTrailer = Boolean(trailerMovie);
  const isTrailerPortrait = trailerOrientation === "portrait";
  const trailerAspectRatio = isTrailerPortrait ? "9 / 16" : "16 / 9";
  const trailerMaxWidth = isTrailerPortrait ? 420 : undefined;
  const panelFrameHeight = { xs: "44dvh", md: "52dvh" };
  const hasEpisodesPdf = Boolean(episodesPdf);
  const hasEpisodeMedia = episodeMedia.length > 0;

  const clearPendingTransitions = useCallback(() => {
    if (manuscriptTimeoutRef.current) {
      window.clearTimeout(manuscriptTimeoutRef.current);
      manuscriptTimeoutRef.current = null;
    }
    if (trailerTimeoutRef.current) {
      window.clearTimeout(trailerTimeoutRef.current);
      trailerTimeoutRef.current = null;
    }
    if (episodesTimeoutRef.current) {
      window.clearTimeout(episodesTimeoutRef.current);
      episodesTimeoutRef.current = null;
    }
  }, []);

  const stopMediaVideos = () => {
    if (trailerVideoRef.current) {
      trailerVideoRef.current.pause();
      trailerVideoRef.current.muted = false;
      trailerVideoRef.current.currentTime = 0;
    }

    episodeVideoRefs.current.forEach((video) => {
      if (!video) {
        return;
      }
      video.pause();
      video.muted = false;
      video.currentTime = 0;
    });
  };

  const playTrailer = () => {
    const video = trailerVideoRef.current;
    if (!video) {
      return;
    }
    video.muted = false;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Controls remain available if autoplay with sound is blocked.
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

  const getEpisodeSeasonNumber = (seasonNumber?: number) => seasonNumber ?? 1;

  const getEpisodeChronologyLabel = (episode: {
    title: string;
    episodeNumber?: number;
    seasonNumber?: number;
  }) => {
    if (!episode.episodeNumber) {
      return episode.title;
    }

    return `Season ${getEpisodeSeasonNumber(
      episode.seasonNumber,
    )}: Episode ${episode.episodeNumber}`;
  };

  const revealLabels = [
    {
      key: "book" as const,
      label: "Book cover",
      active: bookVisible,
      reached: bookVisible,
    },
    {
      key: "manuscript" as const,
      label: "Manuscript",
      active: manuscriptVisible || showManuscriptArrow,
      reached: manuscriptVisible,
    },
    ...(hasTrailer
      ? [
          {
            key: "trailer" as const,
            label: "Trailer",
            active: trailerVisible || showTrailerArrow,
            reached: trailerVisible,
          },
        ]
      : []),
    {
      key: "episodes" as const,
      label: "Episodes Draft",
      active: episodesVisible || showEpisodesArrow,
      reached: episodesVisible,
    },
    ...episodeMedia.map((episode, index) => ({
      key: `episode-${index}` as const,
      label: getEpisodeChronologyLabel(episode),
      active: revealedEpisodeCount > index,
      reached: revealedEpisodeCount > index,
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
          onClick={handleRevealBook}
          disabled={transitioningTo !== null}
          endIcon={<EmojiGlyph glyph="📚" slot="end" />}
        >
          Reveal Book Cover
        </Button>
      );
    }

    if (stage === "book") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealManuscript}
          disabled={transitioningTo !== null}
          endIcon={<EmojiGlyph glyph="✍️" slot="end" />}
        >
          Reveal Manuscript
        </Button>
      );
    }

    if (stage === "manuscript") {
      return (
        <Button
          variant="contained"
          onClick={hasTrailer ? handleRevealTrailer : handleRevealEpisodes}
          disabled={transitioningTo !== null}
          endIcon={<EmojiGlyph glyph={hasTrailer ? "🎬" : "📺"} slot="end" />}
        >
          {hasTrailer ? "Reveal Trailer" : "Reveal Episodes Draft"}
        </Button>
      );
    }

    if (stage === "trailer") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealEpisodes}
          disabled={transitioningTo !== null}
          endIcon={<EmojiGlyph glyph="📺" slot="end" />}
        >
          Reveal Episodes Draft
        </Button>
      );
    }

    if (stage === "episodes" && revealedEpisodeCount < episodeMedia.length) {
      return (
        <Button
          variant="contained"
          onClick={handleRevealNextEpisode}
          disabled={transitioningTo !== null}
          endIcon={<EmojiGlyph glyph="🎞️" slot="end" />}
        >
          Reveal Next Episode
        </Button>
      );
    }

    return null;
  };

  const handleChronologySelect = (
    target:
      | "book"
      | "manuscript"
      | "trailer"
      | "episodes"
      | `episode-${number}`,
  ) => {
    if (transitioningTo !== null) {
      return;
    }

    rewindAndPlayAudio(rewindSfx, { volume: 0.24 });
    clearPendingTransitions();
    setTransitioningTo(null);
    setPendingTrailerReveal(false);
    setBookVisible(true);
    setBookCoverLoaded(true);
    setShowManuscriptArrow(target !== "book");
    setManuscriptVisible(target !== "book");
    const targetsEpisodes =
      target === "episodes" || target.startsWith("episode-");
    const targetsTrailer =
      hasTrailer && (target === "trailer" || targetsEpisodes);
    setShowTrailerArrow(
      hasTrailer && target !== "book" && target !== "manuscript",
    );
    setTrailerVisible(targetsTrailer);
    setShowEpisodesArrow(
      hasTrailer
        ? targetsEpisodes
        : target === "episodes" || target.startsWith("episode-"),
    );
    setEpisodesVisible(targetsEpisodes);

    if (target === "book") {
      setStage("book");
      setRevealedEpisodeCount(0);
      stopMediaVideos();
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          bookCoverRef.current || bookSectionRef.current,
          bookFooterRef.current,
        );
      });
      return;
    }

    if (target === "manuscript") {
      setStage("manuscript");
      setRevealedEpisodeCount(0);
      stopMediaVideos();
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          manuscriptSectionRef.current,
          manuscriptFooterRef.current,
        );
      });
      return;
    }

    if (target === "trailer") {
      setStage("trailer");
      setRevealedEpisodeCount(0);
      setPendingTrailerReveal(true);
      stopMediaVideos();
      return;
    }

    if (target === "episodes") {
      setStage("episodes");
      setRevealedEpisodeCount(0);
      stopMediaVideos();
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          episodesSectionRef.current,
          episodesFooterRef.current,
        );
      });
      return;
    }

    const episodeIndex = Number(target.replace("episode-", ""));
    setStage("episodes");
    setRevealedEpisodeCount(episodeIndex + 1);
    stopMediaVideos();
    window.requestAnimationFrame(() => {
      scrollRevealIntoView(
        episodeCardRefs.current[episodeIndex],
        episodeFooterRefs.current[episodeIndex],
      );
    });
  };

  const renderChronologyChips = (scope: "main" | "panel") => {
    const visibleLabels = revealLabels;

    return visibleLabels.map((item, index) => (
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
          onClick={
            item.reached ? () => handleChronologySelect(item.key) : undefined
          }
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

  useEffect(() => {
    if (!isSmallScreen) {
      setIsInfoPanelMinimized(false);
    }
  }, [isSmallScreen]);

  useEffect(() => {
    if (!bookVisible || !bookCoverLoaded) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      scrollRevealIntoView(
        bookCoverRef.current || bookSectionRef.current,
        bookFooterRef.current,
      );
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [bookCoverLoaded, bookVisible, scrollRevealIntoView]);

  useEffect(() => {
    if (
      !pendingTrailerReveal ||
      !trailerVisible ||
      stage !== "trailer" ||
      !trailerLoaded
    ) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      scrollRevealIntoView(trailerSectionRef.current, trailerFooterRef.current);
      window.setTimeout(() => {
        playTrailer();
      }, 180);
      setPendingTrailerReveal(false);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [
    pendingTrailerReveal,
    trailerVisible,
    stage,
    trailerLoaded,
    scrollRevealIntoView,
  ]);

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
    setTransitioningTo(null);
    setStage("intro");
    setBookVisible(false);
    setBookCoverLoaded(false);
    setManuscriptVisible(false);
    setTrailerVisible(false);
    setTrailerLoaded(false);
    setPendingTrailerReveal(false);
    setEpisodesVisible(false);
    setRevealedEpisodeCount(0);
    setShowManuscriptArrow(false);
    setShowTrailerArrow(false);
    setShowEpisodesArrow(false);
    stopMediaVideos();
    episodeCardRefs.current = [];
    episodeFooterRefs.current = [];
    trailerVideoRef.current = null;
    episodeVideoRefs.current = [];
  };

  const handleRevealBook = () => {
    if (transitioningTo) {
      return;
    }
    setPendingTrailerReveal(false);
    setTransitioningTo("book");
    rewindAndPlayAudio(bookSfx, { volume: 0.32 });
    window.requestAnimationFrame(() => {
      setBookCoverLoaded(false);
      setBookVisible(true);
      setStage("book");
      setTransitioningTo(null);
    });
  };

  const handleRevealManuscript = () => {
    if (transitioningTo) {
      return;
    }
    setPendingTrailerReveal(false);
    setTransitioningTo("manuscript");
    rewindAndPlayAudio(manuscriptSfx, { volume: 0.34 });
    setShowManuscriptArrow(true);
    manuscriptTimeoutRef.current = window.setTimeout(() => {
      setManuscriptVisible(true);
      setStage("manuscript");
      setTransitioningTo(null);
      manuscriptTimeoutRef.current = null;
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          manuscriptSectionRef.current,
          manuscriptFooterRef.current,
        );
      });
    }, ARROW_REVEAL_MS);
  };

  const handleRevealTrailer = () => {
    if (transitioningTo || !hasTrailer) {
      return;
    }
    setTransitioningTo("trailer");
    rewindAndPlayAudio(trailerSfx, { volume: 0.32 });
    setShowTrailerArrow(true);
    setPendingTrailerReveal(true);
    trailerTimeoutRef.current = window.setTimeout(() => {
      setTrailerVisible(true);
      setStage("trailer");
      setTransitioningTo(null);
      trailerTimeoutRef.current = null;
    }, ARROW_REVEAL_MS);
  };

  const handleRevealEpisodes = () => {
    if (transitioningTo) {
      return;
    }
    setPendingTrailerReveal(false);
    setTransitioningTo("episodes");
    rewindAndPlayAudio(episodesSfx, { volume: 0.32 });
    setShowEpisodesArrow(true);
    episodesTimeoutRef.current = window.setTimeout(() => {
      setEpisodesVisible(true);
      setStage("episodes");
      setRevealedEpisodeCount(0);
      setTransitioningTo(null);
      episodesTimeoutRef.current = null;
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          episodesSectionRef.current,
          episodesFooterRef.current,
        );
      });
    }, ARROW_REVEAL_MS);
  };

  const handleRevealNextEpisode = () => {
    if (transitioningTo || revealedEpisodeCount >= episodeMedia.length) {
      return;
    }

    setTransitioningTo("episodes");
    rewindAndPlayAudio(nextEpisodeSfx, { volume: 0.3 });
    const nextIndex = revealedEpisodeCount;
    window.setTimeout(() => {
      setRevealedEpisodeCount((current) => current + 1);
      setTransitioningTo(null);
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(
          episodeCardRefs.current[nextIndex],
          episodeFooterRefs.current[nextIndex],
        );
        window.setTimeout(() => {
          const video = episodeVideoRefs.current[nextIndex];
          if (!video) {
            return;
          }

          video.muted = false;
          video.currentTime = 0;
          void video.play().catch(() => {
            // Controls remain available if autoplay with sound is blocked.
          });
        }, 260);
      });
    }, 120);
  };

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
              display: "flex",
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
                            xs: stage === "intro" ? "flex" : "none",
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
                      <Box>
                        {stage !== "intro" && renderNextAction() && (
                          <Button
                            variant="text"
                            onClick={resetReveal}
                            startIcon={
                              <EmojiGlyph glyph="🔁" slot="start" size="1rem" />
                            }
                          >
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
                        {renderNextAction() ??
                          (stage !== "intro" && (
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
            {bookVisible && (
              <Box ref={bookSectionRef} sx={mediaPanelSx}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Book cover
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Start with the originating book-side artifact.
                </Typography>
                <Box
                  ref={bookCoverRef}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <ImageLightbox
                    src={withBasePath(bookCoverImage)}
                    alt={`${title} book cover`}
                    title={`${title} — Book Cover`}
                    caption={bookCaption || bookSource}
                  >
                    <Image
                      src={withBasePath(bookCoverImage)}
                      alt={`${title} book cover`}
                      width={1400}
                      height={900}
                      onLoad={() => {
                        setBookCoverLoaded(true);
                      }}
                      className="h-auto w-full rounded-[22px] bg-black/10 object-contain"
                      style={{ maxWidth: 440, marginInline: "auto" }}
                    />
                  </ImageLightbox>
                </Box>
                {renderSource(bookSource, bookSourceHref)}
                {bookCaption && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: bookSource ? 0.75 : 1.5 }}
                  >
                    {bookCaption}
                  </Typography>
                )}
              </Box>
            )}

            {bookVisible && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {renderArrow("down", showManuscriptArrow)}
                </Box>
              </>
            )}

            {manuscriptVisible && (
              <Box ref={manuscriptSectionRef} sx={mediaPanelSx}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Manuscript
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  The book-side narrative source before adaptation.
                </Typography>
                {renderPdfFrame(manuscriptPdf, `${title} manuscript`, () => {
                  scrollRevealIntoView(
                    manuscriptSectionRef.current,
                    manuscriptFooterRef.current,
                  );
                })}
                {renderSource(manuscriptSource, manuscriptSourceHref)}
                {manuscriptCaption && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: manuscriptSource ? 0.75 : 1.5 }}
                  >
                    {manuscriptCaption}
                  </Typography>
                )}
              </Box>
            )}

            {manuscriptVisible && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
                {renderArrow(
                  "down",
                  hasTrailer ? showTrailerArrow : showEpisodesArrow,
                )}
              </Box>
            )}

            {trailerVisible && trailerMovie && (
              <Box ref={trailerSectionRef} sx={mediaPanelSx}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Trailer
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Preview the adaptation trailer before opening the full
                  episodes draft.
                </Typography>
                <VideoLightbox
                  ref={trailerVideoRef}
                  src={withBasePath(trailerMovie)}
                  onLoadedData={() => {
                    setTrailerLoaded(true);
                  }}
                  controls
                  playsInline
                  title={`${title} trailer`}
                  caption={trailerCaption}
                  previewVideoClassName="block w-full rounded-[18px] bg-black/10 object-contain"
                  previewVideoSx={{
                    aspectRatio: trailerAspectRatio,
                    maxWidth: trailerMaxWidth,
                    maxHeight: panelFrameHeight,
                    marginInline: "auto",
                  }}
                />
                {renderSource(trailerSource, trailerSourceHref)}
                {trailerCaption && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: trailerSource ? 0.75 : 1.5 }}
                  >
                    {trailerCaption}
                  </Typography>
                )}
              </Box>
            )}

            {trailerVisible && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
                {renderArrow("down", showEpisodesArrow)}
              </Box>
            )}

            {episodesVisible && (
              <Box ref={episodesSectionRef} sx={mediaPanelSx}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Episodes Draft
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Reveal the episodic adaptation plan first, then step through
                  each episode concept one at a time.
                </Typography>
                {hasEpisodesPdf &&
                  renderPdfFrame(episodesPdf, `${title} episodes`, () => {
                    scrollRevealIntoView(
                      episodesSectionRef.current,
                      episodesFooterRef.current,
                    );
                  })}
                {renderSource(episodesSource, episodesSourceHref)}
                {episodesCaption && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: episodesSource ? 0.75 : 1.5 }}
                  >
                    {episodesCaption}
                  </Typography>
                )}
                {hasEpisodeMedia && (
                  <Stack
                    spacing={2}
                    sx={{
                      mt:
                        hasEpisodesPdf || episodesCaption || episodesSource
                          ? 2.5
                          : 0,
                    }}
                  >
                    {episodeMedia
                      .slice(0, revealedEpisodeCount)
                      .map((episode, index) => (
                        <Box key={`${episode.title}-${index}`}>
                          {index > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                py: 0.5,
                              }}
                            >
                              {renderArrow("down", true)}
                            </Box>
                          )}
                          <Box
                            ref={(node: HTMLDivElement | null) => {
                              episodeCardRefs.current[index] = node;
                            }}
                            sx={{
                              borderRadius: "20px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              backgroundColor: "rgba(15,23,42,0.24)",
                              p: 2,
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                              {getEpisodeChronologyLabel(episode)}
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{ mb: 1, fontWeight: 700 }}
                            >
                              {episode.title}
                            </Typography>
                            <VideoLightbox
                              ref={(node: HTMLVideoElement | null) => {
                                episodeVideoRefs.current[index] = node;
                              }}
                              src={withBasePath(episode.src)}
                              onLoadedData={() => {
                                scrollRevealIntoView(
                                  episodeCardRefs.current[index],
                                  episodeFooterRefs.current[index],
                                );
                              }}
                              controls
                              playsInline
                              title={`${title} ${episode.title}`}
                              caption={episode.caption}
                              previewVideoClassName="block w-full rounded-[18px] bg-black/10 object-contain"
                              previewVideoSx={{
                                aspectRatio: "16 / 9",
                                maxHeight: panelFrameHeight,
                              }}
                            />
                            {renderSource(episode.source, episode.sourceHref)}
                            {episode.caption && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: episode.source ? 0.75 : 1.5 }}
                              >
                                {episode.caption}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                  </Stack>
                )}
              </Box>
            )}
          </Stack>
        </Stack>
      </Stack>
    </AIShenaniganPanel>
  );
}
