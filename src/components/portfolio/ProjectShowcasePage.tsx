"use client";

import { useEffect, useMemo } from "react";
import { ArrowBack } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import AppBar from "@/components/portfolio/layout/AppBar";
import { GLOBAL_COLOR_MODE_STORAGE_KEY } from "@/consts/colorMode";
import ProjectPresentation, { type ProjectData } from "./ProjectPresentation";
import { useColorModePreference } from "@/hooks/useColorModePreference";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import getFabricTheme from "@/themes/fabricTheme";
import { withBasePath } from "@/utils/basePath";

interface ProjectShowcasePageProps {
  documentTitle: string;
  heading: string;
  project: ProjectData;
  subtitle?: string;
}

export default function ProjectShowcasePage({
  documentTitle,
  heading,
  project,
  subtitle = "Project Showcase",
}: ProjectShowcasePageProps) {
  const { summary } = useResumeData();
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
  });
  const theme = useMemo(() => getFabricTheme(mode), [mode]);
  const { setDocumentTitle } = useDocumentTitle();

  useEffect(() => {
    setDocumentTitle(documentTitle);
  }, [documentTitle, setDocumentTitle]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
        }}
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
              {heading}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          </Box>
        </AppBar>
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
          <Typography
            variant="h3"
            align="left"
            sx={{
              fontWeight: 700,
              mb: 6,
              background: "linear-gradient(90deg, #1976d2, #21cbf3)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {heading}
          </Typography>
          <Divider sx={{ mb: 6 }} />
          <ProjectPresentation project={project} />
        </Container>
      </Box>
    </ThemeProvider>
  );
}
