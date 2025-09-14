"use client";

import * as React from "react";
import { CssBaseline, PaletteMode, ThemeProvider, useMediaQuery } from "@mui/material";
import LayoutShell from "@/components/talentforge/LayoutShell";
import getTalentforgeTheme from "@/themes/talentforgeTheme";
import { TalentForgeDataProvider } from "@/contexts/TalentForgeDataContext";

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
    { label: "Resumes", href: "/talentforge/resumes" },
    { label: "Offers", href: "/talentforge/offers" },
    { label: "Inbox", href: "/talentforge/inbox" },
    { label: "Settings", href: "/talentforge/settings" },
  ];

  return (
    <TalentForgeDataProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LayoutShell
          navItems={navItems}
          mode={mode}
          toggleColorMode={toggleColorMode}
        >
          {children}
        </LayoutShell>
      </ThemeProvider>
    </TalentForgeDataProvider>
  );
}
