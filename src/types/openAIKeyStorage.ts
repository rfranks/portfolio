export interface AppOpenAIKeyStorageConfig {
  primaryStorageKey: string;
  fallbackStorageKeys?: string[];
}

export interface AppOpenAIKeyReadOptions {
  includeFallbackStorageKeys?: boolean;
  includeEnvFallback?: boolean;
}

export interface AppOpenAIKeyWriteOptions {
  persistInLocalStorage?: boolean;
  persistInSessionStorage?: boolean;
}

export interface AppOpenAIKeyClearOptions {
  includeFallbackStorageKeys?: boolean;
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
}
