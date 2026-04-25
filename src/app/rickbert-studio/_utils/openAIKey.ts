"use client";

import {
  getOpenAIKeyForApp,
  hasOpenAIKeyForApp,
  setOpenAIKeyForApp,
} from "@/utils/openai/keyService";

export function getRickbertOpenAIKey(): string {
  return getOpenAIKeyForApp("rickbert");
}

export function setRickbertOpenAIKey(value: string): void {
  setOpenAIKeyForApp("rickbert", value);
}

export function hasRickbertOpenAIKey(): boolean {
  return hasOpenAIKeyForApp("rickbert");
}
