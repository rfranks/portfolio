import PathForgerPage, { metadata } from "@/app/pathforger/page";

describe("pathforger smoke route contract", () => {
  it("exports metadata and page component", () => {
    expect(typeof PathForgerPage).toBe("function");
    expect(typeof metadata.title).toBe("string");
    expect(typeof metadata.description).toBe("string");
  });
});
