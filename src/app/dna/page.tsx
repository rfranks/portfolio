"use client";

import * as React from "react";
import Dashboard from "@/components/app/Dashboard";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./page.css"; // Ensure global styles are applied
import {
  CssBaseline,
  PaletteMode,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function DnaPage() {
  const [mode, setMode] = React.useState<PaletteMode>("light");
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode],
  );
  const { setDocumentTitle } = useDocumentTitle();
  React.useEffect(() => {
    setDocumentTitle("GeneBoard");
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
