"use client";

import * as React from "react";
import Dashboard from "./_components/Dashboard";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./page.css"; // Ensure global styles are applied
import { GLOBAL_COLOR_MODE_STORAGE_KEY } from "@/consts/colorMode";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useColorModePreference } from "@/hooks/useColorModePreference";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";
import getDnaTheme from "./_theme/getDnaTheme";

export default function DnaPage() {
  const { portfolioApps } = useResumeData();
  const dnaRoute = getPortfolioAppRouteContract(portfolioApps, "dna");
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
  });
  const theme = React.useMemo(() => getDnaTheme(mode), [mode]);
  const { setDocumentTitle } = useDocumentTitle();
  React.useEffect(() => {
    setDocumentTitle(dnaRoute.documentTitle);
  }, [dnaRoute.documentTitle, setDocumentTitle]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Dashboard mode={mode} toggleColorMode={toggleColorMode} />
    </ThemeProvider>
  );
}
