import { OPENAI_REQUEST_PROFILES } from "@/consts/openai/requestProfiles";
import { requestJsonWithProfile } from "@/utils/network/httpClient";
import type {
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResult,
  OpenAIEndpointPath,
  OpenAIResponsesRequest,
  OpenAIResponsesResult,
} from "@/types/openai/client";
import type { OpenAIRequestProfileName } from "@/types/openai/requestProfiles";
import type { HttpRequestProfileOverrides } from "@/types/network/httpClient";

const OPENAI_API_BASE = "https://api.openai.com/v1";

type OpenAIRequestOverrides = HttpRequestProfileOverrides;

function buildHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey.trim()}`,
  };
}

async function requestOpenAIJson<TPayload = Record<string, unknown>>(params: {
  apiKey: string;
  path: OpenAIEndpointPath;
  method: "GET" | "POST";
  body?: unknown;
  profile: OpenAIRequestProfileName;
  options?: OpenAIRequestOverrides;
  throwOnHttpError?: boolean;
}): Promise<{ response: Response; data: TPayload }> {
  return requestJsonWithProfile<TPayload>(`${OPENAI_API_BASE}${params.path}`, {
    profile: OPENAI_REQUEST_PROFILES[params.profile],
    profileOverrides: params.options,
    method: params.method,
    headers: buildHeaders(params.apiKey),
    body: params.body,
    throwOnHttpError: params.throwOnHttpError ?? true,
  });
}

export async function requestOpenAIJsonRaw<TPayload = Record<string, unknown>>(params: {
  apiKey: string;
  path: OpenAIEndpointPath;
  method: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
  profile?: OpenAIRequestProfileName;
  profileOverrides?: Omit<OpenAIRequestOverrides, "signal">;
}): Promise<{ response: Response; data: TPayload }> {
  const resolvedProfile =
    params.profile ??
    (params.path === "/responses"
      ? "responses"
      : params.path === "/chat/completions"
        ? "chatCompletions"
        : params.path === "/models"
          ? "models"
          : "raw");

  return requestOpenAIJson<TPayload>({
    apiKey: params.apiKey,
    path: params.path,
    method: params.method,
    body: params.body,
    profile: resolvedProfile,
    options: {
      ...(params.profileOverrides ?? {}),
      signal: params.signal,
    },
    throwOnHttpError: false,
  });
}

export async function requestOpenAIChatCompletions(
  apiKey: string,
  body: OpenAIChatCompletionRequest,
  options?: OpenAIRequestOverrides,
): Promise<OpenAIChatCompletionResult> {
  const { data } = await requestOpenAIJson<OpenAIChatCompletionResult>({
    apiKey,
    path: "/chat/completions",
    method: "POST",
    body,
    profile: "chatCompletions",
    options,
  });
  return data;
}

export async function requestOpenAIResponses(
  apiKey: string,
  body: OpenAIResponsesRequest,
  options?: OpenAIRequestOverrides,
): Promise<OpenAIResponsesResult> {
  const { data } = await requestOpenAIJson<OpenAIResponsesResult>({
    apiKey,
    path: "/responses",
    method: "POST",
    body,
    profile: "responses",
    options,
  });
  return data;
}

export async function requestOpenAIModels(
  apiKey: string,
  options?: OpenAIRequestOverrides,
): Promise<{ data?: Array<{ id?: string }> }> {
  const { data } = await requestOpenAIJson<{ data?: Array<{ id?: string }> }>({
    apiKey,
    path: "/models",
    method: "GET",
    profile: "models",
    options,
  });
  return data;
}

export function extractTextFromOpenAIChatContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (typeof entry === "object" && entry !== null && "text" in entry) {
          return (entry as { text?: string }).text ?? "";
        }

        return "";
      })
      .join("");
  }

  if (typeof content === "object" && content !== null && "text" in content) {
    return ((content as { text?: string }).text ?? "").toString();
  }

  return "";
}
