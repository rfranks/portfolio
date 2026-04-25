import { resolveTechnologyCompetencyCategories } from "@/components/portfolio/project-presentation/resolvers/technologiesSectionResolver";

describe("technologiesSectionResolver", () => {
  it("groups technologies by domain and maps category metadata", () => {
    const categories = resolveTechnologyCompetencyCategories([
      { name: "React" },
      { name: "Spring Boot" },
      { name: "OpenAI" },
      { name: "AWS Lambda" },
      { name: "Jest" },
      { name: "Acme Toolkit" },
    ]);

    expect(categories.map((category) => category.title)).toEqual([
      "Frontend & UX",
      "Backend & APIs",
      "AI & Data",
      "Cloud & Platform",
      "Quality & Tooling",
      "Integrations",
    ]);
  });

  it("preserves explicit technology emoji when provided", () => {
    const categories = resolveTechnologyCompetencyCategories([
      { name: "React", emoji: "🎯", url: "https://react.dev" },
    ]);

    const firstCategory = categories[0];
    const firstItem = firstCategory?.items?.[0];

    expect(firstCategory?.title).toBe("Frontend & UX");
    expect(firstItem?.emoji).toBe("🎯");
    expect(firstItem?.sourceLink).toBe("https://react.dev");
  });
});
