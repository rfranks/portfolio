"use client";

export interface AppOpenAIKeyStorageConfig {
  primaryStorageKey: string;
  fallbackStorageKeys?: string[];
}

function readFromBrowserStorage(key: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  const sessionValue = window.sessionStorage.getItem(key) ?? "";
  const localValue = window.localStorage.getItem(key) ?? "";
  return (sessionValue || localValue).trim();
}

function writeToBrowserStorage(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = value.trim();
  window.localStorage.setItem(key, trimmed);
  window.sessionStorage.setItem(key, trimmed);
}

export function getAppOpenAIKey(config: AppOpenAIKeyStorageConfig): string {
  const keys = [config.primaryStorageKey, ...(config.fallbackStorageKeys ?? [])];

  for (const key of keys) {
    const stored = readFromBrowserStorage(key);
    if (stored.length > 0) {
      return stored;
    }
  }

  return (process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "").trim();
}

export function setAppOpenAIKey(
  value: string,
  config: AppOpenAIKeyStorageConfig,
): void {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  writeToBrowserStorage(config.primaryStorageKey, trimmed);
}

export function hasAppOpenAIKey(config: AppOpenAIKeyStorageConfig): boolean {
  return getAppOpenAIKey(config).length > 0;
}
