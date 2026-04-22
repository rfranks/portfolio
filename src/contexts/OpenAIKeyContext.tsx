"use client";

import * as React from "react";
import {
  deleteOpenAIKey as removePersistedKey,
  getOpenAIKey as loadPersistedKey,
  setOpenAIKey as persistOpenAIKey,
} from "@/app/talentforge/_utils/dataStore";

const SESSION_STORAGE_KEY = "talentforge-openai-key";
const PERSIST_STORAGE_KEY = "talentforge-openai-key-persist";

export type OpenAIKeyValidity = "unknown" | "checking" | "valid" | "invalid";

export interface OpenAIKeyState {
  key: string;
  persist: boolean;
  validity: OpenAIKeyValidity;
}

class OpenAIKeyStore {
  private state: OpenAIKeyState;
  private listeners: Set<() => void>;

  constructor() {
    this.listeners = new Set();
    this.state = this.readInitialState();
    if (typeof window !== "undefined") {
      this.persistToStorage();
    }
  }

  private readInitialState(): OpenAIKeyState {
    const envKey = (process.env.NEXT_PUBLIC_OPENAI_API_KEY || "").trim();

    if (typeof window === "undefined") {
      return { key: envKey, persist: false, validity: "unknown" };
    }

    const storedPersist = window.localStorage.getItem(PERSIST_STORAGE_KEY);
    const persist = storedPersist === "true";
    const sessionKey = window.sessionStorage.getItem(SESSION_STORAGE_KEY) || "";
    const persistedKey = persist ? loadPersistedKey() || "" : "";
    const key = (sessionKey || persistedKey || envKey).trim();

    return {
      key,
      persist,
      validity: "unknown",
    };
  }

  private persistToStorage() {
    if (typeof window === "undefined") return;

    const { key, persist } = this.state;
    const trimmed = key.trim();

    if (trimmed) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, trimmed);
    } else {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

    window.localStorage.setItem(PERSIST_STORAGE_KEY, persist ? "true" : "false");

    if (persist && trimmed) {
      persistOpenAIKey(trimmed);
    } else {
      removePersistedKey();
    }
  }

  getState = (): OpenAIKeyState => this.state;

  private update(partial: Partial<OpenAIKeyState>) {
    this.state = { ...this.state, ...partial };

    if (!this.state.key.trim() && partial.validity === undefined) {
      this.state = { ...this.state, validity: "unknown" };
    }

    if (typeof window !== "undefined") {
      this.persistToStorage();
    }

    for (const listener of this.listeners) {
      listener();
    }
  }

  setKey(key: string, options?: { persist?: boolean; validity?: OpenAIKeyValidity }) {
    const trimmed = key.trim();
    const partial: Partial<OpenAIKeyState> = { key: trimmed };

    if (typeof options?.persist === "boolean") {
      partial.persist = options.persist;
    }

    if (options?.validity) {
      partial.validity = options.validity;
    } else {
      partial.validity = "unknown";
    }

    this.update(partial);
  }

  setPersist(persist: boolean) {
    this.update({ persist });
  }

  setValidity(validity: OpenAIKeyValidity) {
    this.update({ validity });
  }

  clearKey() {
    this.update({ key: "", validity: "unknown" });
  }

  ensureKey(): string {
    const trimmed = this.state.key.trim();
    if (!trimmed) {
      throw new Error("OpenAI API key is not set");
    }
    return trimmed;
  }

  hasKey(): boolean {
    return this.state.key.trim().length > 0;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  reloadFromStorage() {
    this.state = this.readInitialState();
    if (typeof window !== "undefined") {
      this.persistToStorage();
    }
    for (const listener of this.listeners) {
      listener();
    }
  }
}

const store = new OpenAIKeyStore();

const OpenAIKeyContext = React.createContext<OpenAIKeyStore | null>(null);

export function OpenAIKeyProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  return <OpenAIKeyContext.Provider value={store}>{children}</OpenAIKeyContext.Provider>;
}

export function useOpenAIKey() {
  const keyStore = React.useContext(OpenAIKeyContext);
  if (!keyStore) {
    throw new Error("useOpenAIKey must be used within an OpenAIKeyProvider");
  }

  const state = React.useSyncExternalStore(
    keyStore.subscribe,
    keyStore.getState,
    keyStore.getState,
  );

  const setKey = React.useCallback(
    (value: string, options?: { persist?: boolean; validity?: OpenAIKeyValidity }) =>
      keyStore.setKey(value, options),
    [keyStore],
  );
  const setPersist = React.useCallback((value: boolean) => keyStore.setPersist(value), [keyStore]);
  const setValidity = React.useCallback(
    (value: OpenAIKeyValidity) => keyStore.setValidity(value),
    [keyStore],
  );
  const clearKey = React.useCallback(() => keyStore.clearKey(), [keyStore]);
  const ensureKey = React.useCallback(() => keyStore.ensureKey(), [keyStore]);
  const hasKey = React.useMemo(() => state.key.trim().length > 0, [state.key]);
  const reloadFromStorage = React.useCallback(() => keyStore.reloadFromStorage(), [keyStore]);

  return {
    key: state.key,
    persist: state.persist,
    validity: state.validity,
    hasKey,
    setKey,
    setPersist,
    setValidity,
    clearKey,
    ensureKey,
    reloadFromStorage,
  };
}

export function ensureOpenAIKey(): string {
  return store.ensureKey();
}

export function hasOpenAIKey(): boolean {
  return store.hasKey();
}

export function setOpenAIKey(
  key: string,
  options?: { persist?: boolean; validity?: OpenAIKeyValidity },
): void {
  store.setKey(key, options);
}

export function setOpenAIKeyValidity(validity: OpenAIKeyValidity): void {
  store.setValidity(validity);
}

export function clearStoredOpenAIKey(): void {
  store.clearKey();
}

export function getOpenAIKeySnapshot(): OpenAIKeyState {
  return store.getState();
}

export function reloadOpenAIKeyFromStorage(): void {
  store.reloadFromStorage();
}
