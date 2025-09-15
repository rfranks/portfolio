import { cleanPdfText, parseResumeText } from "@/utils/talentforge/pdfParser";

// pdfjs-dist is only needed for pdf parsing, which these tests don't exercise.
// Mock it to avoid issues loading the actual ESM bundle in Jest.
jest.mock("pdfjs-dist", () => ({}));

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

  test("removes numeric page headers and footers", () => {
    const pages = [
      ["1", "Experience", "Company A", "2"],
      ["2", "Education", "3"],
    ];

    const result = cleanPdfText(pages);
    expect(result).toBe("Experience\nCompany A\n\nEducation");
  });
});

describe("parseResumeText", () => {
  test("detects contact, experience, education, and skills lines", () => {
    const text = `John Doe\njohn@example.com\nExperience\nCompany A - Developer\nEducation\nUniversity X\nSkills\nJavaScript`;

    const result = parseResumeText(text);
    expect(result).toEqual({
      contact: "John Doe\njohn@example.com",
      experience: ["Company A - Developer"],
      education: ["University X"],
      skills: ["JavaScript"],
    });
  });

  test("handles missing sections", () => {
    const text = `John Doe\njohn@example.com\nExperience\nCompany A`;

    const result = parseResumeText(text);
    expect(result).toEqual({
      contact: "John Doe\njohn@example.com",
      experience: ["Company A"],
      education: [],
      skills: [],
    });
  });

  test("parses multiple entries per section", () => {
    const text = `John Doe\njohn@example.com\nExperience\nCompany A\nCompany B\nEducation\nUniversity X\nUniversity Y\nSkills\nJavaScript\nTypeScript`;

    const result = parseResumeText(text);
    expect(result.contact).toBe("John Doe\njohn@example.com");
    expect(result.experience).toEqual(["Company A", "Company B"]);
    expect(result.education).toEqual(["University X", "University Y"]);
    expect(result.skills).toEqual(["JavaScript", "TypeScript"]);
  });

  test("parses sections with lowercase headers", () => {
    const text = `john doe\njohn@example.com\nexperience\ncompany a\neducation\nuniversity x\nskills\njavascript`;

    const result = parseResumeText(text);
    expect(result).toEqual({
      contact: "john doe\njohn@example.com",
      experience: ["company a"],
      education: ["university x"],
      skills: ["javascript"],
    });
  });

  test("parses singular Skill section header", () => {
    const text = `John Doe\njohn@example.com\nSkill\nJavaScript\nTypeScript`;

    const result = parseResumeText(text);
    expect(result.skills).toEqual(["JavaScript", "TypeScript"]);
  });
});

