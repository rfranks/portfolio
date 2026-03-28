"use client";

import { useEffect, useMemo, useState } from "react";
import { PaletteMode } from "@mui/material";
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
} from "@/components/app/AIShenanigan";
import AppBar from "@/components/app/AppBar";
import {
  aiShenanigans,
  portfolioApps,
  summary,
} from "@/personal/data/resumeData";
import getFabricTheme from "@/themes/fabricTheme";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { withBasePath } from "@/utils/basePath";

export default function AIShenanigansPageClient() {
  const [mode, setMode] = useState<PaletteMode>("light");
  const theme = useMemo(() => getFabricTheme(mode), [mode]);
  const { setDocumentTitle } = useDocumentTitle();

  useEffect(() => {
    setDocumentTitle(portfolioApps.aiShenanigans.documentTitle);
  }, [setDocumentTitle]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        <AppBar
          mode={mode}
          toggleColorMode={() =>
            setMode((prev) => (prev === "light" ? "dark" : "light"))
          }
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
            <Box className="rounded-[32px] border border-white/10 bg-white/5 px-6 py-7 shadow-lg">
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
                realisticSourceHref?: string;
                stylizedSourceHref?: string;
                movieSourceHref?: string;
              };
              const linkProps = {
                ...(itemWithLinks.realisticSourceHref
                  ? { realisticSourceHref: itemWithLinks.realisticSourceHref }
                  : {}),
                ...(itemWithLinks.stylizedSourceHref
                  ? { stylizedSourceHref: itemWithLinks.stylizedSourceHref }
                  : {}),
                ...(itemWithLinks.movieSourceHref
                  ? { movieSourceHref: itemWithLinks.movieSourceHref }
                  : {}),
              };

              return (
                <AIShenanigan
                  key={item.slug}
                  rank={index + 1}
                  title={item.title}
                  blurb={item.blurb}
                  orientation={item.orientation as AIShenaniganMovieOrientation}
                  realisticImage={item.realisticImage}
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
