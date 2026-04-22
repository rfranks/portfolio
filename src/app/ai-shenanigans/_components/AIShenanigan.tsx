"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Loop from "@mui/icons-material/Loop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import AIShenaniganAdaptation from "./AIShenaniganAdaptation";
import AIShenaniganPalmReading from "./AIShenaniganPalmReading";
import AIShenaniganSongRecording from "./AIShenaniganSongRecording";
import AIShenaniganWorkSeries from "./AIShenaniganWorkSeries";
import AIShenaniganPanel from "./AIShenaniganPanel";
import { EmojiGlyph, MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { useAudio } from "@/hooks/audio/useAudio";
import { withBasePath } from "@/utils/basePath";
import { rewindAndPlayAudio } from "@/utils/audio";

export type AIShenaniganMovieOrientation = "landscape" | "portrait" | undefined;
export type AIShenaniganType =
  | "default"
  | "book-to-limited-series"
  | "work-to-series-adaptation"
  | "palmylyzer-pro"
  | "song-recording";

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
  movieRendering2?: string | null;
  movieSource2?: string;
  movieSourceHref2?: string;
  movieCaption2?: string;
  bookCoverImage?: string;
  bookSource?: string;
  bookSourceHref?: string;
  bookCaption?: string;
  manuscriptPdf?: string;
  manuscriptSource?: string;
  manuscriptSourceHref?: string;
  manuscriptCaption?: string;
  trailerMovie?: string;
  trailerOrientation?: AIShenaniganMovieOrientation;
  trailerSource?: string;
  trailerSourceHref?: string;
  trailerCaption?: string;
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
  workParts?: Array<{
    src: string;
    title?: string;
    source?: string;
    sourceHref?: string;
    caption?: string;
  }>;
  seriesMovie?: string;
  seriesSource?: string;
  seriesSourceHref?: string;
  seriesCaption?: string;
  seriesParts?: Array<{
    src: string;
    title?: string;
    source?: string;
    sourceHref?: string;
    caption?: string;
  }>;
  rawImage?: string;
  rawSource?: string;
  rawSourceHref?: string;
  rawCaption?: string;
  analyzedImage?: string;
  analyzedSource?: string;
  analyzedSourceHref?: string;
  analyzedCaption?: string;
  palmLineAnalysisImage?: string;
  palmLineAnalysisSource?: string;
  palmLineAnalysisSourceHref?: string;
  palmLineAnalysisCaption?: string;
  palmReadingTitle?: string;
  palmReadingText?: string;
  palmReadingMarkdownPath?: string;
  palmReadingSource?: string;
  palmReadingSourceHref?: string;
  songAlbumImage?: string;
  songAlbumSource?: string;
  songAlbumSourceHref?: string;
  songAlbumCaption?: string;
  songAudio?: string;
  songAudioSource?: string;
  songAudioSourceHref?: string;
  songAudioCaption?: string;
  songWrittenBy?: string;
  songPerformedBy?: string;
  songLyricsMarkdownPath?: string;
  songLyricsSource?: string;
  songLyricsSourceHref?: string;
};

