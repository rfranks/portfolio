"use client";

import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import AppAppBar from "@/app/bookworm/_components/AppAppBar";
import Hero from "@/app/bookworm/_components/Hero";
import Highlights from "@/app/bookworm/_components/Highlights";
// import LogoCollection from "./components/LogoCollection";
// import Pricing from "./components/Pricing";
// import Features from "./components/Features";
// import Testimonials from "./components/Testimonials";
import FAQ from "@/app/bookworm/_components/FAQ";
import Footer from "@/app/bookworm/_components/Footer";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/gloria-hallelujah/400.css";

import "./page.css"; // Ensure global styles are applied
import { useColorModePreference } from "@/hooks/useColorModePreference";
import { useOpenAIKeyGateAppShell } from "@/hooks/app/useOpenAIAppShell";
import { OpenAIKeyInterstitialContent } from "@/components/shared";
import { GLOBAL_COLOR_MODE_STORAGE_KEY } from "@/consts/colorMode";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";
import getBookwormLandingTheme from "@/app/bookworm/_theme/getBookwormLandingTheme";

export default function BookwormPage() {
  const { portfolioApps } = useResumeData();
  const bookwormRoute = getPortfolioAppRouteContract(portfolioApps, "bookworm");
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
  });
  const defaultTheme = React.useMemo(() => createTheme(getBookwormLandingTheme(mode)), [mode]);
  const keyInputRef = React.useRef<HTMLInputElement | null>(null);
  const keyGate = useOpenAIKeyGateAppShell({
    documentTitle: bookwormRoute.documentTitle,
    appId: "bookworm",
    isReady,
    keyInputRef,
  });

  if (keyGate.isBooting) {
    return null;
  }
  if (keyGate.isOpenAIKeyGateVisible) {
    return (
      <ThemeProvider theme={defaultTheme}>
        <CssBaseline enableColorScheme />
        <OpenAIKeyInterstitialContent
          appName={bookwormRoute.interstitialAppName}
          logoAlt={bookwormRoute.interstitialLogoAlt}
          value={keyGate.draftKey}
          onChange={keyGate.setDraftKey}
          onSubmit={keyGate.handleKeySubmit}
          inputRef={keyInputRef}
          errorText={keyGate.keyError || undefined}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline enableColorScheme />
      <AppAppBar mode={mode} toggleColorMode={toggleColorMode} />
      <Hero />
      <Box sx={{ bgcolor: "background.default" }}>
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
