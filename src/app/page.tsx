"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import ResumeHero from "@/components/app/ResumeHero";
import ResumeSummary from "@/components/app/ResumeSummary";
import CoreCompetencies from "@/components/app/CoreCompetencies";
import ExperienceTimeline from "@/components/app/ExperienceTimeline";
import ProjectsGrid from "@/components/app/ProjectsGrid";
import Recognition from "@/components/app/Recognition";

export default function Home() {
  const defaultTheme = createTheme();

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Container>
        <ResumeHero />
        <ResumeSummary />
        <CoreCompetencies />
        <ExperienceTimeline />
        <ProjectsGrid />
        <Recognition />
      </Container>
    </ThemeProvider>
  );
}
