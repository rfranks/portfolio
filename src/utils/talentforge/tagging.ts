import { askOpenAI, hasOpenAIKey } from "./utils";

const KEYWORD_RULES: Record<string, string[]> = {
  React: ["react"],
  Python: ["python"],
  JavaScript: ["javascript", "js"],
  TypeScript: ["typescript", "ts"],
  Node: ["node", "node.js", "nodejs"],
  Java: ["java"],
  "C++": ["c++"],
  "C#": ["c#"],
  AWS: ["aws", "amazon web services"],
  Docker: ["docker"],
};

const MIN_TAGS = 3;

function keywordTagging(content: string): string[] {
  const text = content.toLowerCase();
  return Object.entries(KEYWORD_RULES)
    .filter(([, triggers]) => triggers.some((t) => text.includes(t)))
    .map(([tag]) => tag);
}

export async function tagResume(content: string): Promise<string[]> {
  const tags = keywordTagging(content);
  if (tags.length >= MIN_TAGS) {
    return tags.slice(0, 5);
  }

  if (hasOpenAIKey()) {
    try {
      const res = await askOpenAI({
        context: content,
        user: "Suggest tags for this resume",
        system:
          "You are an assistant that extracts up to 5 concise tags from resume text. Return tags separated by commas.",
        logMessagesToChatHistory: false,
        returnFirstResponse: true,
        chatHistory: [],
      });
      const message = res?.message?.trim() ?? "";
      const aiTags = message
        .split(/,|\n/)
        .map((t) => t.trim())
        .filter(Boolean);
      for (const t of aiTags) {
        if (!tags.some((existing) => existing.toLowerCase() === t.toLowerCase())) {
          tags.push(t);
        }
      }
    } catch {
      // ignore errors from OpenAI
    }
  }

  return tags.slice(0, 5);
}

export function getKeywordTags(content: string): string[] {
  return keywordTagging(content);
}

