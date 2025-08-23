"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import ResumeHero from "@/components/app/ResumeHero";

export default function Home() {
  const defaultTheme = createTheme();

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Container>
        <ResumeHero />
      </Container>
    </ThemeProvider>
  );
}
