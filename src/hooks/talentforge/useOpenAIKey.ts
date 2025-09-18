"use client";

import { useCallback, useEffect, useState } from "react";

import { hasOpenAIKey } from "@/utils/talentforge/utils";

const STORAGE_KEYS = [
  "talentforge-openai-key",
  "talentforge-openai-key-persist",
];

export function useOpenAIKey() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(() => {
    setHasKey(hasOpenAIKey());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key && !STORAGE_KEYS.includes(event.key)) {
        return;
      }
      refresh();
    };

    const handleFocus = () => {
      refresh();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  const openModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    refresh();
  }, [refresh]);

  return {
    hasKey,
    isChecking: hasKey === null,
    openModal,
    closeModal,
    modalOpen,
    refresh,
  };
}

export default useOpenAIKey;
