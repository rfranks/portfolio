export interface AskErrorInfo {
  message: string;
  isKeyIssue: boolean;
}

const KEY_ISSUE_PATTERNS = [
  /openai\s*api\s*key/i,
  /missing api key/i,
  /api key is not set/i,
  /unauthorized/i,
  /status\s*401/i,
  /status\s*403/i,
];

const MAX_MESSAGE_LENGTH = 200;
const DEFAULT_ERROR_MESSAGE =
  "We couldn't reach OpenAI. Please try again.";
const KEY_GUIDANCE_MESSAGE =
  "Add your OpenAI API key in Settings to use this feature.";

const sanitizeMessage = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_ERROR_MESSAGE;
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return `${trimmed.slice(0, MAX_MESSAGE_LENGTH - 3)}...`;
  }
  return trimmed;
};

const looksLikeKeyIssue = (value: string): boolean =>
  KEY_ISSUE_PATTERNS.some((pattern) => pattern.test(value));

export const describeAskError = (value: unknown): AskErrorInfo => {
  if (value instanceof Error && value.message) {
    const message = sanitizeMessage(value.message);
    if (looksLikeKeyIssue(message)) {
      return { message: KEY_GUIDANCE_MESSAGE, isKeyIssue: true };
    }
    return { message, isKeyIssue: false };
  }

  if (typeof value === "string") {
    const message = sanitizeMessage(value);
    if (looksLikeKeyIssue(message)) {
      return { message: KEY_GUIDANCE_MESSAGE, isKeyIssue: true };
    }
    return { message, isKeyIssue: false };
  }

  return { message: DEFAULT_ERROR_MESSAGE, isKeyIssue: false };
};

export default describeAskError;
