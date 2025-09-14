"use client";

export interface AutoReplyMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const AUTO_REPLY_TEMPLATES = {
  general:
    "You are a helpful assistant crafting concise professional replies to incoming messages.",
  politeDecline:
    "You are a helpful assistant that politely declines opportunities while maintaining professionalism.",
  requestMoreInfo:
    "You are a helpful assistant that requests more information when needed while remaining courteous.",
} as const;

export type AutoReplyTemplate = keyof typeof AUTO_REPLY_TEMPLATES;

export const buildAutoReplyMessages = (
  template: AutoReplyTemplate,
  content: string,
): AutoReplyMessage[] => [
  { role: "system", content: AUTO_REPLY_TEMPLATES[template] },
  { role: "user", content },
];

let apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

export const setOpenAIKey = (key: string) => {
  apiKey = key;
};

export const hasOpenAIKey = () => apiKey.trim().length > 0;

export async function autoReply(
  messages: AutoReplyMessage[],
): Promise<string> {
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
  return (content || "").trim();
}
