import { getPromptFullText } from "../../utils/promptMapper";
import { PROMPT_TEMPLATES } from "../../consts/prompts";

describe("promptMapper", () => {
  test("returns full text for known label", () => {
    const label = Object.keys(PROMPT_TEMPLATES)[0];
    expect(getPromptFullText(label)).toBe(PROMPT_TEMPLATES[label].fullText);
  });

  test("returns undefined for unknown label", () => {
    expect(getPromptFullText("unknown")).toBeUndefined();
  });
});
