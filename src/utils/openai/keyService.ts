"use client";

import { OPENAI_KEY_STORAGE_CONFIG_BY_APP, type OpenAIKeyAppId } from "@/consts/openai/keyProfiles";
import type {
  AppOpenAIKeyClearOptions,
  AppOpenAIKeyReadOptions,
  AppOpenAIKeyStorageConfig,
  AppOpenAIKeyWriteOptions,
} from "@/types/openAIKeyStorage";
import {
  clearAppOpenAIKey,
  getAppOpenAIKey,
  hasAppOpenAIKey,
  setAppOpenAIKey,
} from "@/utils/openAIKeyStorage";

function getStorageConfig(appId: OpenAIKeyAppId): AppOpenAIKeyStorageConfig {
  return OPENAI_KEY_STORAGE_CONFIG_BY_APP[appId];
}

export function getOpenAIKeyStorageConfigForApp(appId: OpenAIKeyAppId): AppOpenAIKeyStorageConfig {
  return getStorageConfig(appId);
}

export function getOpenAIKeyForApp(
  appId: OpenAIKeyAppId,
  options?: AppOpenAIKeyReadOptions,
): string {
  return getAppOpenAIKey(getStorageConfig(appId), options);
}

export function setOpenAIKeyForApp(
  appId: OpenAIKeyAppId,
  value: string,
  options?: AppOpenAIKeyWriteOptions,
): void {
  setAppOpenAIKey(value, getStorageConfig(appId), options);
}

export function hasOpenAIKeyForApp(appId: OpenAIKeyAppId): boolean {
  return hasAppOpenAIKey(getStorageConfig(appId));
}

export function clearOpenAIKeyForApp(
  appId: OpenAIKeyAppId,
  options?: AppOpenAIKeyClearOptions,
): void {
  clearAppOpenAIKey(getStorageConfig(appId), options);
}

export function ensureOpenAIKeyForApp(
  appId: OpenAIKeyAppId,
  options?: AppOpenAIKeyReadOptions,
): string {
  const key = getOpenAIKeyForApp(appId, options).trim();
  if (!key) {
    throw new Error("OpenAI API key is not set");
  }
  return key;
}
