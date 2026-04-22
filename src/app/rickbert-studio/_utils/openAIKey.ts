"use client";

import { getAppOpenAIKey, hasAppOpenAIKey, setAppOpenAIKey } from "@/utils/openAIKeyStorage";

const STORAGE_KEY = "rickbert-openai-key";
const STORAGE_FALLBACK_KEYS = ["pathforger-openai-key", "talentforge-openai-key"];

export function getRickbertOpenAIKey(): string {
  return getAppOpenAIKey({
    primaryStorageKey: STORAGE_KEY,
    fallbackStorageKeys: STORAGE_FALLBACK_KEYS,
  });
}

export function setRickbertOpenAIKey(value: string): void {
  setAppOpenAIKey(value, { primaryStorageKey: STORAGE_KEY });
}

export function hasRickbertOpenAIKey(): boolean {
  return hasAppOpenAIKey({
    primaryStorageKey: STORAGE_KEY,
    fallbackStorageKeys: STORAGE_FALLBACK_KEYS,
  });
}
