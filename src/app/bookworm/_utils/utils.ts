"use client";

import { ChatMessage } from "@/types";
import { aiBufferSize } from "@/app/bookworm/_consts/consts";
import {
  ensureOpenAIKeyForApp,
  hasOpenAIKeyForApp,
  setOpenAIKeyForApp,
} from "@/utils/openai/keyService";
import { askPdfAssistantInChunks } from "@/utils/openai/pdfAssistant";
import { pdfToMarkdown } from "@/utils/pdfToMarkdown";

export const setOpenAIKey = (key: string) => {
  setOpenAIKeyForApp("bookworm", key);
};

export const hasOpenAIKey = () => hasOpenAIKeyForApp("bookworm");

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
  const apiKey = ensureOpenAIKeyForApp("bookworm");
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
export { pdfToMarkdown };
