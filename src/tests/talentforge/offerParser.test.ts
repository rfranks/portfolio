import { parseOfferText } from "@/utils/talentforge/offerParser";

describe("parseOfferText", () => {
  it("extracts compensation components", () => {
    const text = `Base Salary: $120,000\nAnnual Bonus: $10,000\nEquity: 1,000 RSUs\nStart Date: June 1, 2024`;
    const parsed = parseOfferText(text);
    expect(parsed.compensation).toEqual(
      expect.arrayContaining([
        { type: "base", amount: 120000 },
        { type: "bonus", amount: 10000 },
        { type: "equity", amount: 1000, notes: "RSUs" },
        { type: "start", amount: 0, notes: "June 1, 2024" },
      ]),
    );
    expect(parsed.summary).toBeTruthy();
  });

  it("supports decimal compensation amounts", () => {
    const text = `Base Salary: $120,000.50\nAnnual Bonus: $5,000.75\nEquity: 1,000.25 RSUs`;
    const parsed = parseOfferText(text);

    expect(parsed.compensation).toEqual(
      expect.arrayContaining([
        { type: "base", amount: 120000.5 },
        { type: "bonus", amount: 5000.75 },
        { type: "equity", amount: 1000.25, notes: "RSUs" },
      ]),
    );
  });
});
