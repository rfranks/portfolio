import { getPromptFullText } from "../../utils/promptMapper";
import { PROMPT_TEMPLATES } from "../../consts/prompts";

describe("promptMapper", () => {
  test("returns full text for known label", () => {
    const label = Object.keys(PROMPT_TEMPLATES)[0];
    expect(getPromptFullText(label)).toBe(PROMPT_TEMPLATES[label].fullText);
  });

  test("maps all labels to their full text", () => {
    Object.entries(PROMPT_TEMPLATES).forEach(([label, { fullText }]) => {
      expect(getPromptFullText(label)).toBe(fullText);
    });
  });

  test("returns undefined for unknown label", () => {
    expect(getPromptFullText("unknown")).toBeUndefined();
  });
});
