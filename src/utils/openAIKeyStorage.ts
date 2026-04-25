"use client";

import type {
  AppOpenAIKeyClearOptions,
  AppOpenAIKeyReadOptions,
  AppOpenAIKeyStorageConfig,
  AppOpenAIKeyWriteOptions,
} from "@/types/openAIKeyStorage";

function readFromBrowserStorage(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  const sessionValue = window.sessionStorage.getItem(key) ?? "";
  const localValue = window.localStorage.getItem(key) ?? "";
  return (sessionValue || localValue).trim();
}

function writeToBrowserStorage(
  key: string,
  value: string,
  options?: { persistInLocalStorage?: boolean; persistInSessionStorage?: boolean },
): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = value.trim();
  const shouldPersistInLocalStorage = options?.persistInLocalStorage ?? true;
  const shouldPersistInSessionStorage = options?.persistInSessionStorage ?? true;

  if (shouldPersistInLocalStorage) {
    window.localStorage.setItem(key, trimmed);
  } else {
    window.localStorage.removeItem(key);
  }

  if (shouldPersistInSessionStorage) {
    window.sessionStorage.setItem(key, trimmed);
  } else {
    window.sessionStorage.removeItem(key);
  }
}

function removeFromBrowserStorage(
  key: string,
  options?: { clearLocalStorage?: boolean; clearSessionStorage?: boolean },
): void {
  if (typeof window === "undefined") {
    return;
  }

  const shouldClearLocalStorage = options?.clearLocalStorage ?? true;
  const shouldClearSessionStorage = options?.clearSessionStorage ?? true;

  if (shouldClearLocalStorage) {
    window.localStorage.removeItem(key);
  }
  if (shouldClearSessionStorage) {
    window.sessionStorage.removeItem(key);
  }
}

export function getAppOpenAIKey(
  config: AppOpenAIKeyStorageConfig,
  options?: AppOpenAIKeyReadOptions,
): string {
  const includeFallbackStorageKeys = options?.includeFallbackStorageKeys ?? true;
  const includeEnvFallback = options?.includeEnvFallback ?? true;
  const keys = [
    config.primaryStorageKey,
    ...(includeFallbackStorageKeys ? (config.fallbackStorageKeys ?? []) : []),
  ];

  for (const key of keys) {
    const stored = readFromBrowserStorage(key);
    if (stored.length > 0) {
      return stored;
    }
  }

  return includeEnvFallback ? (process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "").trim() : "";
}

export function setAppOpenAIKey(
  value: string,
  config: AppOpenAIKeyStorageConfig,
  options?: AppOpenAIKeyWriteOptions,
): void {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  writeToBrowserStorage(config.primaryStorageKey, trimmed, options);
}

export function hasAppOpenAIKey(config: AppOpenAIKeyStorageConfig): boolean {
  return getAppOpenAIKey(config).length > 0;
}

export function clearAppOpenAIKey(
  config: AppOpenAIKeyStorageConfig,
  options?: AppOpenAIKeyClearOptions,
): void {
  removeFromBrowserStorage(config.primaryStorageKey, options);

  if (!options?.includeFallbackStorageKeys) {
    return;
  }

  (config.fallbackStorageKeys ?? []).forEach((storageKey) => {
    removeFromBrowserStorage(storageKey, options);
  });
}
