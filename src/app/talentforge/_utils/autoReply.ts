"use client";

import {
  ensureOpenAIKey as ensureStoredOpenAIKey,
  hasOpenAIKey as hasStoredOpenAIKey,
  setOpenAIKey as setStoredOpenAIKey,
} from "@/contexts/OpenAIKeyContext";
import {
  extractTextFromOpenAIChatContent,
  requestOpenAIChatCompletions,
} from "@/utils/openai/client";
import { AUTO_REPLY_TEMPLATES, type AutoReplyTemplate } from "./autoReply/templates";

export { AUTO_REPLY_TEMPLATES };
export type { AutoReplyTemplate };

export interface AutoReplyMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const buildAutoReplyMessages = (
  template: AutoReplyTemplate | undefined,
  content: string,
  templates: Record<string, string> = AUTO_REPLY_TEMPLATES,
): AutoReplyMessage[] => {
  const mergedTemplates: Record<string, string> = {
    ...AUTO_REPLY_TEMPLATES,
    ...templates,
  };

  const fallbackTemplate: AutoReplyTemplate = template ?? "general";

  const systemPrompt =
    (template ? mergedTemplates[template] : undefined) ??
    AUTO_REPLY_TEMPLATES[fallbackTemplate] ??
    mergedTemplates.general ??
    AUTO_REPLY_TEMPLATES.general;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content },
  ];
};

export const setOpenAIKey = (key: string) => {
  setStoredOpenAIKey(key);
};

export const hasOpenAIKey = () => hasStoredOpenAIKey();

export const ensureOpenAIKey = () => ensureStoredOpenAIKey();

export async function autoReply(messages: AutoReplyMessage[]): Promise<string> {
  const apiKey = ensureStoredOpenAIKey();
  const data = await requestOpenAIChatCompletions(apiKey, {
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    top_p: 0.9,
    messages,
  });
  const content = data?.choices?.[0]?.message?.content;
  return extractTextFromOpenAIChatContent(content).trim();
}
