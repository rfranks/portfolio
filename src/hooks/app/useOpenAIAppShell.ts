import * as React from "react";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";

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
