"use client";

import {
  ensureOpenAIKey as ensureStoredOpenAIKey,
  hasOpenAIKey as hasStoredOpenAIKey,
  setOpenAIKey as setStoredOpenAIKey,
} from "@/contexts/OpenAIKeyContext";
import {
  AUTO_REPLY_TEMPLATES,
  type AutoReplyTemplate,
} from "./autoReply/templates";

export { AUTO_REPLY_TEMPLATES };
export type { AutoReplyTemplate };

export interface AutoReplyMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const buildAutoReplyMessages = (
  template: AutoReplyTemplate,
  content: string,
  templates: Record<AutoReplyTemplate, string> = AUTO_REPLY_TEMPLATES,
): AutoReplyMessage[] => [
  { role: "system", content: templates[template] || templates.general },
  { role: "user", content },
];

export const setOpenAIKey = (key: string) => {
  setStoredOpenAIKey(key);
};

export const hasOpenAIKey = () => hasStoredOpenAIKey();

export const ensureOpenAIKey = () => ensureStoredOpenAIKey();

export async function autoReply(
  messages: AutoReplyMessage[],
): Promise<string> {
  const apiKey = ensureStoredOpenAIKey();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      top_p: 0.9,
      messages,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `OpenAI request failed: ${response.status} ${errorText}`.trim(),
    );
  }

  interface OpenAIChatResponse {
    choices?: Array<{ message?: { content?: unknown } }>;
  }
  let data: OpenAIChatResponse;
  try {
    data = (await response.json()) as OpenAIChatResponse;
  } catch {
    throw new Error("Failed to parse OpenAI response");
  }
  const content = data?.choices?.[0]?.message?.content;
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
  if (typeof content === "string") {
    return content.trim();
  }
  if (typeof content === "object" && content !== null && "text" in content) {
    return ((content as { text?: string }).text || "").trim();
  }
  return "";
}
