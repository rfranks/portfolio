export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class HttpRequestError extends Error {
  status: number;
  statusText: string;
  url: string;
  payload?: unknown;

  constructor(params: {
    message: string;
    status: number;
    statusText: string;
    url: string;
    payload?: unknown;
  }) {
    super(params.message);
    this.name = "HttpRequestError";
    this.status = params.status;
    this.statusText = params.statusText;
    this.url = params.url;
    this.payload = params.payload;
  }
}

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

const DEFAULT_TIMEOUT_MS = 25_000;
const DEFAULT_RETRY_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function resolveErrorMessage(params: {
  response: Response;
  payload: unknown;
  url: string;
}): string {
  const { response, payload, url } = params;
  if (
    isObjectLike(payload) &&
    isObjectLike(payload.error) &&
    typeof payload.error.message === "string"
  ) {
    const message = payload.error.message.trim();
    if (message.length > 0) {
      return message;
    }
  }

  if (
    isObjectLike(payload) &&
    typeof payload.message === "string" &&
    payload.message.trim().length > 0
  ) {
    return payload.message.trim();
  }

  return `Request failed (${response.status} ${response.statusText}) for ${url}`;
}

function shouldRetryDefault(response: Response | null, error: unknown): boolean {
  if (response) {
    return response.status === 429 || response.status >= 500;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return false;
  }

  return true;
}

function mergeSignals(
  parent?: AbortSignal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const onAbort = () => {
    controller.abort();
  };

  if (parent) {
    if (parent.aborted) {
      controller.abort();
    } else {
      parent.addEventListener("abort", onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      parent?.removeEventListener("abort", onAbort);
    },
  };
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<{ data: T; response: Response }> {
  const retries = Math.max(0, options.retries ?? 0);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const { signal, cleanup } = mergeSignals(options.signal, options.timeoutMs);

    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: options.headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        cache: options.cache,
        signal,
      });

      const payload = await safeParseJson(response);

      if (response.ok) {
        return { data: payload as T, response };
      }

      const error = new HttpRequestError({
        message: resolveErrorMessage({ response, payload, url }),
        status: response.status,
        statusText: response.statusText,
        url,
        payload,
      });

      const canRetry =
        attempt < retries &&
        (options.shouldRetry?.(response, error, attempt) ?? shouldRetryDefault(response, error));

      if (!canRetry) {
        throw error;
      }

      await sleep(retryDelayMs * (attempt + 1));
      attempt += 1;
      continue;
    } catch (error) {
      lastError = error;
      const canRetry =
        attempt < retries &&
        (options.shouldRetry?.(null, error, attempt) ?? shouldRetryDefault(null, error));

      if (!canRetry) {
        throw error;
      }

      await sleep(retryDelayMs * (attempt + 1));
      attempt += 1;
    } finally {
      cleanup();
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed.");
}

export async function fetchText(
  url: string,
  options: Omit<FetchJsonOptions, "body"> & { body?: string } = {},
): Promise<{ data: string; response: Response }> {
  const retries = Math.max(0, options.retries ?? 0);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const { signal, cleanup } = mergeSignals(options.signal, options.timeoutMs);

    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: options.headers,
        body: options.body,
        cache: options.cache,
        signal,
      });

      if (response.ok) {
        return { data: await response.text(), response };
      }

      const payload = await safeParseJson(response);
      const error = new HttpRequestError({
        message: resolveErrorMessage({ response, payload, url }),
        status: response.status,
        statusText: response.statusText,
        url,
        payload,
      });

      const canRetry =
        attempt < retries &&
        (options.shouldRetry?.(response, error, attempt) ?? shouldRetryDefault(response, error));

      if (!canRetry) {
        throw error;
      }

      await sleep(retryDelayMs * (attempt + 1));
      attempt += 1;
      continue;
    } catch (error) {
      lastError = error;
      const canRetry =
        attempt < retries &&
        (options.shouldRetry?.(null, error, attempt) ?? shouldRetryDefault(null, error));

      if (!canRetry) {
        throw error;
      }

      await sleep(retryDelayMs * (attempt + 1));
      attempt += 1;
    } finally {
      cleanup();
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed.");
}
