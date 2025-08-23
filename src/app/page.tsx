"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import ResumeHero from "@/components/app/ResumeHero";
import ResumeSummary from "@/components/app/ResumeSummary";
import CoreCompetencies from "@/components/app/CoreCompetencies";
import ExperienceTimeline from "@/components/app/ExperienceTimeline";
import ProjectsGrid from "@/components/app/ProjectsGrid";
import Education from "@/components/app/Education";
import Recognition from "@/components/app/Recognition";
import ContactCTA from "@/components/app/ContactCTA";

export default function Home() {
  const tronTheme = createTheme({
    palette: {
      mode: "dark",
      primary: { main: "#00e5ff" },
      secondary: { main: "#ff29ff" },
      background: { default: "#0b0f19", paper: "#0b0f19" },
    },
    typography: {
      fontFamily: '"Geist", "Roboto", sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            textTransform: "none",
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={tronTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          py: 8,
          background: "radial-gradient(circle at top, #001028 0%, #000 100%)",
        }}
      >
        <Container maxWidth="md" sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <ResumeHero />
          <ResumeSummary />
          <CoreCompetencies />
          <ExperienceTimeline />
          <ProjectsGrid />
          <Education />
          <Recognition />
          <ContactCTA />
        </Container>
      </Box>
    </ThemeProvider>
  );
}
