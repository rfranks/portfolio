"use client";

import * as pdfjs from "pdfjs-dist";

import { ChatMessage } from "@/types/talentforge/types";
import { aiBufferSize } from "@/consts/talentforge/consts";
import { ParsedResume } from "@/types/talentforge/resume";
import parseResume from "./resumeParser";
import { saveParsedResume } from "./storage";

import { Buffer } from "buffer";

let apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

export const setOpenAIKey = (key: string) => {
  apiKey = key;
};

export const hasOpenAIKey = () => apiKey.trim().length > 0;

/**
 * Request a completion from OpenAI and stream the response via the provided callback.
 */
const requestCompletionStream = async (
  systemMessage: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
) => {
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
      stream: true,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
      ],
    }),
    signal,
  });

  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();

  // Read server-sent events from OpenAI
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunkValue = decoder.decode(value, { stream: true });
    const lines = chunkValue.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "").trim();
        if (data === "[DONE]") {
          return;
        }
        try {
          const json = JSON.parse(data);
          const content =
            json?.choices?.[0]?.delta?.content ||
            json?.choices?.[0]?.message?.content ||
            "";
          if (content) {
            onChunk(content);
          }
        } catch {
          // ignore malformed JSON
        }
      }
    }
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
  signal,
}: {
  context: string;
  user: string;
  system: string;
  logMessagesToChatHistory?: boolean;
  returnFirstResponse?: boolean;
  chatHistory: (ChatMessage | null)[];
  onChatHistoryChange?: (chatHistory: (ChatMessage | null)[]) => void;
  onPDFProgressChange?: (progress: number) => void;
  signal?: AbortSignal;
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

  try {
    do {
      const rest = context.substring(Math.min(aiBufferSize, context.length));
      context = context.substring(0, Math.min(aiBufferSize, context.length));

      const systemMessage =
        `Question: ${user}\n\n` + system.replaceAll("{{context}}", context);

      let streamed = "";
      await requestCompletionStream(
        systemMessage,
        (chunk) => {
          streamed += chunk;
          newChatHistory[newChatIndex] = {
            role: "assistant",
            message:
              newChatHistory?.[newChatIndex]?.message.replaceAll(
                logMessagesToChatHistory
                  ? "I'm thinking..."
                  : "Processing PDF...",
                ""
              ) + streamed,
            hasMore: true,
          };
          onChatHistoryChange?.([...newChatHistory]);
        },
        signal
      );

      newChatHistory[newChatIndex] = {
        role: "assistant",
        message: newChatHistory[newChatIndex]?.message + "\n\n",
        hasMore: !returnFirstResponse && rest.length > 0,
      };
      onChatHistoryChange?.([...newChatHistory]);

      context = rest;
      onPDFProgressChange?.(
        ((initialContext.length - rest.length) / (1.0 * initialContext.length)) *
          100
      );

      if (returnFirstResponse && streamed) {
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

    newChatHistory[newChatIndex] = {
      ...newChatHistory[newChatIndex],
      hasMore: false,
    };
    onChatHistoryChange?.([...newChatHistory]);

    return newChatHistory[newChatIndex];
  } catch (err) {
    const aborted = signal?.aborted;
    if (!aborted) {
      console.error(err);
    }
    newChatHistory[newChatIndex] = {
      role: "assistant",
      message:
        newChatHistory?.[newChatIndex]?.message.replaceAll(
          logMessagesToChatHistory ? "I'm thinking..." : "Processing PDF...",
          ""
        ) +
        (aborted ? "Request cancelled." : "An error occurred."),
      hasMore: false,
    };
    onChatHistoryChange?.([...newChatHistory]);
    return newChatHistory[newChatIndex];
  }
};

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

export async function pdfToMarkdown(
  file: File
): Promise<{ markdown: string; parsedResume: ParsedResume }> {
  const reader = new FileReader();
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

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

    for (const item of content.items as unknown as { str: string }[]) {
      markdown += item.str + "\n";
    }

    markdown += "\n\n";
  }

  const parsedResume = parseResume(markdown);
  await saveParsedResume(parsedResume);

  return { markdown, parsedResume };
}
