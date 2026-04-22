"use client";

import { getAppOpenAIKey, hasAppOpenAIKey, setAppOpenAIKey } from "@/utils/openAIKeyStorage";

const STORAGE_KEY = "pathforger-openai-key";
const STORAGE_FALLBACK_KEYS = ["rickbert-openai-key", "talentforge-openai-key"];

export function getPathForgerOpenAIKey(): string {
  return getAppOpenAIKey({
    primaryStorageKey: STORAGE_KEY,
    fallbackStorageKeys: STORAGE_FALLBACK_KEYS,
  });
}

export function getPathForgerOpenAIKeyForInterstitial(): string {
  const requireExplicitPathForgerKey = process.env.NODE_ENV === "development";
  return getAppOpenAIKey(
    {
      primaryStorageKey: STORAGE_KEY,
      fallbackStorageKeys: STORAGE_FALLBACK_KEYS,
    },
    {
      includeFallbackStorageKeys: !requireExplicitPathForgerKey,
      includeEnvFallback: !requireExplicitPathForgerKey,
    },
  );
}

export function setPathForgerOpenAIKey(value: string): void {
  setAppOpenAIKey(value, { primaryStorageKey: STORAGE_KEY });
}

export function hasPathForgerOpenAIKey(): boolean {
  return hasAppOpenAIKey({
    primaryStorageKey: STORAGE_KEY,
    fallbackStorageKeys: STORAGE_FALLBACK_KEYS,
  });
}
