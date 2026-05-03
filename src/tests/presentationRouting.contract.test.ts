import { generateStaticParams } from "@/app/[projectSlug]/page";
import {
  createPresentationProjectPageData,
  getPresentationProjectContractBySlug,
  getPresentationProjectDeepLinkIndex,
  getPresentationProjectSlugs,
} from "@/components/portfolio/projectPageData";

describe("presentation route contracts", () => {
  it("generateStaticParams includes all presentation slugs", () => {
    const slugs = getPresentationProjectSlugs();
    const staticParams = generateStaticParams();
    const staticSlugSet = new Set(staticParams.map((entry) => entry.projectSlug));

    slugs.forEach((slug) => {
      expect(staticSlugSet.has(slug)).toBe(true);
    });
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves page data for every presentation slug", () => {
    const presentationSlugs = getPresentationProjectSlugs();
    expect(presentationSlugs.length).toBeGreaterThan(0);

    presentationSlugs.forEach((projectSlug) => {
      const project = createPresentationProjectPageData(projectSlug);
      expect(project).not.toBeNull();
      expect(project?.href).toBe(`/${projectSlug}`);
    });
  });

  it("every indexed deep link points at a statically generated slug", () => {
    const staticSlugs = new Set(generateStaticParams().map((entry) => entry.projectSlug));
    const deepLinks = getPresentationProjectDeepLinkIndex();
    expect(deepLinks.length).toBeGreaterThan(0);

    deepLinks.forEach((entry) => {
      expect(staticSlugs.has(entry.projectSlug)).toBe(true);

      const parsed = new URL(entry.href, "https://portfolio.local");
      expect(parsed.pathname).toBe(`/${entry.projectSlug}`);
      expect(parsed.searchParams.get("project")).toBe(entry.projectSlug);
      expect(parsed.searchParams.get("slide")).toBe(entry.slideKey);

      if (entry.slideKey === "diagrams" && entry.diagramIndex !== undefined) {
        expect(parsed.searchParams.get("diagram")).toBe(String(entry.diagramIndex + 1));
      }

      const contract = getPresentationProjectContractBySlug(entry.projectSlug);
      expect(contract).not.toBeNull();
      expect(contract?.sections).toContain(entry.slideKey);
      if (entry.diagramIndex !== undefined) {
        expect(contract?.diagrams[entry.diagramIndex]).toBeDefined();
      }
    });
  });

  it("returns null for unknown presentation project slug", () => {
    expect(createPresentationProjectPageData("definitely-not-a-real-presentation")).toBeNull();
  });
});
