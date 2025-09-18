import { getNextStatus } from "@/utils/talentforge/keyboard";

const advancingKeys = ["ArrowRight", "ArrowDown"] as const;
const retreatingKeys = ["ArrowLeft", "ArrowUp"] as const;
const clampCases = [
  ["applied", "ArrowLeft"],
  ["applied", "ArrowUp"],
  ["rejected", "ArrowRight"],
  ["rejected", "ArrowDown"],
] as const;

describe("keyboard move helpers", () => {
  test.each(advancingKeys)("%s advances status", (key) => {
    expect(getNextStatus("applied", key)).toBe("interview");
  });

  test.each(retreatingKeys)("%s goes back", (key) => {
    expect(getNextStatus("offer", key)).toBe("interview");
  });

  test.each(clampCases)("clamps %s when pressing %s", (status, key) => {
    expect(getNextStatus(status, key)).toBe(status);
  });
});
