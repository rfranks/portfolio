"use client";

import * as React from "react";
import type { PaletteMode } from "@mui/material";

interface UseColorModePreferenceOptions {
  defaultMode?: PaletteMode;
  storageKey?: string;
}

interface UseColorModePreferenceResult {
  mode: PaletteMode;
  toggleColorMode: () => void;
  isReady: boolean;
}

export function useColorModePreference({
  defaultMode = "dark",
  storageKey,
}: UseColorModePreferenceOptions = {}): UseColorModePreferenceResult {
  const [mode, setMode] = React.useState<PaletteMode | null>(() =>
    storageKey ? null : defaultMode,
  );

  React.useEffect(() => {
    if (!storageKey) {
      return;
    }

    const storedMode = window.localStorage.getItem(storageKey);

    if (storedMode === "light" || storedMode === "dark") {
      setMode(storedMode);
      return;
    }

    setMode(defaultMode);
  }, [defaultMode, storageKey]);

  const toggleColorMode = React.useCallback(() => {
    setMode((prevMode) => {
      const nextMode = (prevMode ?? defaultMode) === "light" ? "dark" : "light";

      if (storageKey) {
        window.localStorage.setItem(storageKey, nextMode);
      }

      return nextMode;
    });
  }, [defaultMode, storageKey]);

  return {
    mode: mode ?? defaultMode,
    toggleColorMode,
    isReady: storageKey ? mode !== null : true,
  };
}
