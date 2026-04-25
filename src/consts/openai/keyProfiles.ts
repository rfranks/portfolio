import type { AppOpenAIKeyStorageConfig } from "@/types/openAIKeyStorage";

export type OpenAIKeyAppId = "bookworm" | "talentforge" | "pathforger" | "rickbert" | "dna";

function withoutKey(keys: readonly string[], key: string): string[] {
  return keys.filter((candidate) => candidate !== key);
}

const KNOWN_APP_STORAGE_KEYS = {
  bookworm: "bookworm-openai-key",
  talentforge: "talentforge-openai-key",
  pathforger: "pathforger-openai-key",
  rickbert: "rickbert-openai-key",
  dna: "dna-openai-key",
} as const;

const CROSS_APP_KEY_FALLBACKS = Object.values(KNOWN_APP_STORAGE_KEYS);

export const OPENAI_KEY_STORAGE_CONFIG_BY_APP: Record<OpenAIKeyAppId, AppOpenAIKeyStorageConfig> = {
  bookworm: {
    primaryStorageKey: KNOWN_APP_STORAGE_KEYS.bookworm,
    fallbackStorageKeys: withoutKey(CROSS_APP_KEY_FALLBACKS, KNOWN_APP_STORAGE_KEYS.bookworm),
  },
  talentforge: {
    primaryStorageKey: KNOWN_APP_STORAGE_KEYS.talentforge,
    fallbackStorageKeys: withoutKey(CROSS_APP_KEY_FALLBACKS, KNOWN_APP_STORAGE_KEYS.talentforge),
  },
  pathforger: {
    primaryStorageKey: KNOWN_APP_STORAGE_KEYS.pathforger,
    fallbackStorageKeys: withoutKey(CROSS_APP_KEY_FALLBACKS, KNOWN_APP_STORAGE_KEYS.pathforger),
  },
  rickbert: {
    primaryStorageKey: KNOWN_APP_STORAGE_KEYS.rickbert,
    fallbackStorageKeys: withoutKey(CROSS_APP_KEY_FALLBACKS, KNOWN_APP_STORAGE_KEYS.rickbert),
  },
  dna: {
    primaryStorageKey: KNOWN_APP_STORAGE_KEYS.dna,
    fallbackStorageKeys: withoutKey(CROSS_APP_KEY_FALLBACKS, KNOWN_APP_STORAGE_KEYS.dna),
  },
};
