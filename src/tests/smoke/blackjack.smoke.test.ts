import BlackjackPageClient from "@/app/blackjack/BlackjackPageClient";

describe("blackjack smoke route contract", () => {
  it("exports a renderable launcher component", () => {
    expect(typeof BlackjackPageClient).toBe("function");
  });
});
