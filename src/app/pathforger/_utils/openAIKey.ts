"use client";

import {
  getOpenAIKeyForApp,
  hasOpenAIKeyForApp,
  setOpenAIKeyForApp,
} from "@/utils/openai/keyService";

export function getPathForgerOpenAIKey(): string {
  return getOpenAIKeyForApp("pathforger");
}

export function getPathForgerOpenAIKeyForInterstitial(): string {
  const requireExplicitPathForgerKey = process.env.NODE_ENV === "development";
  return getOpenAIKeyForApp("pathforger", {
    includeFallbackStorageKeys: !requireExplicitPathForgerKey,
    includeEnvFallback: !requireExplicitPathForgerKey,
  });
}

export function setPathForgerOpenAIKey(value: string): void {
  setOpenAIKeyForApp("pathforger", value);
}

export function hasPathForgerOpenAIKey(): boolean {
  return hasOpenAIKeyForApp("pathforger");
}
