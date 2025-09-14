import { PROMPT_TEMPLATES } from "../consts/prompts";

export function getPromptFullText(label: string): string | undefined {
  return PROMPT_TEMPLATES[label]?.fullText;
}
