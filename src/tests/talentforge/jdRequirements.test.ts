import { PROMPT_TILES } from "@/consts/promptTiles";

describe("jdRequirements tile", () => {
  test("requires jobDescription input", () => {
    const tile = PROMPT_TILES.jdRequirements;
    expect(tile).toBeDefined();
    expect(tile.inputs).toEqual(["jobDescription"]);
  });

  test("prompt asks for bullet points", () => {
    const tile = PROMPT_TILES.jdRequirements;
    expect(tile.fullPrompt).toMatch(/bullet points/i);
  });

  test("sample output is bullet list", () => {
    const sample = "- item 1\n- item 2";
    const lines = sample.trim().split("\n");
    lines.forEach((line) => {
      expect(line.trim().startsWith("-")).toBe(true);
    });
  });
});
