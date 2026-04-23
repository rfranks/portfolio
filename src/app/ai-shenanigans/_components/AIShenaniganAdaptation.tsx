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
import { useTheme } from "@mui/material/styles";
import AIShenaniganPanel from "./AIShenaniganPanel";
import {
  ARROW_REVEAL_MS,
  buildCondensedChronologyIndices,
  buildRevealLabels,
  getEpisodeChronologyLabel,
  resolveCurrentRevealIndex,
  type RevealStage,
} from "../_utils/aiShenaniganAdaptationUtils";
import { useRevealScrollStabilizer } from "../_hooks/useRevealScrollStabilizer";
import type { AIShenaniganAdaptationProps } from "../_types/aiShenaniganAdaptation";
import {
  mediaControlSx,
  mediaPanelSx,
  panelChromeSx,
  restartActionSx,
} from "../_utils/workSeriesStyles";
import { EmojiGlyph, MediaCycler } from "@/components/shared";
import { useAudio } from "@/hooks/audio/useAudio";
import { rewindAndPlayAudio } from "@/utils/audio";
import { withBasePath } from "@/utils/basePath";

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
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("md"));
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
  const [transitioningTo, setTransitioningTo] = useState<RevealStage | null>(null);
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
  const { clearScrollStabilizers, scrollRevealIntoView } = useRevealScrollStabilizer({
    mobileFooterMediaQuery: "(max-width:899.95px)",
  });
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
  const hasTrailer = Boolean(trailerMovie);
  const isTrailerPortrait = trailerOrientation === "portrait";
  const trailerAspectRatio = isTrailerPortrait ? "9 / 16" : "16 / 9";
  const trailerMaxWidth = isTrailerPortrait ? 420 : undefined;
  const mobileInfoPanelHeight = "clamp(220px, 30dvh, 320px)";
  const mobileSplitGap = "20px";
  const desktopInfoPanelBasis = "30%";
  const desktopInfoPanelMaxWidth = "36%";
  const desktopMediaPanelHeight = "100%";
  const hasEpisodesPdf = Boolean(episodesPdf);

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

  const revealLabels = buildRevealLabels({
    bookVisible,
    manuscriptVisible,
    showManuscriptArrow,
    hasTrailer,
    trailerVisible,
    showTrailerArrow,
    episodesVisible,
    showEpisodesArrow,
    revealedEpisodeCount,
    episodeMedia,
  });

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
    onMediaActivate?: () => void,
    onChevronPrevious?: () => void,
    onChevronNext?: () => void,
    disableChevronPrevious?: boolean,
    disableChevronNext?: boolean,
    loopNavigation?: boolean,
    onLoopNavigation?: () => void,
    disableLoopNavigation?: boolean,
  ) => {
    return (
      <Box sx={{ mt: 1.25, flex: 1, minHeight: 0, display: "flex" }}>
        <MediaCycler
          spacing={0}
          singlePanel
          transitionMs={260}
          showChevronNavigation
          compactMetadataOnSmallScreens
          smallScreenInfoBlurb={blurb}
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
              onMediaActivate,
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
              pdfOpenLinkLabel: "Open document",
            },
          ]}
        />
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
    target: "book" | "manuscript" | "trailer" | "episodes" | `episode-${number}`,
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
    const targetsEpisodes = target === "episodes" || target.startsWith("episode-");
    const targetsTrailer = hasTrailer && (target === "trailer" || targetsEpisodes);
    setShowTrailerArrow(hasTrailer && target !== "book" && target !== "manuscript");
    setTrailerVisible(targetsTrailer);
    setShowEpisodesArrow(
      hasTrailer ? targetsEpisodes : target === "episodes" || target.startsWith("episode-"),
    );
    setEpisodesVisible(targetsEpisodes);

    if (target === "book") {
      setStage("book");
      setRevealedEpisodeCount(0);
      stopMediaVideos();
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(bookCoverRef.current || bookSectionRef.current, bookFooterRef.current);
      });
      return;
    }

    if (target === "manuscript") {
      setStage("manuscript");
      setRevealedEpisodeCount(0);
      stopMediaVideos();
      window.requestAnimationFrame(() => {
        scrollRevealIntoView(manuscriptSectionRef.current, manuscriptFooterRef.current);
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
        scrollRevealIntoView(episodesSectionRef.current, episodesFooterRef.current);
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
    const useCondensedChronology = visibleLabels.length > 3;
    const currentIndex = resolveCurrentRevealIndex(visibleLabels);
    const displayedIndices = useCondensedChronology
      ? buildCondensedChronologyIndices({
          labelCount: visibleLabels.length,
          currentIndex,
        })
      : visibleLabels.map((_, index) => index);

    return displayedIndices.map((index, chipPosition) => {
      const item = visibleLabels[index];
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
    if (!isSmDown || bookVisible) {
      return;
    }

    setBookVisible(true);
    setStage("book");
  }, [bookVisible, isSmDown]);

  useEffect(() => {
    if (!bookVisible || !bookCoverLoaded) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      scrollRevealIntoView(bookCoverRef.current || bookSectionRef.current, bookFooterRef.current);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [bookCoverLoaded, bookVisible, scrollRevealIntoView]);

  useEffect(() => {
    if (!pendingTrailerReveal || !trailerVisible || stage !== "trailer" || !trailerLoaded) {
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
  }, [pendingTrailerReveal, trailerVisible, stage, trailerLoaded, scrollRevealIntoView]);

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
        scrollRevealIntoView(manuscriptSectionRef.current, manuscriptFooterRef.current);
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
        scrollRevealIntoView(episodesSectionRef.current, episodesFooterRef.current);
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

  const activeEpisodeIndex =
    stage === "episodes" && revealedEpisodeCount > 0 ? revealedEpisodeCount - 1 : -1;

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
                      <Box>
                        {stage !== "intro" && renderNextAction() && (
                          <IconButton
                            aria-label="Start over"
                            onClick={resetReveal}
                            sx={restartActionSx}
                          >
                            <Loop fontSize="small" />
                          </IconButton>
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
            {bookVisible && stage === "book" && (
              <Box ref={bookSectionRef} sx={mediaPanelSx}>
                {isSmDown ? (
                  renderMobilePanelHeader("Book cover", bookSource)
                ) : (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Book cover
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Start with the originating book-side artifact.
                    </Typography>
                  </>
                )}
                <Box
                  ref={bookCoverRef}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    flex: "1 1 auto",
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <MediaCycler
                    spacing={0}
                    singlePanel
                    transitionMs={260}
                    showChevronNavigation
                    compactMetadataOnSmallScreens
                    smallScreenInfoBlurb={blurb}
                    showCompactInfoButton={false}
                    navigationControlSx={mediaControlSx}
                    expandControlSx={mediaControlSx}
                    disableChevronPrevious
                    onChevronNext={() => {
                      if (transitioningTo) {
                        return;
                      }

                      if (!manuscriptVisible) {
                        handleRevealManuscript();
                        return;
                      }

                      handleChronologySelect("book");
                    }}
                    disableChevronNext={transitioningTo !== null}
                    stackSx={{
                      flexGrow: 1,
                      minHeight: 0,
                      height: "100%",
                      overflow: "hidden",
                    }}
                    items={[
                      {
                        key: "book-cover",
                        title: isSmDown ? title : "",
                        description: isSmDown
                          ? bookSource?.trim()
                            ? `Book cover • ${bookSource.trim()}`
                            : "Book cover"
                          : undefined,
                        mediaType: "image",
                        mediaUrl: withBasePath(bookCoverImage),
                        mediaAlt: `${title} book cover`,
                        mediaLightboxTitle: `${title} — Book Cover`,
                        lightboxCaption: bookCaption || bookSource,
                        mediaCaption: bookCaption,
                        mediaSource: bookSource,
                        mediaSourceHref: bookSourceHref,
                        onMediaLoaded: () => {
                          setBookCoverLoaded(true);
                        },
                        onMediaActivate: () => {
                          if (transitioningTo) {
                            return;
                          }

                          if (!manuscriptVisible) {
                            handleRevealManuscript();
                            return;
                          }

                          handleChronologySelect("book");
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
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          maxWidth: { md: 320, lg: 380 },
                          marginInline: "auto",
                        },
                        imageWidth: 1400,
                        imageHeight: 900,
                        imageClassName: "rounded-[22px] bg-black/10 object-contain",
                        imageStyle: {
                          width: "100%",
                          height: "auto",
                          maxWidth: "100%",
                          maxHeight: "100%",
                          marginInline: "auto",
                          aspectRatio: "3 / 4",
                        },
                      },
                    ]}
                  />
                </Box>
              </Box>
            )}

            {manuscriptVisible && stage === "manuscript" && (
              <Box ref={manuscriptSectionRef} sx={mediaPanelSx}>
                {isSmDown ? (
                  renderMobilePanelHeader("Manuscript", manuscriptSource)
                ) : (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Manuscript
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      The book-side narrative source before adaptation.
                    </Typography>
                  </>
                )}
                {renderPdfFrame(
                  manuscriptPdf,
                  `${title} manuscript`,
                  () => {
                    scrollRevealIntoView(manuscriptSectionRef.current, manuscriptFooterRef.current);
                  },
                  () => {
                    if (transitioningTo) {
                      return;
                    }

                    if (hasTrailer && !trailerVisible) {
                      handleRevealTrailer();
                      return;
                    }

                    if (!episodesVisible) {
                      handleRevealEpisodes();
                      return;
                    }

                    handleChronologySelect("manuscript");
                  },
                  () => {
                    handleChronologySelect("book");
                  },
                  () => {
                    if (transitioningTo) {
                      return;
                    }

                    if (hasTrailer && !trailerVisible) {
                      handleRevealTrailer();
                      return;
                    }

                    if (!episodesVisible) {
                      handleRevealEpisodes();
                      return;
                    }

                    handleChronologySelect("manuscript");
                  },
                  transitioningTo !== null,
                  transitioningTo !== null,
                  false,
                  undefined,
                  transitioningTo !== null,
                )}
                {!isSmDown && renderSource(manuscriptSource, manuscriptSourceHref)}
                {!isSmDown && manuscriptCaption && (
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

            {trailerVisible && trailerMovie && stage === "trailer" && (
              <Box ref={trailerSectionRef} sx={mediaPanelSx}>
                {isSmDown ? (
                  renderMobilePanelHeader("Trailer", trailerSource)
                ) : (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Trailer
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Preview the adaptation trailer before opening the full episodes draft.
                    </Typography>
                  </>
                )}
                <MediaCycler
                  spacing={0}
                  singlePanel
                  transitionMs={260}
                  showChevronNavigation
                  compactMetadataOnSmallScreens
                  smallScreenInfoBlurb={blurb}
                  showCompactInfoButton={false}
                  navigationControlSx={mediaControlSx}
                  expandControlSx={mediaControlSx}
                  onChevronPrevious={() => {
                    handleChronologySelect("manuscript");
                  }}
                  onChevronNext={() => {
                    if (transitioningTo) {
                      return;
                    }

                    if (!episodesVisible) {
                      handleRevealEpisodes();
                      return;
                    }

                    handleChronologySelect("trailer");
                  }}
                  disableChevronPrevious={transitioningTo !== null}
                  disableChevronNext={transitioningTo !== null}
                  stackSx={{
                    flexGrow: 1,
                    minHeight: 0,
                    height: "100%",
                    overflow: "hidden",
                  }}
                  items={[
                    {
                      key: "trailer",
                      title: isSmDown ? title : "",
                      description: isSmDown
                        ? trailerSource?.trim()
                          ? `Trailer • ${trailerSource.trim()}`
                          : "Trailer"
                        : undefined,
                      mediaType: "video",
                      mediaUrl: withBasePath(trailerMovie),
                      mediaLightboxTitle: `${title} trailer`,
                      mediaCaption: trailerCaption,
                      mediaSource: trailerSource,
                      mediaSourceHref: trailerSourceHref,
                      videoRef: trailerVideoRef,
                      controls: true,
                      playsInline: true,
                      onMediaLoaded: () => {
                        setTrailerLoaded(true);
                      },
                      onMediaActivate: () => {
                        if (transitioningTo) {
                          return;
                        }

                        if (!episodesVisible) {
                          handleRevealEpisodes();
                          return;
                        }

                        handleChronologySelect("trailer");
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
                      previewVideoClassName:
                        "block w-full rounded-[18px] bg-black/10 object-contain",
                      previewVideoSx: {
                        aspectRatio: trailerAspectRatio,
                        maxWidth: trailerMaxWidth,
                        maxHeight: "100%",
                        height: "100%",
                        marginInline: "auto",
                      },
                    },
                  ]}
                />
              </Box>
            )}

            {episodesVisible && stage === "episodes" && activeEpisodeIndex < 0 && (
              <Box ref={episodesSectionRef} sx={mediaPanelSx}>
                {isSmDown ? (
                  renderMobilePanelHeader("Episodes Draft", episodesSource)
                ) : (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Episodes Draft
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Reveal the episodic adaptation plan first, then step through each episode
                      concept one at a time.
                    </Typography>
                  </>
                )}
                {hasEpisodesPdf &&
                  renderPdfFrame(
                    episodesPdf,
                    `${title} episodes`,
                    () => {
                      scrollRevealIntoView(episodesSectionRef.current, episodesFooterRef.current);
                    },
                    () => {
                      if (transitioningTo) {
                        return;
                      }

                      if (revealedEpisodeCount < episodeMedia.length) {
                        handleRevealNextEpisode();
                        return;
                      }

                      handleChronologySelect("episodes");
                    },
                    () => {
                      if (hasTrailer) {
                        handleChronologySelect("trailer");
                        return;
                      }

                      handleChronologySelect("manuscript");
                    },
                    () => {
                      if (transitioningTo) {
                        return;
                      }

                      if (revealedEpisodeCount < episodeMedia.length) {
                        handleRevealNextEpisode();
                        return;
                      }

                      handleChronologySelect("episodes");
                    },
                    transitioningTo !== null,
                    transitioningTo !== null || episodeMedia.length === 0,
                    episodeMedia.length === 0,
                    () => {
                      handleChronologySelect("book");
                    },
                    transitioningTo !== null,
                  )}
                {!isSmDown && renderSource(episodesSource, episodesSourceHref)}
                {!isSmDown && episodesCaption && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: episodesSource ? 0.75 : 1.5 }}
                  >
                    {episodesCaption}
                  </Typography>
                )}
              </Box>
            )}

            {episodesVisible &&
              stage === "episodes" &&
              activeEpisodeIndex >= 0 &&
              episodeMedia[activeEpisodeIndex] && (
                <Box
                  ref={(node: HTMLDivElement | null) => {
                    episodeCardRefs.current[activeEpisodeIndex] = node;
                  }}
                  sx={{
                    ...mediaPanelSx,
                    borderRadius: "20px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(15,23,42,0.24)",
                  }}
                >
                  {isSmDown ? (
                    renderMobilePanelHeader(
                      getEpisodeChronologyLabel(episodeMedia[activeEpisodeIndex]),
                      episodeMedia[activeEpisodeIndex].source,
                    )
                  ) : (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {getEpisodeChronologyLabel(episodeMedia[activeEpisodeIndex])}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1, fontWeight: 700 }}>
                        {episodeMedia[activeEpisodeIndex].title}
                      </Typography>
                    </>
                  )}
                  <MediaCycler
                    spacing={0}
                    singlePanel
                    transitionMs={260}
                    showChevronNavigation
                    compactMetadataOnSmallScreens
                    smallScreenInfoBlurb={blurb}
                    showCompactInfoButton={false}
                    navigationControlSx={mediaControlSx}
                    expandControlSx={mediaControlSx}
                    onChevronPrevious={() => {
                      if (transitioningTo) {
                        return;
                      }

                      if (activeEpisodeIndex > 0) {
                        handleChronologySelect(`episode-${activeEpisodeIndex - 1}`);
                        return;
                      }

                      handleChronologySelect("episodes");
                    }}
                    onChevronNext={() => {
                      if (transitioningTo) {
                        return;
                      }

                      if (revealedEpisodeCount < episodeMedia.length) {
                        handleRevealNextEpisode();
                      }
                    }}
                    disableChevronPrevious={transitioningTo !== null}
                    disableChevronNext={
                      transitioningTo !== null || activeEpisodeIndex >= episodeMedia.length - 1
                    }
                    loopNavigation={
                      activeEpisodeIndex === episodeMedia.length - 1 &&
                      revealedEpisodeCount === episodeMedia.length
                    }
                    onLoopNavigation={() => {
                      handleChronologySelect("book");
                    }}
                    disableLoopNavigation={transitioningTo !== null}
                    stackSx={{
                      flexGrow: 1,
                      minHeight: 0,
                      height: "100%",
                      overflow: "hidden",
                    }}
                    items={[
                      {
                        key: `episode-media-${activeEpisodeIndex}`,
                        title: isSmDown ? title : "",
                        description: undefined,
                        mediaType: "video",
                        mediaUrl: withBasePath(episodeMedia[activeEpisodeIndex].src),
                        mediaLightboxTitle: `${title} ${episodeMedia[activeEpisodeIndex].title}`,
                        mediaCaption: episodeMedia[activeEpisodeIndex].caption,
                        mediaSource: episodeMedia[activeEpisodeIndex].source,
                        mediaSourceHref: episodeMedia[activeEpisodeIndex].sourceHref,
                        videoRef: (node: HTMLVideoElement | null) => {
                          episodeVideoRefs.current[activeEpisodeIndex] = node;
                        },
                        controls: true,
                        playsInline: true,
                        onMediaLoaded: () => {
                          scrollRevealIntoView(
                            episodeCardRefs.current[activeEpisodeIndex],
                            episodeFooterRefs.current[activeEpisodeIndex],
                          );
                        },
                        onMediaActivate: () => {
                          if (transitioningTo) {
                            return;
                          }

                          const hasNextEpisodeToReveal = revealedEpisodeCount < episodeMedia.length;

                          if (hasNextEpisodeToReveal) {
                            handleRevealNextEpisode();
                            return;
                          }

                          handleChronologySelect(`episode-${activeEpisodeIndex}`);
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
                        previewVideoClassName:
                          "block w-full rounded-[18px] bg-black/10 object-contain",
                        previewVideoSx: {
                          aspectRatio: "16 / 9",
                          maxHeight: "100%",
                          height: "100%",
                        },
                      },
                    ]}
                  />
                </Box>
              )}
          </Stack>
        </Stack>
      </Stack>
    </AIShenaniganPanel>
  );
}
