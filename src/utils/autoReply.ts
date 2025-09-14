"use client";

export interface AutoReplyMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

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

  const data = await response.json();
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
