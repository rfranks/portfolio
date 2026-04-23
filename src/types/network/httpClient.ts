export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpRequestProfile = {
  timeoutMs: number;
  retries: number;
  retryDelayMs: number;
};

export type HttpRequestProfileOverrides = Partial<HttpRequestProfile> & {
  signal?: AbortSignal;
};

export type FetchJsonOptions = {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: unknown;
  cache?: RequestCache;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  shouldRetry?: (response: Response | null, error: unknown, attempt: number) => boolean;
  signal?: AbortSignal;
};
