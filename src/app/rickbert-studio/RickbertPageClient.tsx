"use client";

import * as React from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { OpenAIKeyInterstitialContent } from "@/components/shared";
import RickbertStudioApp from "@/app/rickbert-studio/_app/RickbertStudioApp";
import { useRickbertStudioStore } from "@/app/rickbert-studio/_store";
import { getRickbertOpenAIKey, setRickbertOpenAIKey } from "@/app/rickbert-studio/_utils/openAIKey";
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
  const setOpenAIKey = useRickbertStudioStore((state) => state.setOpenAIKey);
  const [ready, setReady] = React.useState(false);
  const [apiKeyReady, setApiKeyReady] = React.useState(false);
  const [draftKey, setDraftKey] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const key = getRickbertOpenAIKey();
    setDraftKey(key);
    setOpenAIKey(key);
    setApiKeyReady(key.length > 0);
    setReady(true);
  }, [setOpenAIKey]);

  React.useEffect(() => {
    document.title = rickbertRoute.documentTitle;
  }, [rickbertRoute.documentTitle]);

  React.useEffect(() => {
    if (ready && !apiKeyReady) {
      inputRef.current?.focus();
    }
  }, [apiKeyReady, ready]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const key = draftKey.trim();
    if (!key) {
      return;
    }

    setRickbertOpenAIKey(key);
    setOpenAIKey(key);
    setApiKeyReady(true);
    setDraftKey(key);
  };

  if (!ready) {
    return null;
  }

  if (!apiKeyReady) {
    return (
      <ThemeProvider theme={defaultTheme}>
        <CssBaseline enableColorScheme />
        <OpenAIKeyInterstitialContent
          appName={rickbertRoute.interstitialAppName}
          logoAlt={rickbertRoute.interstitialLogoAlt}
          logoSrc={withBasePath(rickbertRoute.interstitialLogoSrc)}
          value={draftKey}
          onChange={setDraftKey}
          onSubmit={handleSubmit}
          inputRef={inputRef}
          buttonLabel="Enter Studio"
          textFieldName="rickbertApiKey"
        />
      </ThemeProvider>
    );
  }

  return <RickbertStudioApp />;
}
