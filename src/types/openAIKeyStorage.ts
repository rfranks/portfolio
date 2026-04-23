export interface AppOpenAIKeyStorageConfig {
  primaryStorageKey: string;
  fallbackStorageKeys?: string[];
}

export interface AppOpenAIKeyReadOptions {
  includeFallbackStorageKeys?: boolean;
  includeEnvFallback?: boolean;
}
