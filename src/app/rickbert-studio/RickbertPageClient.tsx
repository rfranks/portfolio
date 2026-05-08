"use client";

import * as React from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { OpenAIKeyInterstitialContent } from "@/components/shared";
import RickbertStudioApp from "@/app/rickbert-studio/_app/RickbertStudioApp";
import { useRickbertStudioStore } from "@/app/rickbert-studio/_store";
import { useOpenAIKeyGateAppShell } from "@/hooks/app/useOpenAIAppShell";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { withBasePath } from "@/utils/basePath";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";

const defaultTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function RickbertPageClient() {
  const { portfolioApps } = useResumeData();
  const rickbertRoute = getPortfolioAppRouteContract(portfolioApps, "rickbert");
  const setStoreOpenAIKey = useRickbertStudioStore((state) => state.setOpenAIKey);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const keyGate = useOpenAIKeyGateAppShell({
    documentTitle: rickbertRoute.documentTitle,
    appId: "rickbert",
    keyInputRef: inputRef,
    onHydratedKey: setStoreOpenAIKey,
    onValidKeySubmit: setStoreOpenAIKey,
  });

  if (keyGate.isBooting) {
    return null;
  }

  if (keyGate.isOpenAIKeyGateVisible) {
    return (
      <ThemeProvider theme={defaultTheme}>
        <CssBaseline enableColorScheme />
        <OpenAIKeyInterstitialContent
          appName={rickbertRoute.interstitialAppName}
          logoAlt={rickbertRoute.interstitialLogoAlt}
          logoSrc={withBasePath(rickbertRoute.interstitialLogoSrc)}
          value={keyGate.draftKey}
          onChange={keyGate.setDraftKey}
          onSubmit={keyGate.handleKeySubmit}
          inputRef={inputRef}
          buttonLabel="Enter Studio"
          textFieldName="rickbertApiKey"
          errorText={keyGate.keyError || undefined}
        />
      </ThemeProvider>
    );
  }

  return <RickbertStudioApp />;
}
