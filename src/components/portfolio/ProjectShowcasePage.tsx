"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowBack, Close } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Container,
  CssBaseline,
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
const LAST_HOME_HASH_STORAGE_KEY = "portfolio:last-home-hash";
const DEFAULT_HOME_HASH = "#projects";

export default function ProjectShowcasePage({
  documentTitle,
  heading,
  project,
  subtitle = "Project Showcase",
}: ProjectShowcasePageProps) {
  const { summary, projects } = useResumeData();
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
  });
  const theme = useMemo(() => getFabricTheme(mode), [mode]);
  const resolvedProject = useMemo<ProjectData>(() => {
    const projectHref = project.href?.trim();
    if (!projectHref) {
      return project;
    }

    const runtimeProject = projects.find((entry) => entry.href === projectHref);
    if (!runtimeProject) {
      return project;
    }

    const runtimeProjectRecord = runtimeProject as Record<string, unknown>;
    const runtimeDescription =
      typeof runtimeProjectRecord.description === "string" &&
      runtimeProjectRecord.description.trim().length > 0
        ? runtimeProjectRecord.description.trim()
        : project.description;
    const runtimeProjectTitle =
      typeof runtimeProjectRecord.project === "string" &&
      runtimeProjectRecord.project.trim().length > 0
        ? runtimeProjectRecord.project
        : runtimeProject.name;

    return {
      ...project,
      ...(runtimeProject as unknown as Partial<ProjectData>),
      project: runtimeProjectTitle ?? project.project,
      description: runtimeDescription,
      href: projectHref,
    };
  }, [project, projects]);
  const { setDocumentTitle } = useDocumentTitle();
  const [homeHref, setHomeHref] = useState(withBasePath("/"));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const normalizedHash = (() => {
      try {
        const storedHash = window.sessionStorage.getItem(LAST_HOME_HASH_STORAGE_KEY)?.trim();
        if (storedHash && storedHash.startsWith("#")) {
          return storedHash;
        }
      } catch {
        // Ignore storage failures.
      }
      return DEFAULT_HOME_HASH;
    })();

    setHomeHref(withBasePath(`/${normalizedHash}`));
  }, []);

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
        <AppBar mode={mode} toggleColorMode={toggleColorMode}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Back to portfolio"
            href={homeHref}
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
          <IconButton
            edge="end"
            color="inherit"
            aria-label="Close project and return to portfolio"
            href={homeHref}
            sx={{ ml: 1 }}
          >
            <Close />
          </IconButton>
        </AppBar>
        <Toolbar />
        <Container
          maxWidth="lg"
          sx={{
            my: 2,
            py: 0,
            height: {
              xs: "calc(100dvh - 56px - 32px)",
              sm: "calc(100dvh - 64px - 32px)",
            },
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              minHeight: 0,
              height: "100%",
              flex: "1 1 auto",
              overflow: "hidden",
            }}
          >
            <ProjectPresentation project={resolvedProject} />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
