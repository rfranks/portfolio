"use client";

import * as React from "react";
import Dashboard from "./_components/Dashboard";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./page.css"; // Ensure global styles are applied
import { CssBaseline, PaletteMode, ThemeProvider } from "@mui/material";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import getDnaTheme from "./_theme/getDnaTheme";
import { portfolioApps } from "@/consts/resumeData";

export default function DnaPage() {
  const [mode, setMode] = React.useState<PaletteMode>("light");
  const theme = React.useMemo(() => getDnaTheme(mode), [mode]);
  const { setDocumentTitle } = useDocumentTitle();
  React.useEffect(() => {
    setDocumentTitle(portfolioApps.dna.documentTitle);
  }, [setDocumentTitle]);

  const toggleColorMode = React.useCallback(() => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Dashboard mode={mode} toggleColorMode={toggleColorMode} />
    </ThemeProvider>
  );
}
