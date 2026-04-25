import type { ChatMessage } from "@/types";
import { askOpenAIInChunks } from "@/utils/openai/chunkedAskOpenAI";

export interface AskPdfAssistantInChunksParams {
  apiKey: string;
  context: string;
  user: string;
  system: string;
  aiBufferSize: number;
  logMessagesToChatHistory?: boolean;
  returnFirstResponse?: boolean;
  chatHistory: (ChatMessage | null)[];
  onChatHistoryChange?: (chatHistory: (ChatMessage | null)[]) => void;
  onPDFProgressChange?: (progress: number) => void;
}

export async function askPdfAssistantInChunks({
  apiKey,
  context,
  user,
  system,
  aiBufferSize,
  logMessagesToChatHistory = true,
  returnFirstResponse = false,
  chatHistory,
  onChatHistoryChange,
  onPDFProgressChange,
}: AskPdfAssistantInChunksParams) {
  return askOpenAIInChunks({
    apiKey,
    context,
    user,
    system,
    aiBufferSize,
    chatHistory,
    onChatHistoryChange,
    onProgressChange: onPDFProgressChange,
    logMessagesToChatHistory,
    returnFirstResponse,
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    topP: 0.8,
    maxAttempts: 3,
    retryDelayMs: 600,
  });
}
