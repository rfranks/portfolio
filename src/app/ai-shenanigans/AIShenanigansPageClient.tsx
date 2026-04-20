"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import {
  ArrowBack,
  Close,
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import AIShenanigan, {
  AIShenaniganMovieOrientation,
  AIShenaniganType,
} from "./_components/AIShenanigan";
import AIShenaniganPager from "./_components/AIShenaniganPager";
import { GLOBAL_COLOR_MODE_STORAGE_KEY } from "@/consts/colorMode";
import { aiShenanigans, portfolioApps } from "@/consts/resumeData";
import { useColorModePreference } from "@/hooks/useColorModePreference";
import getFabricTheme from "@/themes/fabricTheme";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import { withBasePath } from "@/utils/basePath";
import useMediaQuery from "@mui/material/useMediaQuery";

type AIShenaniganItemWithLinks = (typeof aiShenanigans.items)[number] & {
  type?: AIShenaniganType;
  shortText?: string;
  pagerOptionImage?: string;
  realisticSourceHref?: string;
  stylizedSourceHref?: string;
  movieSourceHref?: string;
  movieRendering2?: string;
  movieSource2?: string;
  movieSourceHref2?: string;
  movieCaption2?: string;
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
  intentToCopyright?: boolean;
  rightsNotice?: string;
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

const shenaniganItems = aiShenanigans.items as AIShenaniganItemWithLinks[];

const decodeHashSlug = (hash: string) => {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) {
    return "";
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const buildLinkProps = (item: AIShenaniganItemWithLinks) => ({
  ...(item.type ? { type: item.type } : {}),
  ...(item.realisticSourceHref
    ? { realisticSourceHref: item.realisticSourceHref }
    : {}),
  ...(item.stylizedSourceHref
    ? { stylizedSourceHref: item.stylizedSourceHref }
    : {}),
  ...(item.movieSourceHref ? { movieSourceHref: item.movieSourceHref } : {}),
  ...(item.movieSourceHref2 ? { movieSourceHref2: item.movieSourceHref2 } : {}),
  ...(item.rawSourceHref ? { rawSourceHref: item.rawSourceHref } : {}),
  ...(item.analyzedSourceHref
    ? { analyzedSourceHref: item.analyzedSourceHref }
    : {}),
  ...(item.palmLineAnalysisSourceHref
    ? {
        palmLineAnalysisSourceHref: item.palmLineAnalysisSourceHref,
      }
    : {}),
  ...(item.palmReadingSourceHref
    ? { palmReadingSourceHref: item.palmReadingSourceHref }
    : {}),
  ...(item.songAlbumSourceHref
    ? { songAlbumSourceHref: item.songAlbumSourceHref }
    : {}),
  ...(item.songAudioSourceHref
    ? { songAudioSourceHref: item.songAudioSourceHref }
    : {}),
  ...(item.songLyricsSourceHref
    ? { songLyricsSourceHref: item.songLyricsSourceHref }
    : {}),
  ...(item.intentToCopyright
    ? { intentToCopyright: item.intentToCopyright }
    : {}),
  ...(item.rightsNotice ? { rightsNotice: item.rightsNotice } : {}),
  ...(item.bookSourceHref ? { bookSourceHref: item.bookSourceHref } : {}),
  ...(item.manuscriptSourceHref
    ? { manuscriptSourceHref: item.manuscriptSourceHref }
    : {}),
  ...(item.trailerSourceHref
    ? { trailerSourceHref: item.trailerSourceHref }
    : {}),
  ...(item.episodesSourceHref
    ? { episodesSourceHref: item.episodesSourceHref }
    : {}),
  ...(item.bookCoverImage ? { bookCoverImage: item.bookCoverImage } : {}),
  ...(item.bookSource ? { bookSource: item.bookSource } : {}),
  ...(item.bookCaption ? { bookCaption: item.bookCaption } : {}),
  ...(item.manuscriptPdf ? { manuscriptPdf: item.manuscriptPdf } : {}),
  ...(item.manuscriptSource ? { manuscriptSource: item.manuscriptSource } : {}),
  ...(item.manuscriptCaption
    ? { manuscriptCaption: item.manuscriptCaption }
    : {}),
  ...(item.trailerMovie ? { trailerMovie: item.trailerMovie } : {}),
  ...(item.trailerOrientation
    ? { trailerOrientation: item.trailerOrientation }
    : {}),
  ...(item.trailerSource ? { trailerSource: item.trailerSource } : {}),
  ...(item.trailerCaption ? { trailerCaption: item.trailerCaption } : {}),
  ...(item.episodesPdf ? { episodesPdf: item.episodesPdf } : {}),
  ...(item.episodesSource ? { episodesSource: item.episodesSource } : {}),
  ...(item.episodesCaption ? { episodesCaption: item.episodesCaption } : {}),
  ...(item.workPdf ? { workPdf: item.workPdf } : {}),
  ...(item.workSource ? { workSource: item.workSource } : {}),
  ...(item.workSourceHref ? { workSourceHref: item.workSourceHref } : {}),
  ...(item.workCaption ? { workCaption: item.workCaption } : {}),
  ...(item.workParts ? { workParts: item.workParts } : {}),
  ...(item.seriesMovie ? { seriesMovie: item.seriesMovie } : {}),
  ...(item.seriesSource ? { seriesSource: item.seriesSource } : {}),
  ...(item.seriesSourceHref ? { seriesSourceHref: item.seriesSourceHref } : {}),
  ...(item.seriesCaption ? { seriesCaption: item.seriesCaption } : {}),
  ...(item.seriesParts ? { seriesParts: item.seriesParts } : {}),
  ...(item.episodeMedia ? { episodeMedia: item.episodeMedia } : {}),
});

export default function AIShenanigansPageClient() {
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
  });
  const theme = useMemo(() => getFabricTheme(mode), [mode]);
  const { setDocumentTitle } = useDocumentTitle();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitialHashSynced, setIsInitialHashSynced] = useState(false);

  const shenaniganIndexBySlug = useMemo(() => {
    const indexBySlug = new Map<string, number>();

    shenaniganItems.forEach((item, index) => {
      indexBySlug.set(item.slug, index);
    });

    return indexBySlug;
  }, []);

  const clampIndex = useCallback((value: number) => {
    if (!shenaniganItems.length) {
      return 0;
    }

    if (value < 0) {
      return shenaniganItems.length - 1;
    }

    if (value >= shenaniganItems.length) {
      return 0;
    }

    return value;
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => clampIndex(prevIndex - 1));
  }, [clampIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => clampIndex(prevIndex + 1));
  }, [clampIndex]);

  const handleSelectShenanigan = (index: number) => {
    setCurrentIndex(clampIndex(index));
  };

  useEffect(() => {
    setDocumentTitle(portfolioApps.aiShenanigans.documentTitle);
  }, [setDocumentTitle]);

  useEffect(() => {
    if (!shenaniganItems.length || typeof window === "undefined") {
      setIsInitialHashSynced(true);
      return;
    }

    const syncFromHash = () => {
      const slug = decodeHashSlug(window.location.hash);
      if (!slug) {
        return;
      }

      const indexFromHash = shenaniganIndexBySlug.get(slug);
      if (typeof indexFromHash === "number") {
        setCurrentIndex(indexFromHash);
      }
    };

    syncFromHash();
    setIsInitialHashSynced(true);
    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, [shenaniganIndexBySlug]);

  useEffect(() => {
    if (
      !isInitialHashSynced ||
      !shenaniganItems.length ||
      typeof window === "undefined"
    ) {
      return;
    }

    const slug = shenaniganItems[currentIndex]?.slug;
    if (!slug) {
      return;
    }

    const nextHash = `#${encodeURIComponent(slug)}`;
    if (window.location.hash === nextHash) {
      return;
    }

    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [currentIndex, isInitialHashSynced]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingField =
        Boolean(target?.isContentEditable) ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT";

      if (isTypingField) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext, handlePrevious]);

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  if (!isReady || !shenaniganItems.length) {
    return null;
  }

  const currentItem = shenaniganItems[currentIndex];
  const linkProps = buildLinkProps(currentItem);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Box
        sx={(theme) => ({
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
          ...(theme.palette.mode === "light" && {
            "--fabric-surface-1": "rgba(255, 255, 255, 0.54)",
            "--fabric-surface-2": "rgba(255, 255, 255, 0.7)",
            "--fabric-surface-3": "rgba(255, 255, 255, 0.84)",
            "--fabric-surface-border": "rgba(55, 86, 136, 0.14)",
            "--fabric-surface-border-strong": "rgba(55, 86, 136, 0.24)",
            "--fabric-inner-glow": "rgba(255, 255, 255, 0.9)",
            "--fabric-shadow-soft": "0 14px 40px rgba(35, 58, 99, 0.1)",
            "--fabric-shadow-tight": "0 8px 22px rgba(33, 55, 95, 0.08)",
          }),
        })}
      >
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            bgcolor: "background.default",
            borderRadius: 0,
          }}
        >
          <Box
            sx={{
              px: { xs: 1.5, md: 2.5 },
              py: 1.25,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconButton
              color="inherit"
              aria-label="Back to portfolio"
              href={withBasePath("/")}
              size="small"
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6">{aiShenanigans.title}</Typography>
              {!isSmallScreen && (
                <Typography variant="body2" color="text.secondary">
                  {aiShenanigans.description}
                </Typography>
              )}
            </Box>
            <IconButton
              color="inherit"
              aria-label={
                mode === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              onClick={toggleColorMode}
              size="small"
            >
              {mode === "light" ? (
                <DarkMode fontSize="small" />
              ) : (
                <LightMode fontSize="small" />
              )}
            </IconButton>
            <IconButton
              color="inherit"
              aria-label="Close shenanigans panel"
              href={withBasePath("/")}
              size="small"
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              px: { xs: 1.5, md: 2.5 },
              py: 1.5,
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              maxWidth: "100%",
              overflow: "hidden",
              display: "flex",
              backgroundColor: "transparent",
            }}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                maxWidth: "100%",
                display: "flex",
                overflow: "hidden",
                pr: 0.5,
                backgroundColor: "transparent",
                "& > *": {
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  maxWidth: "100%",
                },
              }}
            >
              <AIShenanigan
                key={currentItem.slug}
                rank={currentIndex + 1}
                title={currentItem.title}
                blurb={currentItem.blurb}
                orientation={
                  currentItem.orientation as AIShenaniganMovieOrientation
                }
                realisticImage={
                  (currentItem.realisticImage ||
                    currentItem.songAlbumImage) as string
                }
                realisticSource={currentItem.realisticSource}
                realisticCaption={currentItem.realisticCaption}
                stylizedRendering={currentItem.stylizedRendering}
                stylizedSource={currentItem.stylizedSource}
                stylizedCaption={currentItem.stylizedCaption}
                movieRendering={currentItem.movieRendering}
                movieSource={currentItem.movieSource}
                movieCaption={currentItem.movieCaption}
                movieRendering2={currentItem.movieRendering2}
                movieSource2={currentItem.movieSource2}
                movieCaption2={currentItem.movieCaption2}
                rawImage={currentItem.rawImage}
                rawSource={currentItem.rawSource}
                rawCaption={currentItem.rawCaption}
                analyzedImage={currentItem.analyzedImage}
                analyzedSource={currentItem.analyzedSource}
                analyzedCaption={currentItem.analyzedCaption}
                palmLineAnalysisImage={currentItem.palmLineAnalysisImage}
                palmLineAnalysisSource={currentItem.palmLineAnalysisSource}
                palmLineAnalysisCaption={currentItem.palmLineAnalysisCaption}
                palmReadingTitle={currentItem.palmReadingTitle}
                palmReadingText={currentItem.palmReadingText}
                palmReadingMarkdownPath={currentItem.palmReadingMarkdownPath}
                palmReadingSource={currentItem.palmReadingSource}
                songAlbumImage={currentItem.songAlbumImage}
                songAlbumSource={currentItem.songAlbumSource}
                songAlbumCaption={currentItem.songAlbumCaption}
                songAudio={currentItem.songAudio}
                songAudioSource={currentItem.songAudioSource}
                songAudioCaption={currentItem.songAudioCaption}
                songWrittenBy={currentItem.songWrittenBy}
                songPerformedBy={currentItem.songPerformedBy}
                songLyricsMarkdownPath={currentItem.songLyricsMarkdownPath}
                songLyricsSource={currentItem.songLyricsSource}
                {...linkProps}
              />
            </Box>
          </Box>

          <AIShenaniganPager
            currentIndex={currentIndex}
            items={shenaniganItems}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSelectShenanigan={handleSelectShenanigan}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
