import { getPromptTile, getPromptTiles } from "@/utils/talentforge/promptRegistry";

describe("promptRegistry", () => {
  it("filters tiles by context", () => {
    const tiles = getPromptTiles({ contexts: "resume" });
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) {
      expect(tile.contexts).toContain("resume");
    }
  });

  it("respects id ordering when filtering", () => {
    const ids = ["resumeSummary", "offerDetails", "coverLetter"];
    const tiles = getPromptTiles({ ids, contexts: "resume" });
    expect(tiles.map((tile) => tile.id)).toEqual([
      "resumeSummary",
      "coverLetter",
    ]);
  });

  it("returns undefined when context does not match", () => {
    const tile = getPromptTile("offerDetails", { contexts: "resume" });
    expect(tile).toBeUndefined();
  });

  it("includes recommended goal tags metadata", () => {
    const tile = getPromptTile("coverLetter");
    expect(tile?.recommendedGoalTags).toContain("resume");
  });
});
