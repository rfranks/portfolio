import {
  addCustomPromptTile,
  getCustomPromptTiles,
  updateCustomPromptTile,
  deleteCustomPromptTile,
  getCustomPromptTileById,
  type CustomPromptTileInput,
} from "@/utils/talentforge/dataStore";
import { getPromptTile, getPromptTiles } from "@/utils/talentforge/promptRegistry";

const baseTile: CustomPromptTileInput = {
  displayName: "Sample Prompt",
  fullText: "Hello {{name}}",
  contexts: ["resume"],
  placeholders: [
    {
      id: "name",
      label: "Name",
      type: "shortText",
    },
  ],
};

describe("custom prompt tile datastore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds and normalizes a custom prompt", () => {
    const updated = addCustomPromptTile({
      ...baseTile,
      displayName: "  Sample Prompt  ",
      placeholders: [
        {
          id: "  name  ",
          label: "  Name  ",
          type: "shortText",
          helperText: "  Provide your name  ",
        },
        {
          id: "details",
          label: "Details",
          type: "longText",
          required: false,
        },
      ],
    });

    expect(updated).toHaveLength(1);

    const stored = getCustomPromptTiles();
    expect(stored).toHaveLength(1);
    const tile = stored[0];
    expect(tile.displayName).toBe("Sample Prompt");
    expect(tile.placeholders).toEqual([
      expect.objectContaining({
        id: "name",
        label: "Name",
        required: true,
        helperText: "Provide your name",
      }),
      expect.objectContaining({
        id: "details",
        required: false,
        type: "longText",
      }),
    ]);
  });

  it("updates an existing custom prompt", () => {
    const [created] = addCustomPromptTile(baseTile);
    expect(created).toBeDefined();

    updateCustomPromptTile({
      id: created.id,
      displayName: "Updated",
      fullText: "Updated {{name}}",
      contexts: ["messaging"],
      placeholders: [
        {
          id: "name",
          label: "Recipient",
          type: "shortText",
        },
      ],
    });

    const stored = getCustomPromptTileById(created.id);
    expect(stored).toBeDefined();
    expect(stored?.displayName).toBe("Updated");
    expect(stored?.contexts).toEqual(["messaging"]);
    expect(stored?.placeholders[0].label).toBe("Recipient");
  });

  it("deletes a custom prompt", () => {
    const [created] = addCustomPromptTile(baseTile);
    expect(getCustomPromptTiles()).toHaveLength(1);

    deleteCustomPromptTile(created.id);
    expect(getCustomPromptTiles()).toHaveLength(0);
  });

  it("avoids collisions with default prompt ids", () => {
    addCustomPromptTile({
      ...baseTile,
      id: "resumeRewrite",
    });

    const stored = getCustomPromptTiles();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).not.toBe("resumeRewrite");
    expect(stored[0].id).toMatch(/^resumeRewrite_/);

    const defaultTile = getPromptTile("resumeRewrite");
    expect(defaultTile).toBeDefined();
  });

  it("includes custom prompts in the registry", () => {
    const [created] = addCustomPromptTile(baseTile);
    const tiles = getPromptTiles({ contexts: "resume" });
    expect(tiles.find((tile) => tile.id === created.id)).toBeDefined();
  });

  it("migrates legacy entries and reassigns conflicting ids", () => {
    window.localStorage.setItem(
      "customPromptTiles",
      JSON.stringify({
        version: 0,
        data: [
          {
            id: "resumeRewrite",
            displayName: "Legacy",
            fullText: "Legacy {{name}}",
            contexts: ["resume"],
            placeholders: [
              { id: "name", label: "Name", type: "shortText" },
            ],
          },
        ],
      }),
    );

    const migrated = getCustomPromptTiles();
    expect(migrated).toHaveLength(1);
    expect(migrated[0].displayName).toBe("Legacy");
    expect(migrated[0].id).not.toBe("resumeRewrite");
    expect(migrated[0].id).toMatch(/^resumeRewrite_/);
  });
});
