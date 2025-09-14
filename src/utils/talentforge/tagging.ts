import { askOpenAI, hasOpenAIKey } from "./utils";

// Default keyword rules for resume tagging. These can be extended at runtime
// via the exported TAGGING_CONFIG object.
const DEFAULT_KEYWORD_RULES: Record<string, string[]> = {
  React: ["react"],
  Python: ["python"],
  JavaScript: ["javascript", "js"],
  TypeScript: ["typescript", "ts"],
  Node: ["node", "node.js", "nodejs"],
  Java: ["java"],
  "C++": ["c++"],
  "C#": ["c#"],
  Ruby: ["ruby"],
  Go: ["go", "golang"],
  Rust: ["rust"],
  PHP: ["php"],
  Swift: ["swift"],
  Kotlin: ["kotlin"],
  Angular: ["angular"],
  Vue: ["vue", "vue.js", "vuejs"],
  Django: ["django"],
  Flask: ["flask"],
  Spring: ["spring"],
  Rails: ["rails", "ruby on rails"],
  ".NET": [".net", "dotnet"],
  Express: ["express", "express.js", "expressjs"],
  Laravel: ["laravel"],
  AWS: ["aws", "amazon web services"],
  Azure: ["azure", "microsoft azure"],
  GCP: ["gcp", "google cloud", "google cloud platform"],
  Firebase: ["firebase"],
  Kubernetes: ["kubernetes", "k8s"],
  Docker: ["docker"],
};

// Configuration object to allow consumers to extend keyword rules without
// modifying the code. New rules can be added by mutating this object's
// `keywordRules` property or by using `extendKeywordRules`.
export const TAGGING_CONFIG: { keywordRules: Record<string, string[]> } = {
  keywordRules: { ...DEFAULT_KEYWORD_RULES },
};

export function extendKeywordRules(rules: Record<string, string[]>): void {
  TAGGING_CONFIG.keywordRules = {
    ...TAGGING_CONFIG.keywordRules,
    ...rules,
  };
}

const MIN_TAGS = 3;

function keywordTagging(content: string): string[] {
  const text = content.toLowerCase();
  return Object.entries(TAGGING_CONFIG.keywordRules)
    .filter(([, triggers]) => triggers.some((t) => text.includes(t)))
    .map(([tag]) => tag);
}

const NETWORK_ERROR_CODES = [
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
];

async function fetchAiTags(
  content: string,
  maxRetries = 3,
  baseDelay = 500,
): Promise<string[]> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
      return message
        .split(/,|\n/)
        .map((t) => t.trim())
        .filter(Boolean);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      const msg = err?.message?.toLowerCase?.() ?? "";
      const isNetworkError =
        (code && NETWORK_ERROR_CODES.includes(code)) || msg.includes("network");
      if (!isNetworkError || attempt === maxRetries) {
        throw err;
      }
      const delay = baseDelay * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return [];
}

export async function tagResume(content: string): Promise<string[]> {
  const tags = keywordTagging(content);
  if (tags.length >= MIN_TAGS) {
    return tags.slice(0, 5);
  }

  if (hasOpenAIKey()) {
    try {
      const aiTags = await fetchAiTags(content);
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

