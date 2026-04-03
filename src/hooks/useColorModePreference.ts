"use client";

import * as React from "react";
import type { PaletteMode } from "@mui/material";
import type {
  UseColorModePreferenceOptions,
  UseColorModePreferenceResult,
} from "@/types/hooks/colorMode";

export function useColorModePreference({
  defaultMode = "dark",
  storageKey,
  legacyStorageKeys = [],
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

    for (const legacyStorageKey of legacyStorageKeys) {
      const legacyMode = window.localStorage.getItem(legacyStorageKey);

      if (legacyMode === "light" || legacyMode === "dark") {
        window.localStorage.setItem(storageKey, legacyMode);
        setMode(legacyMode);
        return;
      }
    }

    setMode(defaultMode);
  }, [defaultMode, legacyStorageKeys, storageKey]);

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
