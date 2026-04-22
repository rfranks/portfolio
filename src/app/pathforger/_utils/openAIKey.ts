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

export function setPathForgerOpenAIKey(value: string): void {
  setAppOpenAIKey(value, { primaryStorageKey: STORAGE_KEY });
}

export function hasPathForgerOpenAIKey(): boolean {
  return hasAppOpenAIKey({
    primaryStorageKey: STORAGE_KEY,
    fallbackStorageKeys: STORAGE_FALLBACK_KEYS,
  });
}
