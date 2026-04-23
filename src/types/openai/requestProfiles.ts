import type { HttpRequestProfile } from "@/types/network/httpClient";

export type OpenAIRequestProfileName = "raw" | "chatCompletions" | "responses" | "models";

export type OpenAIRequestProfilesMap = Record<OpenAIRequestProfileName, HttpRequestProfile>;
