import type { PaletteMode } from "@mui/material";

export interface UseColorModePreferenceOptions {
  defaultMode?: PaletteMode;
  storageKey?: string;
  legacyStorageKeys?: readonly string[];
}

export interface UseColorModePreferenceResult {
  mode: PaletteMode;
  toggleColorMode: () => void;
  isReady: boolean;
}
