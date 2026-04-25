import BlackjackPage from "@/app/blackjack/page";

describe("blackjack smoke route contract", () => {
  it("exports a renderable page component", () => {
    expect(typeof BlackjackPage).toBe("function");
  });
});
