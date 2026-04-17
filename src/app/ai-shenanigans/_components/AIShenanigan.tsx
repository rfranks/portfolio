"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import AIShenaniganAdaptation from "./AIShenaniganAdaptation";
import AIShenaniganPalmReading from "./AIShenaniganPalmReading";
import AIShenaniganSongRecording from "./AIShenaniganSongRecording";
import AIShenaniganWorkSeries from "./AIShenaniganWorkSeries";
import AIShenaniganPanel from "./AIShenaniganPanel";
import EmojiGlyph from "@/components/shared/EmojiGlyph";
import ImageLightbox from "@/components/shared/ImageLightbox";
import VideoLightbox from "@/components/shared/VideoLightbox";
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
        analyzedSourceHref={
          props.analyzedSourceHref || props.stylizedSourceHref
        }
        analyzedCaption={props.analyzedCaption || props.stylizedCaption}
        palmLineAnalysisImage={
          props.palmLineAnalysisImage || props.movieRendering || ""
        }
        palmLineAnalysisSource={
          props.palmLineAnalysisSource || props.movieSource
        }
        palmLineAnalysisSourceHref={
          props.palmLineAnalysisSourceHref || props.movieSourceHref
        }
        palmLineAnalysisCaption={
          props.palmLineAnalysisCaption || props.movieCaption
        }
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
        songAlbumSourceHref={
          props.songAlbumSourceHref || props.realisticSourceHref
        }
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
  const [isInfoPanelMinimized, setIsInfoPanelMinimized] = useState(false);
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
  const primaryMovieRendering = movieRendering || movieRendering2 || null;
  const primaryMovieSource = movieRendering ? movieSource : movieSource2;
  const primaryMovieSourceHref = movieRendering
    ? movieSourceHref
    : movieSourceHref2;
  const primaryMovieCaption = movieRendering ? movieCaption : movieCaption2;
  const secondaryMovieRendering =
    movieRendering && movieRendering2 ? movieRendering2 : null;
  const secondaryMovieSource =
    movieRendering && movieRendering2 ? movieSource2 : undefined;
  const secondaryMovieSourceHref =
    movieRendering && movieRendering2 ? movieSourceHref2 : undefined;
  const secondaryMovieCaption =
    movieRendering && movieRendering2 ? movieCaption2 : undefined;
  const hasMovie = Boolean(primaryMovieRendering);
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
  const mediaViewportPanelSx = {
    ...mediaPanelSx,
    display: "flex",
    flexDirection: "column",
    minHeight: {
      xs: "80dvh",
      md: "80dvh",
    },
    flexShrink: 0,
    overflow: "hidden",
  } as const;
  const realisticPanelSx = {
    ...mediaPanelSx,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "visible",
  } as const;
  const stylizedPanelSx = {
    ...mediaPanelSx,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "visible",
  } as const;
  const mediaAssetFrameSx = {
    mt: 0.5,
    mb: 1.5,
    width: "100%",
    flexGrow: 1,
    flexShrink: 0,
    minHeight: { xs: 200, md: 270, lg: 320 },
    maxHeight: {
      xs: "calc(80dvh - 220px)",
      md: "calc(80dvh - 250px)",
    },
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  } as const;
  const realisticAssetFrameSx = {
    mt: 0.25,
    mb: 0.35,
    width: "100%",
    flex: "0 0 auto",
    height: { xs: 400, md: 480, lg: 540 },
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  } as const;
  const stylizedAssetFrameSx = {
    mt: 0.2,
    mb: 0.1,
    width: "100%",
    flex: "0 0 auto",
    height: { xs: 400, md: 480, lg: 540 },
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

  const revealLabels = useMemo(() => {
    const applicableStages: Array<{
      key: "realistic" | "stylized" | "movie";
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

    return applicableStages.map((stage, index) => ({
      ...stage,
      label: `Step ${index + 1}: ${stage.title}`,
    }));
  }, [
    hasStylized,
    hasMovie,
    movieVisible,
    realisticVisible,
    showMovieArrow,
    showStylizedArrow,
    stylizedVisible,
  ]);

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

    if (
      (stage === "realistic" && !hasStylized && hasMovie) ||
      (stage === "stylized" && hasMovie)
    ) {
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

    return null;
  };

  const handleChronologySelect = (
    target: "realistic" | "stylized" | "movie",
  ) => {
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
    rewindAndPlayAudio(rewindSfx, { volume: 0.24 });
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
    <AIShenaniganPanel>
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
          {hasVisibleMedia && (
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
              <Stack
                spacing={2}
                direction="column"
                sx={{
                  flexGrow: 1,
                  height: "auto",
                  overflow: "visible",
                  alignItems: "stretch",
                }}
              >
                {realisticVisible && (
                  <>
                    <Box
                      ref={realisticSectionRef}
                      sx={{
                        ...realisticPanelSx,
                        minWidth: 0,
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
                      <Box sx={realisticAssetFrameSx}>
                        <ImageLightbox
                          src={withBasePath(realisticImage)}
                          alt={`${title} realistic source`}
                          title={`${title} — Realistic Source`}
                          caption={realisticCaption || realisticSource}
                          triggerSx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
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
                            className="w-full rounded-[22px] bg-black/10 object-contain"
                            style={{
                              height: "100%",
                              maxHeight: "100%",
                              aspectRatio: stillAspectRatio,
                              maxWidth: stillMaxWidth,
                              marginInline: "auto",
                            }}
                          />
                        </ImageLightbox>
                      </Box>
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
                    </Box>
                    {hasStylized && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        {renderArrow("down", showStylizedArrow)}
                      </Box>
                    )}
                    {stylizedVisible && stylizedRendering && (
                      <Box
                        ref={stylizedSectionRef}
                        sx={{
                          ...stylizedPanelSx,
                          minWidth: 0,
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
                        <Box sx={stylizedAssetFrameSx}>
                          <ImageLightbox
                            src={withBasePath(stylizedRendering)}
                            alt={`${title} stylized rendering`}
                            title={`${title} — Stylized Rendering`}
                            caption={stylizedCaption || stylizedSource}
                            triggerSx={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
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
                              className="w-full rounded-[22px] bg-black/10 object-contain"
                              style={{
                                height: "100%",
                                maxHeight: "100%",
                                aspectRatio: stillAspectRatio,
                                maxWidth: stillMaxWidth,
                                marginInline: "auto",
                              }}
                            />
                          </ImageLightbox>
                        </Box>
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
                      </Box>
                    )}
                  </>
                )}
                {hasMovie &&
                  (movieVisible ||
                    (hasStylized ? showMovieArrow : realisticVisible)) && (
                    <>
                      {hasStylized && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            py: 0.5,
                          }}
                        >
                          {renderArrow("down", showMovieArrow)}
                        </Box>
                      )}
                      {movieVisible && (
                        <Box ref={motionSectionRef} sx={mediaViewportPanelSx}>
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
                          <Box sx={mediaAssetFrameSx}>
                            <VideoLightbox
                              ref={motionVideoRef}
                              src={withBasePath(primaryMovieRendering!)}
                              controls
                              autoPlay
                              playsInline
                              title={`${title} motion rendering`}
                              caption={primaryMovieCaption}
                              onLoadedData={() => {
                                if (movieVisible) {
                                  scrollRevealIntoView(
                                    motionSectionRef.current,
                                    movieFooterRef.current,
                                  );
                                }
                              }}
                              previewVideoClassName="block w-full rounded-[22px] bg-black/10 object-contain"
                              previewVideoSx={{
                                height: "100%",
                                maxHeight: "100%",
                                aspectRatio: mediaAspectRatio,
                                maxWidth: mediaMaxWidth,
                                mx: isPortrait ? "auto" : undefined,
                              }}
                            />
                          </Box>
                          {renderSource(
                            primaryMovieSource,
                            primaryMovieSourceHref,
                          )}
                          {primaryMovieCaption && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: primaryMovieSource ? 0.75 : 1.5 }}
                            >
                              {primaryMovieCaption}
                            </Typography>
                          )}
                          {secondaryMovieRendering && (
                            <Box
                              sx={{
                                mt: 2.5,
                                pt: 2,
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Alternate motion rendering
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 2 }}
                              >
                                An alternate cut of the same shenanigan.
                              </Typography>
                              <VideoLightbox
                                src={withBasePath(secondaryMovieRendering)}
                                controls
                                playsInline
                                title={`${title} alternate motion rendering`}
                                caption={secondaryMovieCaption}
                                previewVideoClassName="block w-full rounded-[22px] bg-black/10 object-contain"
                                previewVideoSx={{
                                  height: "100%",
                                  maxHeight: "100%",
                                  aspectRatio: mediaAspectRatio,
                                  maxWidth: mediaMaxWidth,
                                  mx: isPortrait ? "auto" : undefined,
                                }}
                              />
                              {renderSource(
                                secondaryMovieSource,
                                secondaryMovieSourceHref,
                              )}
                              {secondaryMovieCaption && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: secondaryMovieSource ? 0.75 : 1.5 }}
                                >
                                  {secondaryMovieCaption}
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Box>
                      )}
                    </>
                  )}
              </Stack>
            </Stack>
          )}
          <Box
            sx={{
              display: "flex",
              height: {
                xs: "30dvh",
                md: "100%",
              },
              width: "100%",
              minWidth: { xs: 0, md: hasVisibleMedia ? 400 : 0 },
              maxWidth: { xs: "100%", md: hasVisibleMedia ? 400 : "100%" },
              flexBasis: {
                md: hasVisibleMedia ? "400px" : "100%",
              },
              flexShrink: 0,
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
                overflowY: hasVisibleMedia ? "auto" : "visible",
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
        </Stack>
      </Stack>
    </AIShenaniganPanel>
  );
}
