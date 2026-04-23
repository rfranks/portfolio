import type { OpenAIRequestProfilesMap } from "@/types/openai/requestProfiles";

export const OPENAI_REQUEST_PROFILES: OpenAIRequestProfilesMap = {
  raw: {
    timeoutMs: 30_000,
    retries: 1,
    retryDelayMs: 600,
  },
  chatCompletions: {
    timeoutMs: 45_000,
    retries: 1,
    retryDelayMs: 600,
  },
  responses: {
    timeoutMs: 60_000,
    retries: 2,
    retryDelayMs: 700,
  },
  models: {
    timeoutMs: 20_000,
    retries: 1,
    retryDelayMs: 500,
  },
};
