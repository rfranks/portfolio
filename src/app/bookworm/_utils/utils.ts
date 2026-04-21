"use client";

import { ChatMessage } from "@/types";
import { aiBufferSize } from "@/app/bookworm/_consts/consts";
import { pdfToMarkdown } from "@/utils/pdfToMarkdown";

let apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

export const setOpenAIKey = (key: string) => {
  apiKey = key;
};

export const hasOpenAIKey = () => apiKey.trim().length > 0;

const requestCompletion = async (systemMessage: string) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      top_p: 0.8,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
      ],
    }),
  });

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  // `content` can be a string (old API) or an array of text segments (new API)
  if (Array.isArray(content)) {
    return (
      content
        .map((c: unknown) => {
          if (typeof c === "string") return c;
          if (typeof c === "object" && c !== null && "text" in c) {
            return (c as { text?: string }).text || "";
          }
          return "";
        })
        .join("") || ""
    );
  }

  return content || "";
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
  const newChatHistory = [
    ...chatHistory,
    logMessagesToChatHistory
      ? {
          role: "user" as "user" | "assistant",
          message: user || "",
          hasMore: false,
        }
      : null,
    {
      role: "assistant" as "user" | "assistant",
      message: logMessagesToChatHistory
        ? "I'm thinking..."
        : "Processing PDF...",
      hasMore: true,
    },
  ];
  onChatHistoryChange?.([...newChatHistory]);

  const newChatIndex = newChatHistory.length - 1;
  const initialContext = `${context}`;
  const totalContextLength = initialContext.length;

  let responseText = "";

  do {
    const rest = context.substring(Math.min(aiBufferSize, context.length));
    context = context.substring(0, Math.min(aiBufferSize, context.length));

    const systemMessage =
      `Question: ${user}\n\n` + system.replaceAll("{{context}}", context);
    responseText = await requestCompletion(systemMessage);

    newChatHistory[newChatIndex] = {
      role: "assistant" as "user" | "assistant",
      message:
        newChatHistory?.[newChatIndex]?.message.replaceAll(
          logMessagesToChatHistory ? "I'm thinking..." : "Processing PDF...",
          ""
        ) +
        (initialContext.length > aiBufferSize
          ? responseText
          : responseText?.substring(0, aiBufferSize)) +
        "\n\n",
      hasMore: !returnFirstResponse && rest.length > 0,
    };

    context = rest;

    const progress =
      totalContextLength === 0
        ? 100
        : ((totalContextLength - rest.length) / totalContextLength) * 100;

    onPDFProgressChange?.(progress);

    if (returnFirstResponse && responseText) {
      break;
    }
  } while (context.length > 0);

  if (
    !logMessagesToChatHistory &&
    newChatHistory !== null &&
    newChatHistory[newChatIndex] !== null
  ) {
    const responseText = newChatHistory[newChatIndex]?.message;

    newChatHistory[newChatIndex] = {
      message: "Ready! Ask me anything about your PDF.",
      role: "assistant",
      hasMore: false,
    };

    onChatHistoryChange?.([...newChatHistory]);

    return {
      ...newChatHistory[newChatIndex],
      message: responseText,
    };
  }

  onChatHistoryChange?.([...newChatHistory]);

  return newChatHistory[newChatIndex];
};
export { pdfToMarkdown };
