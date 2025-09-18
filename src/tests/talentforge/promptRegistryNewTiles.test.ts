import { PROMPT_TILES } from "@/consts/promptTiles";
import { getPromptTile } from "@/utils/talentforge/promptRegistry";

const NEW_TILE_IDS = [
  "tailorResumeToRole",
  "extractKeyRequirements",
  "targetedCoverLetter",
  "negotiateBetterOffer",
  "compareTwoOffers",
  "screenRoleForRedFlags",
  "recruiterFollowUp",
  "recruiterDecline",
  "recruiterFollowUpNudge",
] as const;

describe("prompt registry new tiles", () => {
  test.each(NEW_TILE_IDS)("registry exposes %s", (id) => {
    expect(PROMPT_TILES[id]).toBeDefined();
    const tile = getPromptTile(id);
    expect(tile).toBeDefined();
    expect(tile?.id).toBe(id);
  });

  test("tailor resume tile requests structured sections", () => {
    const tile = PROMPT_TILES.tailorResumeToRole;
    expect(tile.inputs).toEqual(["resumeText", "jobDescription"]);
    expect(tile.fullPrompt).toMatch(/Tailored Summary/);
    expect(tile.fullPrompt).toMatch(/Priority Bullet Updates/);
  });

  test("extract requirements tile outlines headings", () => {
    const tile = PROMPT_TILES.extractKeyRequirements;
    expect(tile.fullPrompt).toMatch(/Core Responsibilities/);
    expect(tile.fullPrompt).toMatch(/Notable Keywords/);
  });

  test("negotiate better offer tile includes strategy and draft message", () => {
    const tile = PROMPT_TILES.negotiateBetterOffer;
    expect(tile.inputs).toEqual([
      "offerDetails",
      "currentComp",
      "leveragePoints",
    ]);
    expect(tile.fullPrompt).toMatch(/Negotiation Strategy/);
    expect(tile.fullPrompt).toMatch(/Draft Message/);
  });

  test("compare two offers tile captures candidate priorities", () => {
    const tile = PROMPT_TILES.compareTwoOffers;
    expect(tile.inputs).toEqual(["offerA", "offerB", "priorities"]);
    expect(tile.fullPrompt).toMatch(/Candidate Priorities/);
  });

  test("screen role for red flags tile requires severity guidance", () => {
    const tile = PROMPT_TILES.screenRoleForRedFlags;
    expect(tile.fullPrompt).toMatch(/Severity/);
    expect(tile.fullPrompt).toMatch(/clarifying questions/i);
  });

  test("recruiter follow up nudge tile covers both channels", () => {
    const tile = PROMPT_TILES.recruiterFollowUpNudge;
    expect(tile.fullPrompt).toMatch(/Email/);
    expect(tile.fullPrompt).toMatch(/LinkedIn/);
  });

  test("recruiter follow up tile requests JSON per channel", () => {
    const tile = PROMPT_TILES.recruiterFollowUp;
    expect(tile.inputs).toEqual(["messageContext"]);
    expect(tile.fullPrompt).toMatch(/JSON/i);
    expect(tile.fullPrompt).toMatch(/email/i);
    expect(tile.fullPrompt).toMatch(/LinkedIn/i);
    expect(tile.fullPrompt).toMatch(/Indeed/i);
  });

  test("recruiter decline tile requests JSON per channel", () => {
    const tile = PROMPT_TILES.recruiterDecline;
    expect(tile.inputs).toEqual(["messageContext"]);
    expect(tile.fullPrompt).toMatch(/JSON/i);
    expect(tile.fullPrompt).toMatch(/email/i);
    expect(tile.fullPrompt).toMatch(/LinkedIn/i);
    expect(tile.fullPrompt).toMatch(/Indeed/i);
  });
});
