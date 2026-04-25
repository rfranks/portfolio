"use client";

import { ChatMessage } from "@/types";
import { aiBufferSize } from "@/app/talentforge/_consts/consts";
import {
  ensureOpenAIKey as ensureStoredOpenAIKey,
  hasOpenAIKey as hasStoredOpenAIKey,
  setOpenAIKey as setStoredOpenAIKey,
} from "@/contexts/OpenAIKeyContext";
import type { OpenAIKeyValidity } from "@/contexts/OpenAIKeyContext";
import { requestOpenAIChatCompletions } from "@/utils/openai/client";
import { askPdfAssistantInChunks } from "@/utils/openai/pdfAssistant";
import { pdfToMarkdown } from "@/utils/pdfToMarkdown";

export const setOpenAIKey = (
  key: string,
  options?: { persist?: boolean; validity?: OpenAIKeyValidity },
) => {
  setStoredOpenAIKey(key, options);
};

export const ensureOpenAIKey = () => ensureStoredOpenAIKey();

export const hasOpenAIKey = () => hasStoredOpenAIKey();

export interface OpenAIKeyValidationResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export const validateOpenAIKey = async (key: string): Promise<OpenAIKeyValidationResult> => {
  const trimmed = key.trim();
  if (!trimmed) {
    return { ok: false, error: "OpenAI API key is empty." };
  }

  try {
    await requestOpenAIChatCompletions(trimmed, {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
    });

    return { ok: true, status: 200 };
  } catch {
    return {
      ok: false,
      error: "Network error while contacting OpenAI.",
    };
  }
};

export const hasValidOpenAIKey = async () => {
  if (!hasStoredOpenAIKey()) return false;
  try {
    const apiKey = ensureStoredOpenAIKey();
    const result = await validateOpenAIKey(apiKey);
    return result.ok;
  } catch {
    return false;
  }
};

export const askOpenAI = async ({
  context,
  user,
  system,
  logMessagesToChatHistory = true,
  returnFirstResponse = false,
  chatHistory = [],
  onChatHistoryChange,
  onPDFProgressChange,
}: {
  context: string;
  user: string;
  system: string;
  logMessagesToChatHistory?: boolean;
  returnFirstResponse?: boolean;
  chatHistory: (ChatMessage | null)[];
  onChatHistoryChange?: (chatHistory: (ChatMessage | null)[]) => void;
  onPDFProgressChange?: (progress: number) => void;
}) => {
  const apiKey = ensureStoredOpenAIKey();
  return askPdfAssistantInChunks({
    apiKey,
    context,
    user,
    system,
    aiBufferSize,
    logMessagesToChatHistory,
    returnFirstResponse,
    chatHistory,
    onChatHistoryChange,
    onPDFProgressChange,
  });
};

export type AskOpenAIFunc = typeof askOpenAI;
export { pdfToMarkdown };
