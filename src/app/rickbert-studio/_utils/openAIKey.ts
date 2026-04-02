"use client";

const STORAGE_KEY = "rickbert-openai-key";

export function getRickbertOpenAIKey(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
  const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "";
  return (stored || envKey).trim();
}

export function setRickbertOpenAIKey(value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, value.trim());
}

export function hasRickbertOpenAIKey(): boolean {
  return getRickbertOpenAIKey().length > 0;
}
