import * as React from "react";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import type { OpenAIKeyAppId } from "@/consts/openai/keyProfiles";
import { getOpenAIKeyGateSnapshotForApp, setOpenAIKeyForApp } from "@/utils/openai/keyService";

export type UseOpenAIAppShellParams = {
  documentTitle: string;
  isReady?: boolean;
  hasOpenAIKey: boolean;
  keyInputRef?: React.RefObject<HTMLInputElement | null>;
};

export type OpenAIAppShellState = {
  isBooting: boolean;
  isOpenAIKeyGateVisible: boolean;
  canRenderApp: boolean;
};

export type UseOpenAIKeyGateAppShellParams = {
  documentTitle: string;
  appId?: OpenAIKeyAppId;
  isReady?: boolean;
  keyInputRef?: React.RefObject<HTMLInputElement | null>;
  autoHydrate?: boolean;
  emptyKeyErrorText?: string;
  readStoredKey?: () => string;
  writeStoredKey?: (value: string) => void;
  onHydratedKey?: (key: string) => void;
  onValidKeySubmit?: (key: string) => void;
};

export type OpenAIKeyGateAppShellState = OpenAIAppShellState & {
  draftKey: string;
  setDraftKey: React.Dispatch<React.SetStateAction<string>>;
  keyError: string;
  setKeyError: React.Dispatch<React.SetStateAction<string>>;
  hasOpenAIKey: boolean;
  setHasOpenAIKey: React.Dispatch<React.SetStateAction<boolean>>;
  hydrateStoredKey: () => string;
  handleKeySubmit: (event?: React.FormEvent<HTMLFormElement>) => boolean;
};

export function useOpenAIAppShell({
  documentTitle,
  isReady = true,
  hasOpenAIKey,
  keyInputRef,
}: UseOpenAIAppShellParams): OpenAIAppShellState {
  const { setDocumentTitle } = useDocumentTitle();

  React.useEffect(() => {
    setDocumentTitle(documentTitle);
  }, [documentTitle, setDocumentTitle]);

  const isBooting = !isReady;
  const isOpenAIKeyGateVisible = isReady && !hasOpenAIKey;
  const canRenderApp = isReady && hasOpenAIKey;

  React.useEffect(() => {
    if (!isOpenAIKeyGateVisible || !keyInputRef?.current) {
      return;
    }

    keyInputRef.current.focus();
  }, [isOpenAIKeyGateVisible, keyInputRef]);

  return {
    isBooting,
    isOpenAIKeyGateVisible,
    canRenderApp,
  };
}

export function useOpenAIKeyGateAppShell({
  documentTitle,
  appId,
  isReady = true,
  keyInputRef,
  autoHydrate = true,
  emptyKeyErrorText = "OpenAI API key is required.",
  readStoredKey,
  writeStoredKey,
  onHydratedKey,
  onValidKeySubmit,
}: UseOpenAIKeyGateAppShellParams): OpenAIKeyGateAppShellState {
  const resolveReadStoredKey = React.useCallback(() => {
    if (readStoredKey) {
      return readStoredKey();
    }
    if (!appId) {
      return "";
    }
    return getOpenAIKeyGateSnapshotForApp(appId).key;
  }, [appId, readStoredKey]);

  const resolveWriteStoredKey = React.useCallback(
    (value: string) => {
      if (writeStoredKey) {
        writeStoredKey(value);
        return;
      }
      if (!appId) {
        return;
      }
      setOpenAIKeyForApp(appId, value);
    },
    [appId, writeStoredKey],
  );

  const [hasOpenAIKey, setHasOpenAIKey] = React.useState(false);
  const [draftKey, setDraftKey] = React.useState("");
  const [keyError, setKeyError] = React.useState("");

  const hydrateStoredKey = React.useCallback(() => {
    const stored = resolveReadStoredKey().trim();
    setDraftKey(stored);
    setHasOpenAIKey(stored.length > 0);
    onHydratedKey?.(stored);
    return stored;
  }, [onHydratedKey, resolveReadStoredKey]);

  React.useEffect(() => {
    if (!autoHydrate) {
      return;
    }
    hydrateStoredKey();
  }, [autoHydrate, hydrateStoredKey]);

  const appShell = useOpenAIAppShell({
    documentTitle,
    isReady,
    hasOpenAIKey,
    keyInputRef,
  });

  const handleKeySubmit = React.useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const key = draftKey.trim();
      if (!key) {
        setKeyError(emptyKeyErrorText);
        return false;
      }

      resolveWriteStoredKey(key);
      setHasOpenAIKey(true);
      setDraftKey(key);
      setKeyError("");
      onValidKeySubmit?.(key);
      return true;
    },
    [draftKey, emptyKeyErrorText, onValidKeySubmit, resolveWriteStoredKey],
  );

  return {
    ...appShell,
    draftKey,
    setDraftKey,
    keyError,
    setKeyError,
    hasOpenAIKey,
    setHasOpenAIKey,
    hydrateStoredKey,
    handleKeySubmit,
  };
}
