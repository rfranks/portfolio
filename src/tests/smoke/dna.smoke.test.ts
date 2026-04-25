import DnaPage from "@/app/dna/page";

describe("dna smoke route contract", () => {
  it("exports a renderable page component", () => {
    expect(typeof DnaPage).toBe("function");
  });
});
