"use client";

import * as React from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import OpenAIKeyInterstitialContent from "@/components/OpenAIKeyInterstitialContent";
import RickbertStudioApp from "@/rickbert-studio/app/RickbertStudioApp";
import { useRickbertStudioStore } from "@/rickbert-studio/store";
import {
  getRickbertOpenAIKey,
  setRickbertOpenAIKey,
} from "@/rickbert-studio/utils/openAIKey";

const defaultTheme = createTheme();

export default function RickbertPageClient() {
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
        <CssBaseline />
        <OpenAIKeyInterstitialContent
          appName="Rickbert Studio"
          logoAlt="Rickbert Studio logo"
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
