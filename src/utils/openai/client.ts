import { fetchJson } from "@/utils/network/httpClient";

const OPENAI_API_BASE = "https://api.openai.com/v1";

export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant" | "developer";
  content: unknown;
};

export type OpenAIChatCompletionRequest = {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
};

export type OpenAIResponsesRequest = {
  model: string;
  input: unknown;
  tools?: unknown[];
  tool_choice?: unknown;
};

export type OpenAIResponsesResult = Record<string, unknown>;

export type OpenAIChatCompletionResult = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

export type OpenAIEndpointPath = "/chat/completions" | "/responses" | "/models";

function buildHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey.trim()}`,
  };
}

export async function requestOpenAIJsonRaw<TPayload = Record<string, unknown>>(params: {
  apiKey: string;
  path: OpenAIEndpointPath;
  method: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
}): Promise<{ response: Response; data: TPayload }> {
  const response = await fetch(`${OPENAI_API_BASE}${params.path}`, {
    method: params.method,
    headers: buildHeaders(params.apiKey),
    body: params.body === undefined ? undefined : JSON.stringify(params.body),
    signal: params.signal,
  });

  const data = (await response.json().catch(() => ({}))) as TPayload;
  return { response, data };
}

export async function requestOpenAIChatCompletions(
  apiKey: string,
  body: OpenAIChatCompletionRequest,
  options?: { timeoutMs?: number; retries?: number },
): Promise<OpenAIChatCompletionResult> {
  const { data } = await fetchJson<OpenAIChatCompletionResult>(
    `${OPENAI_API_BASE}/chat/completions`,
    {
      method: "POST",
      headers: buildHeaders(apiKey),
      body,
      timeoutMs: options?.timeoutMs,
      retries: options?.retries ?? 1,
    },
  );

  return data;
}

export async function requestOpenAIResponses(
  apiKey: string,
  body: OpenAIResponsesRequest,
  options?: { timeoutMs?: number; retries?: number },
): Promise<OpenAIResponsesResult> {
  const { data } = await fetchJson<OpenAIResponsesResult>(`${OPENAI_API_BASE}/responses`, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body,
    timeoutMs: options?.timeoutMs,
    retries: options?.retries ?? 1,
  });

  return data;
}

export async function requestOpenAIModels(
  apiKey: string,
  options?: { timeoutMs?: number; retries?: number },
): Promise<{ data?: Array<{ id?: string }> }> {
  const { data } = await fetchJson<{ data?: Array<{ id?: string }> }>(`${OPENAI_API_BASE}/models`, {
    method: "GET",
    headers: buildHeaders(apiKey),
    timeoutMs: options?.timeoutMs,
    retries: options?.retries ?? 1,
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
