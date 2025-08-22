"use client";

import { ChatGPTAPI } from "chatgpt";
import * as pdfjs from "pdfjs-dist";

import { ChatMessage } from "@/types/bookworm/types";
import { aiBufferSize } from "@/consts/bookworm/consts";

import { Buffer } from "buffer";

const apiKey = process.env.REACT_APP_OPENAI_API_KEY || "";

const api = new ChatGPTAPI({
  apiKey,
  completionParams: {
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    top_p: 0.8,
  },
  fetch: window.fetch.bind(window),
});

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

  let response;

  do {
    let rest = context.substring(Math.min(aiBufferSize + 1, context.length));
    context = context.substring(0, Math.min(aiBufferSize, context.length));
    response = await api.sendMessage("", {
      systemMessage:
        `Question: ${user}\n\n` + system.replaceAll("{{context}}", context),
      onProgress: (partialResponse) => {
        if (initialContext.length <= aiBufferSize) {
          newChatHistory[newChatIndex] = {
            role: "assistant" as "user" | "assistant",
            message: logMessagesToChatHistory
              ? partialResponse.text
              : "Processing PDF...",
            hasMore: partialResponse.text.length > 0,
          };
          onChatHistoryChange?.([...newChatHistory]);
        }
      },
    });

    newChatHistory[newChatIndex] = {
      role: "assistant" as "user" | "assistant",
      message:
        newChatHistory?.[newChatIndex]?.message.replaceAll(
          logMessagesToChatHistory ? "I'm thinking..." : "Processing PDF...",
          ""
        ) +
        (initialContext.length > aiBufferSize ? response.text : "") +
        "\n\n",
      hasMore: !returnFirstResponse && rest.length > 0,
    };

    context = rest;
    onPDFProgressChange?.(
      ((initialContext.length - rest.length) / (1.0 * initialContext.length)) *
        100
    );

    if (returnFirstResponse && response.text) {
      break;
    }
  } while (context.length > 0);

  if (
    !logMessagesToChatHistory &&
    newChatHistory !== null &&
    newChatHistory[newChatIndex] !== null
  ) {
    let responseText = newChatHistory[newChatIndex]?.message;

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

window.Buffer = window.Buffer || Buffer;

export async function pdfToMarkdown(file: File): Promise<string> {
  const reader = new FileReader();
  const workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.1.392/pdf.worker.min.mjs";

  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const fileReadPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = reject;
  });

  reader.readAsArrayBuffer(file);

  const buffer = await fileReadPromise;
  const pdfData = new Uint8Array(buffer);

  const doc = await pdfjs.getDocument({ data: pdfData }).promise;
  const numPages = doc.numPages;

  let markdown = "";

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    for (const item of content.items) {
      markdown += (item as any).str + "\n";
    }

    markdown += "\n\n";
  }

  return markdown;
}
