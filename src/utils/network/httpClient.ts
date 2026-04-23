import type {
  FetchJsonOptions,
  HttpRequestProfile,
  HttpRequestProfileOverrides,
} from "@/types/network/httpClient";

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

function createAbortReason(message: string, name: "AbortError" | "TimeoutError"): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, name);
  }

  const error = new Error(message);
  error.name = name;
  return error;
}

type RetryPredicate = (response: Response | null, error: unknown, attempt: number) => boolean;

type RequestWithRetryParams<TSuccess> = {
  url: string;
  method?: string;
  headers?: HeadersInit;
  cache?: RequestCache;
  body?: BodyInit;
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  shouldRetry?: RetryPredicate;
  throwOnHttpError?: boolean;
  parseSuccess: (response: Response) => Promise<TSuccess>;
  parseErrorPayload: (response: Response) => Promise<unknown>;
};

function mergeSignals(
  parent?: AbortSignal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(createAbortReason(`Request timed out after ${timeoutMs}ms.`, "TimeoutError"));
  }, timeoutMs);

  const onAbort = () => {
    if (parent?.aborted) {
      controller.abort(
        parent.reason ?? createAbortReason("Request aborted by caller.", "AbortError"),
      );
      return;
    }
    controller.abort(createAbortReason("Request aborted.", "AbortError"));
  };

  if (parent) {
    if (parent.aborted) {
      controller.abort(
        parent.reason ?? createAbortReason("Request aborted by caller.", "AbortError"),
      );
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

async function requestWithRetry<TSuccess>(
  params: RequestWithRetryParams<TSuccess>,
): Promise<{ data: TSuccess; response: Response }> {
  const retries = Math.max(0, params.retries ?? 0);
  const retryDelayMs = Math.max(0, params.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const { signal, cleanup } = mergeSignals(params.signal, params.timeoutMs);

    try {
      const response = await fetch(params.url, {
        method: params.method ?? "GET",
        headers: params.headers,
        body: params.body,
        cache: params.cache,
        signal,
      });

      if (response.ok) {
        const data = await params.parseSuccess(response);
        return { data, response };
      }

      const payload = await params.parseErrorPayload(response);
      const error = new HttpRequestError({
        message: resolveErrorMessage({ response, payload, url: params.url }),
        status: response.status,
        statusText: response.statusText,
        url: params.url,
        payload,
      });

      const canRetry =
        attempt < retries &&
        (params.shouldRetry?.(response, error, attempt) ?? shouldRetryDefault(response, error));

      if (!canRetry) {
        if (params.throwOnHttpError === false) {
          return { data: payload as TSuccess, response };
        }
        throw error;
      }

      await sleep(retryDelayMs * (attempt + 1));
      attempt += 1;
      continue;
    } catch (error) {
      lastError = error;
      const canRetry =
        attempt < retries &&
        (params.shouldRetry?.(null, error, attempt) ?? shouldRetryDefault(null, error));

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

export type RequestJsonOptions = FetchJsonOptions & {
  throwOnHttpError?: boolean;
};

export type RequestJsonWithProfileOptions = Omit<
  RequestJsonOptions,
  "signal" | "timeoutMs" | "retries" | "retryDelayMs"
> & {
  profile: HttpRequestProfile;
  profileOverrides?: HttpRequestProfileOverrides;
};

export async function requestJson<T>(
  url: string,
  options: RequestJsonOptions = {},
): Promise<{ data: T; response: Response }> {
  return requestWithRetry<T>({
    url,
    method: options.method ?? "GET",
    headers: options.headers,
    cache: options.cache,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    timeoutMs: options.timeoutMs,
    retries: options.retries,
    retryDelayMs: options.retryDelayMs,
    shouldRetry: options.shouldRetry,
    throwOnHttpError: options.throwOnHttpError,
    parseSuccess: async (response) => (await safeParseJson(response)) as T,
    parseErrorPayload: safeParseJson,
  });
}

export async function requestJsonWithProfile<T>(
  url: string,
  options: RequestJsonWithProfileOptions,
): Promise<{ data: T; response: Response }> {
  const resolvedTimeoutMs = options.profileOverrides?.timeoutMs ?? options.profile.timeoutMs;
  const resolvedRetries = options.profileOverrides?.retries ?? options.profile.retries;
  const resolvedRetryDelayMs =
    options.profileOverrides?.retryDelayMs ?? options.profile.retryDelayMs;

  return requestJson<T>(url, {
    method: options.method,
    headers: options.headers,
    body: options.body,
    cache: options.cache,
    shouldRetry: options.shouldRetry,
    throwOnHttpError: options.throwOnHttpError,
    signal: options.profileOverrides?.signal,
    timeoutMs: resolvedTimeoutMs,
    retries: resolvedRetries,
    retryDelayMs: resolvedRetryDelayMs,
  });
}

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<{ data: T; response: Response }> {
  return requestJson<T>(url, {
    ...options,
    throwOnHttpError: true,
  });
}

export async function fetchText(
  url: string,
  options: Omit<FetchJsonOptions, "body"> & { body?: string } = {},
): Promise<{ data: string; response: Response }> {
  return requestWithRetry<string>({
    url,
    method: options.method ?? "GET",
    headers: options.headers,
    cache: options.cache,
    body: options.body,
    signal: options.signal,
    timeoutMs: options.timeoutMs,
    retries: options.retries,
    retryDelayMs: options.retryDelayMs,
    shouldRetry: options.shouldRetry,
    throwOnHttpError: true,
    parseSuccess: async (response) => response.text(),
    parseErrorPayload: safeParseJson,
  });
}
