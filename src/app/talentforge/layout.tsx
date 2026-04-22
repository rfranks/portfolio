"use client";

import * as React from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import LayoutShell from "@/app/talentforge/_components/LayoutShell";
import { GLOBAL_COLOR_MODE_STORAGE_KEY } from "@/consts/colorMode";
import getTalentforgeTheme from "@/app/talentforge/_theme/getTalentforgeTheme";
import { TalentForgeDataProvider } from "@/app/talentforge/_contexts/TalentForgeDataContext";
import { OpenAIKeyProvider } from "@/contexts/OpenAIKeyContext";
import { useColorModePreference } from "@/hooks/useColorModePreference";
import ErrorBoundary from "@/app/talentforge/_components/ErrorBoundary";
import ToastProvider from "@/app/talentforge/_components/ToastProvider";

export default function TalentForgeLayout({ children }: { children: React.ReactNode }) {
  const { mode, toggleColorMode, isReady } = useColorModePreference({
    storageKey: GLOBAL_COLOR_MODE_STORAGE_KEY,
  });
  const theme = React.useMemo(() => getTalentforgeTheme(mode), [mode]);

  const navItems = [
    { label: "Dashboard", href: "/talentforge" },
    { label: "Applications", href: "/talentforge/applications" },
    { label: "Inbox", href: "/talentforge/inbox" },
    { label: "Settings", href: "/talentforge/settings" },
  ];

  if (!isReady) {
    return null;
  }

  return (
    <OpenAIKeyProvider>
      <TalentForgeDataProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          <ToastProvider>
            <ErrorBoundary>
              <LayoutShell navItems={navItems} mode={mode} toggleColorMode={toggleColorMode}>
                {children}
              </LayoutShell>
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </TalentForgeDataProvider>
    </OpenAIKeyProvider>
  );
}