type RevealStage = "intro" | "realistic" | "stylized" | "movie" | "alternateMovie";
const REVEAL_TRANSITION_MS = 0;

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
        trailerMovie={props.trailerMovie}
        trailerOrientation={props.trailerOrientation}
        trailerSource={props.trailerSource}
        trailerSourceHref={props.trailerSourceHref}
        trailerCaption={props.trailerCaption}
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
        workParts={props.workParts}
        seriesMovie={props.seriesMovie || props.movieRendering || ""}
        seriesSource={props.seriesSource || props.movieSource}
        seriesSourceHref={props.seriesSourceHref || props.movieSourceHref}
        seriesCaption={props.seriesCaption || props.movieCaption}
        seriesParts={props.seriesParts}
      />
    );
  }

  if (props.type === "palmylyzer-pro") {
    return (
      <AIShenaniganPalmReading
        rank={props.rank}
        title={props.title}
        blurb={props.blurb}
        intentToCopyright={props.intentToCopyright}
        rightsNotice={props.rightsNotice}
        rawImage={props.rawImage || props.realisticImage}
        rawSource={props.rawSource || props.realisticSource}
        rawSourceHref={props.rawSourceHref || props.realisticSourceHref}
        rawCaption={props.rawCaption || props.realisticCaption}
        analyzedImage={props.analyzedImage || props.stylizedRendering || ""}
        analyzedSource={props.analyzedSource || props.stylizedSource}
        analyzedSourceHref={props.analyzedSourceHref || props.stylizedSourceHref}
        analyzedCaption={props.analyzedCaption || props.stylizedCaption}
        palmLineAnalysisImage={props.palmLineAnalysisImage || props.movieRendering || ""}
        palmLineAnalysisSource={props.palmLineAnalysisSource || props.movieSource}
        palmLineAnalysisSourceHref={props.palmLineAnalysisSourceHref || props.movieSourceHref}
        palmLineAnalysisCaption={props.palmLineAnalysisCaption || props.movieCaption}
        palmReadingTitle={props.palmReadingTitle}
        palmReadingText={props.palmReadingText || props.blurb}
        palmReadingMarkdownPath={props.palmReadingMarkdownPath}
        palmReadingSource={props.palmReadingSource}
        palmReadingSourceHref={props.palmReadingSourceHref}
      />
    );
  }

  if (props.type === "song-recording") {
    return (
      <AIShenaniganSongRecording
        rank={props.rank}
        title={props.title}
        blurb={props.blurb}
        intentToCopyright={props.intentToCopyright}
        rightsNotice={props.rightsNotice}
        songAlbumImage={props.songAlbumImage || props.realisticImage}
        songAlbumSource={props.songAlbumSource || props.realisticSource}
        songAlbumSourceHref={props.songAlbumSourceHref || props.realisticSourceHref}
        songAlbumCaption={props.songAlbumCaption || props.realisticCaption}
        songAudio={props.songAudio || ""}
        songAudioSource={props.songAudioSource}
        songAudioSourceHref={props.songAudioSourceHref}
        songAudioCaption={props.songAudioCaption}
        songWrittenBy={props.songWrittenBy}
        songPerformedBy={props.songPerformedBy}
        lyricsMarkdownPath={props.songLyricsMarkdownPath}
        lyricsSource={props.songLyricsSource}
        lyricsSourceHref={props.songLyricsSourceHref}
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
  movieRendering2,
  movieSource2,
  movieSourceHref2,
  movieCaption2,
}: AIShenaniganProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [isInfoPanelMinimized, setIsInfoPanelMinimized] = useState(false);
  const [stage, setStage] = useState<RevealStage>("intro");
  const [realisticVisible, setRealisticVisible] = useState(false);
  const [showStylizedArrow, setShowStylizedArrow] = useState(false);
  const [showMovieArrow, setShowMovieArrow] = useState(false);
  const [showAlternateMovieArrow, setShowAlternateMovieArrow] = useState(false);
  const [stylizedVisible, setStylizedVisible] = useState(false);
  const [movieVisible, setMovieVisible] = useState(false);
  const [alternateMovieVisible, setAlternateMovieVisible] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState<RevealStage | null>(null);
  const realisticSectionRef = useRef<HTMLDivElement | null>(null);
  const stylizedSectionRef = useRef<HTMLDivElement | null>(null);
  const motionSectionRef = useRef<HTMLDivElement | null>(null);
  const alternateMotionSectionRef = useRef<HTMLDivElement | null>(null);
  const motionVideoRef = useRef<HTMLVideoElement | null>(null);
  const alternateMotionVideoRef = useRef<HTMLVideoElement | null>(null);
  const stylizedTimeoutRef = useRef<number | null>(null);
  const movieTimeoutRef = useRef<number | null>(null);
  const alternateMovieTimeoutRef = useRef<number | null>(null);
  const inspirationSfx = useAudio("/audio/highUp.ogg");
  const stylizedSfx = useAudio("/audio/powerUp3.ogg");
  const motionSfx = useAudio("/audio/whoosh.ogg");
  const rewindSfx = useAudio("/audio/phaserDown2.ogg");
  const hasStylized = Boolean(stylizedRendering);
  const primaryMovieRendering = movieRendering || movieRendering2 || null;
  const primaryMovieSource = movieRendering ? movieSource : movieSource2;
  const primaryMovieSourceHref = movieRendering ? movieSourceHref : movieSourceHref2;
  const primaryMovieCaption = movieRendering ? movieCaption : movieCaption2;
  const secondaryMovieRendering = movieRendering && movieRendering2 ? movieRendering2 : null;
  const secondaryMovieSource = movieRendering && movieRendering2 ? movieSource2 : undefined;
  const secondaryMovieSourceHref = movieRendering && movieRendering2 ? movieSourceHref2 : undefined;
  const secondaryMovieCaption = movieRendering && movieRendering2 ? movieCaption2 : undefined;
  const hasMovie = Boolean(primaryMovieRendering);
  const hasAlternateMovie = Boolean(secondaryMovieRendering);
  const isPortrait = orientation === "portrait";
  const hasVisibleMedia = realisticVisible;
  const stillAspectRatio = isPortrait ? "3 / 4" : "4 / 3";
  const mobileInfoPanelHeight = "clamp(220px, 30dvh, 320px)";
  const mobileSplitGap = "20px";
  const desktopMediaPanelHeight = "100%";
  const desktopInfoPanelBasis = "30%";
  const desktopInfoPanelMaxWidth = "36%";
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
  const mediaControlSx = (theme: Theme) => ({
    color: theme.palette.common.black,
    borderColor: theme.palette.common.black,
    bgcolor: theme.palette.common.white,
    "&:hover": {
      bgcolor: theme.palette.common.white,
    },
    "&.Mui-disabled": {
      color: alpha(theme.palette.common.black, 0.36),
      borderColor: alpha(theme.palette.common.black, 0.36),
      bgcolor: alpha(theme.palette.common.white, 0.8),
    },
  });
  const restartActionSx = (theme: Theme) => ({
    border: "1px solid",
    ...mediaControlSx(theme),
  });
  const mediaPanelSx = {
    ...panelChromeSx,
    p: 2.5,
    height: "100%",
    minHeight: 0,
  } as const;
  const realisticPanelSx = {
    ...mediaPanelSx,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
  } as const;
  const stylizedPanelSx = {
    ...mediaPanelSx,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
  } as const;
  const moviePanelSx = {
    ...mediaPanelSx,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
  } as const;
  const mediaAssetFrameSx = {
    mt: 0.2,
    mb: 0.1,
    width: "100%",
    flex: "1 1 auto",
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  } as const;
  const realisticAssetFrameSx = {
    mt: 0.25,
    mb: 0.35,
    width: "100%",
    flex: "1 1 auto",
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  } as const;
  const stylizedAssetFrameSx = {
    mt: 0.2,
    mb: 0.1,
    width: "100%",
    flex: "1 1 auto",
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
    if (alternateMovieTimeoutRef.current) {
      window.clearTimeout(alternateMovieTimeoutRef.current);
      alternateMovieTimeoutRef.current = null;
    }
  };

  const stopVideo = useCallback((videoRef: { current: HTMLVideoElement | null }) => {
    if (!videoRef.current) {
      return;
    }
    videoRef.current.pause();
    videoRef.current.muted = false;
    videoRef.current.currentTime = 0;
  }, []);

  const stopMotionVideo = useCallback(() => {
    stopVideo(motionVideoRef);
    stopVideo(alternateMotionVideoRef);
  }, [stopVideo]);

  const revealLabels = useMemo(() => {
    const applicableStages: Array<{
      key: "realistic" | "stylized" | "movie" | "alternateMovie";
      title: string;
      active: boolean;
      reached: boolean;
    }> = [
      {
        key: "realistic",
        title: "Realistic source",
        active: realisticVisible,
        reached: realisticVisible,
      },
    ];

    if (hasStylized) {
      applicableStages.push({
        key: "stylized",
        title: "Stylized rendering",
        active: stylizedVisible || showStylizedArrow,
        reached: stylizedVisible,
      });
    }

    if (hasMovie) {
      applicableStages.push({
        key: "movie",
        title: "Motion rendering",
        active: movieVisible || (hasStylized && showMovieArrow),
        reached: movieVisible,
      });
    }

    if (hasAlternateMovie) {
      applicableStages.push({
        key: "alternateMovie",
        title: "Alternate motion rendering",
        active: alternateMovieVisible || showAlternateMovieArrow,
        reached: alternateMovieVisible,
      });
    }

    return applicableStages.map((stage, index) => ({
      ...stage,
      label: `Step ${index + 1}: ${stage.title}`,
    }));
  }, [
    hasStylized,
    hasAlternateMovie,
    hasMovie,
    alternateMovieVisible,
    movieVisible,
    realisticVisible,
    showAlternateMovieArrow,
    showMovieArrow,
    showStylizedArrow,
    stylizedVisible,
  ]);

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

  const renderNextAction = () => {
    if (stage === "intro") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealRealistic}
          disabled={transitioningTo !== null}
          endIcon={<EmojiGlyph glyph="💡" slot="end" />}
        >
          Reveal Inspiration
        </Button>
      );
    }

    if (stage === "realistic" && hasStylized) {
      return (
        <Button
          variant="contained"
          onClick={handleRevealStylized}
          disabled={transitioningTo !== null}
          endIcon={<EmojiGlyph glyph="🎨" slot="end" />}
        >
          Reveal Stylized
        </Button>
      );
    }

    if ((stage === "realistic" && !hasStylized && hasMovie) || (stage === "stylized" && hasMovie)) {
      return (
        <Button
          variant="contained"
          onClick={handleRevealMovie}
          disabled={transitioningTo !== null}
          endIcon={<EmojiGlyph glyph="🎬" slot="end" />}
        >
          Reveal Motion
        </Button>
      );
    }

    if (stage === "movie" && hasAlternateMovie) {
      return (
        <Button
          variant="contained"
          onClick={handleRevealAlternateMovie}
          disabled={transitioningTo !== null}
          endIcon={<EmojiGlyph glyph="🎞️" slot="end" />}
        >
          Reveal Alternate Motion
        </Button>
      );
    }

    return null;
  };

  const handleChronologySelect = (
    target: "realistic" | "stylized" | "movie" | "alternateMovie",
  ) => {
    if (transitioningTo !== null) {
      return;
    }

    rewindAndPlayAudio(rewindSfx, { volume: 0.24 });
    clearPendingTransitions();
    setTransitioningTo(null);
    setRealisticVisible(true);
    setShowStylizedArrow(hasStylized && target !== "realistic");
    setShowMovieArrow(target === "movie" || target === "alternateMovie");
    setShowAlternateMovieArrow(target === "alternateMovie");
    setStylizedVisible(hasStylized && target !== "realistic");
    setMovieVisible(target === "movie" || target === "alternateMovie");
    setAlternateMovieVisible(target === "alternateMovie");
    setStage(target);

    if (target !== "movie" && target !== "alternateMovie") {
      stopMotionVideo();
    }
  };

  const renderChronologyChips = (scope: "main" | "panel") => {
    const visibleLabels = revealLabels;
    const useCondensedChronology = visibleLabels.length > 3;

    const activeIndex = visibleLabels.findIndex((item) => item.active);
    let currentIndex = activeIndex;

    if (currentIndex === -1) {
      for (let index = visibleLabels.length - 1; index >= 0; index -= 1) {
        if (visibleLabels[index]?.reached) {
          currentIndex = index;
          break;
        }
      }
    }

    if (currentIndex === -1) {
      currentIndex = 0;
    }

    const firstIndex = 0;
    const lastIndex = Math.max(visibleLabels.length - 1, 0);
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
      : visibleLabels.map((_, index) => index);

    return displayedIndices.map((index, chipPosition) => {
      const item = visibleLabels[index];
      if (!item) {
        return null;
      }

      const hasNextChip = chipPosition < displayedIndices.length - 1;

      return (
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
                    backgroundColor: (theme) =>
                      theme.palette.mode === "light"
                        ? alpha(theme.palette.grey[500], 0.08)
                        : "rgba(148,163,184,0.06)",
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
    if (!isSmDown || realisticVisible) {
      return;
    }

    setStage("realistic");
    setRealisticVisible(true);
  }, [isSmDown, realisticVisible]);

  useEffect(() => {
    const isMovieStage = stage === "movie";
    const isAlternateMovieStage = stage === "alternateMovie";
    if (!isMovieStage && !isAlternateMovieStage) {
      stopMotionVideo();
      return;
    }

    const video = isAlternateMovieStage ? alternateMotionVideoRef.current : motionVideoRef.current;
    const inactiveVideoRef = isAlternateMovieStage ? motionVideoRef : alternateMotionVideoRef;
    stopVideo(inactiveVideoRef);

    if (!video) {
      return;
    }

    video.muted = false;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Ignore autoplay failures; controls remain available.
    });
  }, [stage, stopMotionVideo, stopVideo]);

  useEffect(() => {
    return () => {
      clearPendingTransitions();
    };
  }, []);

  const resetReveal = () => {
    rewindAndPlayAudio(rewindSfx, { volume: 0.24 });
    clearPendingTransitions();
    setTransitioningTo(null);
    setStage("intro");
    setRealisticVisible(false);
    setShowStylizedArrow(false);
    setShowMovieArrow(false);
    setShowAlternateMovieArrow(false);
    setStylizedVisible(false);
    setMovieVisible(false);
    setAlternateMovieVisible(false);
    stopMotionVideo();
  };

  const handleRevealRealistic = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("realistic");
    rewindAndPlayAudio(inspirationSfx, { volume: 0.32 });
    setRealisticVisible(true);
    setStage("realistic");
    setTransitioningTo(null);
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
    }, REVEAL_TRANSITION_MS);
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
      setAlternateMovieVisible(false);
      setShowAlternateMovieArrow(false);
      setStage("movie");
      setTransitioningTo(null);
      movieTimeoutRef.current = null;
    }, REVEAL_TRANSITION_MS);
  };

  const handleRevealAlternateMovie = () => {
    if (transitioningTo || !hasAlternateMovie) {
      return;
    }
    setTransitioningTo("alternateMovie");
    rewindAndPlayAudio(motionSfx, { volume: 0.3 });
    setShowAlternateMovieArrow(true);
    alternateMovieTimeoutRef.current = window.setTimeout(() => {
      setAlternateMovieVisible(true);
      setStage("alternateMovie");
      setTransitioningTo(null);
      alternateMovieTimeoutRef.current = null;
    }, REVEAL_TRANSITION_MS);
  };

  const handleRealisticMediaActivate = () => {
    if (transitioningTo) {
      return;
    }

    if (hasStylized && !stylizedVisible) {
      handleRevealStylized();
      return;
    }

    if (!hasStylized && hasMovie && !movieVisible) {
      handleRevealMovie();
      return;
    }

    handleChronologySelect("realistic");
  };

  const handleStylizedMediaActivate = () => {
    if (transitioningTo) {
      return;
    }

    if (hasMovie && !movieVisible) {
      handleRevealMovie();
      return;
    }

    handleChronologySelect("stylized");
  };

  const handleMovieMediaActivate = () => {
    if (transitioningTo) {
      return;
    }

    if (hasAlternateMovie && !alternateMovieVisible) {
      handleRevealAlternateMovie();
      return;
    }

    handleChronologySelect("movie");
  };

  const buildMobilePanelSubtext = (subtitle: string, source?: string) =>
    source?.trim() ? `${subtitle} • ${source.trim()}` : subtitle;

  const realisticMediaItem: MediaCyclerItem | null = realisticVisible
    ? {
        key: "realistic",
        title: isSmDown ? title : "Realistic source",
        description: isSmDown
          ? buildMobilePanelSubtext("Realistic source", realisticSource)
          : "The grounded starting point.",
        mediaType: "image",
        mediaUrl: withBasePath(realisticImage),
        mediaAlt: `${title} realistic source`,
        mediaLightboxTitle: `${title} — Realistic Source`,
        lightboxCaption: realisticCaption || realisticSource,
        mediaCaption: realisticCaption,
        mediaSource: realisticSource,
        mediaSourceHref: realisticSourceHref,
        panelRef: realisticSectionRef,
        panelSx: {
          ...realisticPanelSx,
          minWidth: 0,
          opacity: 1,
          transform: "translate3d(0, 0, 0)",
          transition:
            "opacity 320ms ease, transform 360ms cubic-bezier(.2,.8,.2,1), flex-basis 360ms cubic-bezier(.2,.8,.2,1), max-width 360ms cubic-bezier(.2,.8,.2,1)",
        },
        assetFrameSx: realisticAssetFrameSx,
        imageWidth: 1200,
        imageHeight: 900,
        imageClassName: "rounded-[22px] bg-black/10 object-contain",
        imageStyle: {
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          aspectRatio: stillAspectRatio,
          marginInline: "auto",
        },
        onSelect: () => {
          handleChronologySelect("realistic");
        },
        onMediaActivate: handleRealisticMediaActivate,
      }
    : null;

  const stylizedMediaItem: MediaCyclerItem | null =
    stylizedVisible && stylizedRendering
      ? {
          key: "stylized",
          title: isSmDown ? title : "Stylized rendering",
          description: isSmDown
            ? buildMobilePanelSubtext("Stylized rendering", stylizedSource)
            : "Push the portrait into caricature.",
          mediaType: "image",
          mediaUrl: withBasePath(stylizedRendering),
          mediaAlt: `${title} stylized rendering`,
          mediaLightboxTitle: `${title} — Stylized Rendering`,
          lightboxCaption: stylizedCaption || stylizedSource,
          mediaCaption: stylizedCaption,
          mediaSource: stylizedSource,
          mediaSourceHref: stylizedSourceHref,
          panelRef: stylizedSectionRef,
          panelSx: {
            ...stylizedPanelSx,
            minWidth: 0,
            opacity: 1,
            transform: "translate3d(0, 0, 0)",
            transition:
              "opacity 320ms ease, transform 360ms cubic-bezier(.2,.8,.2,1), flex-basis 360ms cubic-bezier(.2,.8,.2,1), max-width 360ms cubic-bezier(.2,.8,.2,1)",
          },
          assetFrameSx: stylizedAssetFrameSx,
          imageWidth: 1200,
          imageHeight: 900,
          imageClassName: "rounded-[22px] bg-black/10 object-contain",
          imageStyle: {
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            aspectRatio: stillAspectRatio,
            marginInline: "auto",
          },
          onSelect: () => {
            handleChronologySelect("stylized");
          },
          onMediaActivate: handleStylizedMediaActivate,
        }
      : null;

  const movieMediaItem: MediaCyclerItem | null =
    movieVisible && primaryMovieRendering
      ? {
          key: "movie",
          title: isSmDown ? title : "Motion rendering",
          description: isSmDown
            ? buildMobilePanelSubtext("Motion rendering", primaryMovieSource)
            : undefined,
          mediaType: "video",
          mediaUrl: withBasePath(primaryMovieRendering),
          mediaLightboxTitle: `${title} motion rendering`,
          mediaCaption: primaryMovieCaption,
          mediaSource: primaryMovieSource,
          mediaSourceHref: primaryMovieSourceHref,
          panelRef: motionSectionRef,
          panelSx: {
            ...moviePanelSx,
            minWidth: 0,
            opacity: 1,
            transform: "translate3d(0, 0, 0)",
            transition:
              "opacity 320ms ease, transform 360ms cubic-bezier(.2,.8,.2,1), flex-basis 360ms cubic-bezier(.2,.8,.2,1), max-width 360ms cubic-bezier(.2,.8,.2,1)",
          },
          assetFrameSx: mediaAssetFrameSx,
          videoRef: motionVideoRef,
          controls: true,
          autoPlay: true,
          playsInline: true,
          previewVideoClassName: "block w-full rounded-[22px] bg-black/10 object-contain",
          previewVideoSx: {
            width: "100%",
            height: "100%",
            maxHeight: "100%",
            maxWidth: "100%",
            objectFit: "contain",
            aspectRatio: stillAspectRatio,
            mx: isPortrait ? "auto" : undefined,
          },
          onSelect: () => {
            handleChronologySelect("movie");
          },
          onMediaActivate: handleMovieMediaActivate,
        }
      : null;

  const alternateMovieMediaItem: MediaCyclerItem | null =
    alternateMovieVisible && secondaryMovieRendering
      ? {
          key: "alternateMovie",
          title: isSmDown ? title : "Alternate motion rendering",
          description: isSmDown
            ? buildMobilePanelSubtext("Alternate motion rendering", secondaryMovieSource)
            : undefined,
          mediaType: "video",
          mediaUrl: withBasePath(secondaryMovieRendering),
          mediaLightboxTitle: `${title} alternate motion rendering`,
          mediaCaption: secondaryMovieCaption,
          mediaSource: secondaryMovieSource,
          mediaSourceHref: secondaryMovieSourceHref,
          panelRef: alternateMotionSectionRef,
          panelSx: {
            ...moviePanelSx,
            minWidth: 0,
            opacity: 1,
            transform: "translate3d(0, 0, 0)",
            transition:
              "opacity 320ms ease, transform 360ms cubic-bezier(.2,.8,.2,1), flex-basis 360ms cubic-bezier(.2,.8,.2,1), max-width 360ms cubic-bezier(.2,.8,.2,1)",
          },
          assetFrameSx: mediaAssetFrameSx,
          videoRef: alternateMotionVideoRef,
          controls: true,
          autoPlay: true,
          playsInline: true,
          previewVideoClassName: "block w-full rounded-[22px] bg-black/10 object-contain",
          previewVideoSx: {
            width: "100%",
            height: "100%",
            maxHeight: "100%",
            maxWidth: "100%",
            objectFit: "contain",
            aspectRatio: stillAspectRatio,
            mx: isPortrait ? "auto" : undefined,
          },
          onSelect: () => {
            handleChronologySelect("alternateMovie");
          },
        }
      : null;

  const mediaItems: MediaCyclerItem[] = [
    realisticMediaItem,
    stylizedMediaItem,
    movieMediaItem,
    alternateMovieMediaItem,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const activeMediaItem: MediaCyclerItem | null = (() => {
    if (stage === "alternateMovie" && alternateMovieMediaItem) {
      return alternateMovieMediaItem;
    }

    if (stage === "movie" && movieMediaItem) {
      return movieMediaItem;
    }

    if (stage === "stylized" && stylizedMediaItem) {
      return stylizedMediaItem;
    }

    if (stage === "realistic" && realisticMediaItem) {
      return realisticMediaItem;
    }

    return alternateMovieMediaItem || movieMediaItem || stylizedMediaItem || realisticMediaItem;
  })();

  const activeMediaKey = activeMediaItem?.key;
  const activeMediaIndex =
    activeMediaKey == null ? -1 : mediaItems.findIndex((item) => item.key === activeMediaKey);
  const hasPreviousMedia = activeMediaIndex > 0;
  const hasNextRevealedMedia = activeMediaIndex >= 0 && activeMediaIndex < mediaItems.length - 1;
  const isAtFinalMedia = activeMediaIndex >= 0 && activeMediaIndex === mediaItems.length - 1;
  const enableLoopNavigation = true;
  const canRevealNextFromCurrent =
    (stage === "realistic" &&
      ((hasStylized && !stylizedVisible) || (!hasStylized && hasMovie && !movieVisible))) ||
    (stage === "stylized" && hasMovie && !movieVisible) ||
    (stage === "movie" && hasAlternateMovie && !alternateMovieVisible);
  const disableChevronPrevious = transitioningTo !== null || !hasPreviousMedia;
  const disableChevronNext =
    transitioningTo !== null || (!hasNextRevealedMedia && !canRevealNextFromCurrent);
  const showLoopNavigation = enableLoopNavigation && isAtFinalMedia && !canRevealNextFromCurrent;

  const handleChevronPrevious = () => {
    if (disableChevronPrevious || activeMediaIndex <= 0) {
      return;
    }

    const previousMedia = mediaItems[activeMediaIndex - 1];
    previousMedia?.onSelect?.();
  };

  const handleChevronNext = () => {
    if (disableChevronNext || activeMediaIndex < 0) {
      return;
    }

    const nextMedia = mediaItems[activeMediaIndex + 1];
    if (nextMedia?.onSelect) {
      nextMedia.onSelect();
      return;
    }

    if (stage === "realistic") {
      if (hasStylized && !stylizedVisible) {
        handleRevealStylized();
        return;
      }

      if (!hasStylized && hasMovie && !movieVisible) {
        handleRevealMovie();
      }
      return;
    }

    if (stage === "stylized" && hasMovie && !movieVisible) {
      handleRevealMovie();
      return;
    }

    if (stage === "movie" && hasAlternateMovie && !alternateMovieVisible) {
      handleRevealAlternateMovie();
    }
  };

  const handleLoopNavigation = () => {
    if (transitioningTo !== null || !realisticVisible) {
      return;
    }

    handleChronologySelect("realistic");
  };

  return (
    <AIShenaniganPanel>
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
          {hasVisibleMedia && (
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
              <MediaCycler
                items={mediaItems}
                spacing={2}
                singlePanel
                singlePanelActiveKey={activeMediaKey}
                transitionMs={260}
                compactMetadataOnSmallScreens
                smallScreenInfoBlurb={blurb}
                showCompactInfoButton={false}
                showChevronNavigation
                navigationControlSx={mediaControlSx}
                expandControlSx={mediaControlSx}
                loopNavigation={showLoopNavigation}
                disableLoopNavigation={transitioningTo !== null}
                disableChevronPrevious={disableChevronPrevious}
                disableChevronNext={disableChevronNext}
                onChevronPrevious={handleChevronPrevious}
                onChevronNext={handleChevronNext}
                onLoopNavigation={handleLoopNavigation}
                stackSx={{
                  flexGrow: 1,
                  minHeight: 0,
                  height: "100%",
                  overflow: "hidden",
                  alignItems: "stretch",
                }}
              />
            </Stack>
          )}
          <Box
            sx={{
              display: { xs: isSmDown ? "none" : "flex", md: "flex" },
              height: {
                xs: hasVisibleMedia ? mobileInfoPanelHeight : "100%",
                md: "100%",
              },
              width: { xs: "100%", md: "auto" },
              maxWidth: { xs: "100%", md: hasVisibleMedia ? desktopInfoPanelMaxWidth : "100%" },
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
                minWidth: 0,
                maxWidth: "100%",
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
                  minWidth: 0,
                  maxWidth: "100%",
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
                    <Typography color="text.secondary" className="leading-7">
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
                        {stage !== "intro" && renderNextAction() && !isSmallScreen && (
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
        </Stack>
      </Stack>
    </AIShenaniganPanel>
  );
}
