"use client";

import * as React from "react";
import { CssBaseline, PaletteMode, ThemeProvider, useMediaQuery } from "@mui/material";
import LayoutShell from "@/components/talentforge/LayoutShell";
import getTalentforgeTheme from "@/themes/talentforgeTheme";
import { TalentForgeDataProvider } from "@/contexts/TalentForgeDataContext";
import { OpenAIKeyProvider } from "@/contexts/OpenAIKeyContext";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";
import ToastProvider from "@/components/talentforge/ToastProvider";

export default function TalentForgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = React.useState<PaletteMode>(
    prefersDarkMode ? "dark" : "light"
  );

  const theme = React.useMemo(() => getTalentforgeTheme(mode), [mode]);

  const toggleColorMode = React.useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/talentforge" },
    { label: "Applications", href: "/talentforge/applications" },
    { label: "Inbox", href: "/talentforge/inbox" },
    { label: "Settings", href: "/talentforge/settings" },
  ];

  return (
    <OpenAIKeyProvider>
      <TalentForgeDataProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastProvider>
            <ErrorBoundary>
              <LayoutShell
                navItems={navItems}
                mode={mode}
                toggleColorMode={toggleColorMode}
              >
                {children}
              </LayoutShell>
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </TalentForgeDataProvider>
    </OpenAIKeyProvider>
  );
}
