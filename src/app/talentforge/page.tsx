"use client";

import * as React from "react";
import { PaletteMode } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import AppAppBar from "@/components/talentforge/AppAppBar";
import Hero from "@/components/talentforge/Hero";
import Highlights from "@/components/talentforge/Highlights";
import DocumentGenerator from "@/components/talentforge/DocumentGenerator";
import JobSearch from "@/components/talentforge/JobSearch";
import JobTracker from "@/components/talentforge/JobTracker";
// import LogoCollection from "./components/LogoCollection";
// import Pricing from "./components/Pricing";
// import Features from "./components/Features";
// import Testimonials from "./components/Testimonials";
import FAQ from "@/components/talentforge/FAQ";
import Footer from "@/components/talentforge/Footer";
import OnboardingWizard from "@/components/talentforge/OnboardingWizard";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./page.css"; // Ensure global styles are applied
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function TalentForgePage() {
  const [mode, setMode] = React.useState<PaletteMode>(() => {
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem("talentforge-mode") as PaletteMode) || "light";
    }
    return "light";
  });
  const defaultTheme = createTheme({ palette: { mode } });
  const { setDocumentTitle } = useDocumentTitle();
  const [onboardingOpen, setOnboardingOpen] = React.useState(false);

  React.useEffect(() => {
    setDocumentTitle("TalentForge AI");
  }, [setDocumentTitle]);

  React.useEffect(() => {
    if (typeof window !== "undefined" &&
        !window.localStorage.getItem("talentforge:onboardingComplete")) {
      setOnboardingOpen(true);
    }
  }, []);

  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("talentforge-mode", next);
      }
      return next;
    });
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <OnboardingWizard
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />
      <AppAppBar mode={mode} toggleColorMode={toggleColorMode} />
      <Button
        variant="contained"
        onClick={() => setOnboardingOpen(true)}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: (theme) => theme.zIndex.tooltip,
        }}
      >
        Get Started
      </Button>
      <Hero />
      <Box sx={{ bgcolor: "background.default" }}>
        <DocumentGenerator />
        <JobSearch />
        <JobTracker />
        {/* <LogoCollection /> */}
        {/* <Features />
        <Divider />
        <Testimonials />
        <Divider /> */}
        <Highlights />
        <Divider />
        {/* <Pricing />
        <Divider /> */}
        <FAQ />
        <Divider />
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
