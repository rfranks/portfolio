"use client";

import type { ChatMessage } from "@/types/chat";
import type { HttpRequestProfileOverrides } from "@/types/network/httpClient";
import {
  extractTextFromOpenAIChatContent,
  requestOpenAIChatCompletions,
} from "@/utils/openai/client";

function isAbortLikeError(error: unknown): boolean {
  return (
    (error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")) ||
    (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError"))
  );
}

function createAbortError(message: string): Error {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }

  const fallback = new Error(message);
  fallback.name = "AbortError";
  return fallback;
}

async function sleepWithSignal(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return;
  }

  if (signal?.aborted) {
    throw signal.reason instanceof Error ? signal.reason : createAbortError("Request aborted.");
  }

  await new Promise<void>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
      const abortReason = signal?.reason;
      reject(abortReason instanceof Error ? abortReason : createAbortError("Request aborted."));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function requestCompletionWithRetry(args: {
  apiKey: string;
  systemMessage: string;
  model: string;
  temperature: number;
  topP: number;
  maxAttempts: number;
  retryDelayMs: number;
  requestProfileOverrides?: HttpRequestProfileOverrides;
}): Promise<string> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < args.maxAttempts) {
    try {
      const data = await requestOpenAIChatCompletions(
        args.apiKey,
        {
          model: args.model,
          temperature: args.temperature,
          top_p: args.topP,
          messages: [
            {
              role: "system",
              content: args.systemMessage,
            },
          ],
        },
        args.requestProfileOverrides,
      );
      const content = data?.choices?.[0]?.message?.content;
      const text = extractTextFromOpenAIChatContent(content) || "";

      if (text.trim().length > 0 || attempt === args.maxAttempts - 1) {
        return text;
      }

      throw new Error("OpenAI response was empty.");
    } catch (error) {
      if (isAbortLikeError(error)) {
        throw error;
      }

      lastError = error;
      attempt += 1;
      if (attempt >= args.maxAttempts) {
        break;
      }

      await sleepWithSignal(args.retryDelayMs * attempt, args.requestProfileOverrides?.signal);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenAI request failed.");
}

export type ChunkedOpenAIAskParams = {
  apiKey: string;
  context: string;
  user: string;
  system: string;
  aiBufferSize: number;
  chatHistory: (ChatMessage | null)[];
  onChatHistoryChange?: (chatHistory: (ChatMessage | null)[]) => void;
  onProgressChange?: (progress: number) => void;
  logMessagesToChatHistory?: boolean;
  returnFirstResponse?: boolean;
  thinkingMessage?: string;
  processingMessage?: string;
  readyMessage?: string;
  model?: string;
  temperature?: number;
  topP?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
  requestProfileOverrides?: HttpRequestProfileOverrides;
};

export async function askOpenAIInChunks(params: ChunkedOpenAIAskParams): Promise<ChatMessage> {
  const {
    aiBufferSize,
    user,
    system,
    apiKey,
    requestProfileOverrides,
    onChatHistoryChange,
    onProgressChange,
  } = params;

  const logMessagesToChatHistory = params.logMessagesToChatHistory ?? true;
  const returnFirstResponse = params.returnFirstResponse ?? false;
  const thinkingMessage = params.thinkingMessage ?? "I'm thinking...";
  const processingMessage = params.processingMessage ?? "Processing PDF...";
  const placeholderMessage = logMessagesToChatHistory ? thinkingMessage : processingMessage;
  const readyMessage = params.readyMessage ?? "Ready! Ask me anything about your PDF.";
  const model = params.model ?? "gpt-4.1-mini";
  const temperature = params.temperature ?? 0.5;
  const topP = params.topP ?? 0.8;
  const maxAttempts = Math.max(1, params.maxAttempts ?? 3);
  const retryDelayMs = Math.max(0, params.retryDelayMs ?? 500);

  const newChatHistory: (ChatMessage | null)[] = [
    ...params.chatHistory,
    logMessagesToChatHistory
      ? {
          role: "user",
          message: user || "",
          hasMore: false,
        }
      : null,
    {
      role: "assistant",
      message: placeholderMessage,
      hasMore: true,
    },
  ];

  onChatHistoryChange?.([...newChatHistory]);

  const newChatIndex = newChatHistory.length - 1;
  const initialContext = `${params.context}`;
  const totalContextLength = initialContext.length;

  let remainingContext = params.context;
  let responseText = "";

  do {
    const rest = remainingContext.substring(Math.min(aiBufferSize, remainingContext.length));
    const currentContext = remainingContext.substring(
      0,
      Math.min(aiBufferSize, remainingContext.length),
    );

    const systemMessage =
      `Question: ${user}\n\n` + system.replaceAll("{{context}}", currentContext);

    responseText = await requestCompletionWithRetry({
      apiKey,
      systemMessage,
      model,
      temperature,
      topP,
      maxAttempts,
      retryDelayMs,
      requestProfileOverrides,
    });

    const previousAssistantMessage = newChatHistory[newChatIndex]?.message ?? "";
    newChatHistory[newChatIndex] = {
      role: "assistant",
      message:
        previousAssistantMessage.replaceAll(placeholderMessage, "") +
        (initialContext.length > aiBufferSize
          ? responseText
          : responseText.substring(0, Math.min(aiBufferSize, responseText.length))) +
        "\n\n",
      hasMore: !returnFirstResponse && rest.length > 0,
    };

    remainingContext = rest;

    const progress =
      totalContextLength === 0
        ? 100
        : ((totalContextLength - rest.length) / totalContextLength) * 100;
    onProgressChange?.(progress);

    if (returnFirstResponse && responseText) {
      break;
    }
  } while (remainingContext.length > 0);

  if (!logMessagesToChatHistory && newChatHistory[newChatIndex] !== null) {
    const hiddenResponse = newChatHistory[newChatIndex].message;

    newChatHistory[newChatIndex] = {
      message: readyMessage,
      role: "assistant",
      hasMore: false,
    };

    onChatHistoryChange?.([...newChatHistory]);

    return {
      ...newChatHistory[newChatIndex],
      message: hiddenResponse,
    };
  }

  onChatHistoryChange?.([...newChatHistory]);

  const finalMessage = newChatHistory[newChatIndex];
  if (!finalMessage) {
    throw new Error("Assistant response was not generated.");
  }

  return finalMessage;
}
