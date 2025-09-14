import { cleanPdfText } from "@/utils/talentforge/pdfParser";

describe("cleanPdfText", () => {
  test("removes repeating headers and footers", () => {
    const pages = [
      ["John Doe", "Experience", "Company A", "Confidential"],
      ["John Doe", "Education", "Confidential"],
    ];

    const result = cleanPdfText(pages);
    expect(result).toBe("Experience\nCompany A\n\nEducation");
  });

  test("collapses duplicate spaces and joins broken lines", () => {
    const pages = [["Summary", "Experienced developer", "with focus on web", "Skills  React  Node"]];

    const result = cleanPdfText(pages);
    expect(result).toBe(
      "Summary\nExperienced developer with focus on web\nSkills React Node",
    );
  });

  test("handles single-page input", () => {
    const pages = [["Only line"]];

    const result = cleanPdfText(pages);
    expect(result).toBe("Only line");
  });
});

