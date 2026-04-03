"use client";

import { useEffect, useMemo } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { ArrowBack } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import AIShenanigan, {
  AIShenaniganMovieOrientation,
  AIShenaniganType,
} from "./_components/AIShenanigan";
import AppBar from "@/components/portfolio/layout/AppBar";
import { GLOBAL_COLOR_MODE_STORAGE_KEY } from "@/consts/colorMode";
import { aiShenanigans, portfolioApps, summary } from "@/consts/resumeData";
import { useColorModePreference } from "@/hooks/useColorModePreference";
import getFabricTheme from "@/themes/fabricTheme";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import { withBasePath } from "@/utils/basePath";

export default function AIShenanigansPageClient() {
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
  });
  const theme = useMemo(() => getFabricTheme(mode), [mode]);
  const { setDocumentTitle } = useDocumentTitle();

  useEffect(() => {
    setDocumentTitle(portfolioApps.aiShenanigans.documentTitle);
  }, [setDocumentTitle]);

  if (!isReady) {
    return null;
  }

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
        <AppBar
          mode={mode}
          toggleColorMode={toggleColorMode}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Back to portfolio"
            href={withBasePath("/")}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Avatar
            src={withBasePath(summary.avatarImage)}
            alt={summary.name}
            sx={{
              width: 38,
              height: 38,
              mr: 1.5,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="h6" noWrap>
              {aiShenanigans.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {portfolioApps.aiShenanigans.appBarSubtitle}
            </Typography>
          </Box>
        </AppBar>
        <Toolbar />
        <Container sx={{ py: { xs: 3, md: 5 } }}>
          <Stack spacing={3}>
            <Box
              sx={(theme) => ({
                px: 3,
                py: 3.5,
                borderRadius: "32px",
                border: "1px solid",
                borderColor:
                  theme.palette.mode === "light"
                    ? "rgba(55, 86, 136, 0.16)"
                    : "rgba(255,255,255,0.1)",
                backgroundColor:
                  theme.palette.mode === "light"
                    ? "rgba(255,255,255,0.68)"
                    : "rgba(255,255,255,0.05)",
                boxShadow:
                  theme.palette.mode === "light"
                    ? "0 18px 40px rgba(35, 58, 99, 0.1)"
                    : undefined,
              })}
            >
              <Typography variant="overline" color="primary">
                {portfolioApps.aiShenanigans.heroEyebrow}
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  mt: 1.25,
                  mb: 1.5,
                  fontSize: { xs: "2.25rem", md: "3.25rem" },
                }}
              >
                {aiShenanigans.title}
              </Typography>
              <Typography
                color="text.secondary"
                className="max-w-3xl leading-7"
              >
                {aiShenanigans.description}
              </Typography>
            </Box>
            {aiShenanigans.items.map((item, index) => {
              const itemWithLinks = item as typeof item & {
                type?: AIShenaniganType;
                realisticSourceHref?: string;
                stylizedSourceHref?: string;
                movieSourceHref?: string;
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
              const linkProps = {
                ...(itemWithLinks.type ? { type: itemWithLinks.type } : {}),
                ...(itemWithLinks.realisticSourceHref
                  ? { realisticSourceHref: itemWithLinks.realisticSourceHref }
                  : {}),
                ...(itemWithLinks.stylizedSourceHref
                  ? { stylizedSourceHref: itemWithLinks.stylizedSourceHref }
                  : {}),
                ...(itemWithLinks.movieSourceHref
                  ? { movieSourceHref: itemWithLinks.movieSourceHref }
                  : {}),
                ...(itemWithLinks.intentToCopyright
                  ? { intentToCopyright: itemWithLinks.intentToCopyright }
                  : {}),
                ...(itemWithLinks.rightsNotice
                  ? { rightsNotice: itemWithLinks.rightsNotice }
                  : {}),
                ...(itemWithLinks.bookSourceHref
                  ? { bookSourceHref: itemWithLinks.bookSourceHref }
                  : {}),
                ...(itemWithLinks.manuscriptSourceHref
                  ? { manuscriptSourceHref: itemWithLinks.manuscriptSourceHref }
                  : {}),
                ...(itemWithLinks.episodesSourceHref
                  ? { episodesSourceHref: itemWithLinks.episodesSourceHref }
                  : {}),
                ...(itemWithLinks.bookCoverImage
                  ? { bookCoverImage: itemWithLinks.bookCoverImage }
                  : {}),
                ...(itemWithLinks.bookSource
                  ? { bookSource: itemWithLinks.bookSource }
                  : {}),
                ...(itemWithLinks.bookCaption
                  ? { bookCaption: itemWithLinks.bookCaption }
                  : {}),
                ...(itemWithLinks.manuscriptPdf
                  ? { manuscriptPdf: itemWithLinks.manuscriptPdf }
                  : {}),
                ...(itemWithLinks.manuscriptSource
                  ? { manuscriptSource: itemWithLinks.manuscriptSource }
                  : {}),
                ...(itemWithLinks.manuscriptCaption
                  ? { manuscriptCaption: itemWithLinks.manuscriptCaption }
                  : {}),
                ...(itemWithLinks.episodesPdf
                  ? { episodesPdf: itemWithLinks.episodesPdf }
                  : {}),
                ...(itemWithLinks.episodesSource
                  ? { episodesSource: itemWithLinks.episodesSource }
                  : {}),
                ...(itemWithLinks.episodesCaption
                  ? { episodesCaption: itemWithLinks.episodesCaption }
                  : {}),
                ...(itemWithLinks.workPdf
                  ? { workPdf: itemWithLinks.workPdf }
                  : {}),
                ...(itemWithLinks.workSource
                  ? { workSource: itemWithLinks.workSource }
                  : {}),
                ...(itemWithLinks.workSourceHref
                  ? { workSourceHref: itemWithLinks.workSourceHref }
                  : {}),
                ...(itemWithLinks.workCaption
                  ? { workCaption: itemWithLinks.workCaption }
                  : {}),
                ...(itemWithLinks.workParts
                  ? { workParts: itemWithLinks.workParts }
                  : {}),
                ...(itemWithLinks.seriesMovie
                  ? { seriesMovie: itemWithLinks.seriesMovie }
                  : {}),
                ...(itemWithLinks.seriesSource
                  ? { seriesSource: itemWithLinks.seriesSource }
                  : {}),
                ...(itemWithLinks.seriesSourceHref
                  ? { seriesSourceHref: itemWithLinks.seriesSourceHref }
                  : {}),
                ...(itemWithLinks.seriesCaption
                  ? { seriesCaption: itemWithLinks.seriesCaption }
                  : {}),
                ...(itemWithLinks.seriesParts
                  ? { seriesParts: itemWithLinks.seriesParts }
                  : {}),
                ...(itemWithLinks.episodeMedia
                  ? { episodeMedia: itemWithLinks.episodeMedia }
                  : {}),
              };

              return (
                <AIShenanigan
                  key={item.slug}
                  rank={index + 1}
                  title={item.title}
                  blurb={item.blurb}
                  orientation={item.orientation as AIShenaniganMovieOrientation}
                  realisticImage={item.realisticImage as string}
                  realisticSource={item.realisticSource}
                  realisticCaption={item.realisticCaption}
                  stylizedRendering={item.stylizedRendering}
                  stylizedSource={item.stylizedSource}
                  stylizedCaption={item.stylizedCaption}
                  movieRendering={item.movieRendering}
                  movieSource={item.movieSource}
                  movieCaption={item.movieCaption}
                  {...linkProps}
                />
              );
            })}
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
