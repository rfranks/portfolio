import { getNextStatus } from "@/utils/talentforge/keyboard";

describe("keyboard move helpers", () => {
  test("ArrowRight advances status", () => {
    expect(getNextStatus("applied", "ArrowRight")).toBe("interview");
  });

  test("ArrowLeft goes back", () => {
    expect(getNextStatus("offer", "ArrowLeft")).toBe("interview");
  });

  test("clamps at ends", () => {
    expect(getNextStatus("applied", "ArrowLeft")).toBe("applied");
    expect(getNextStatus("rejected", "ArrowRight")).toBe("rejected");
  });
});
