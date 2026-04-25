import type { ProjectData } from "@/types/components/portfolio";
import {
  resolveOverviewItems,
  resolveOverviewMarkdownContent,
} from "@/components/portfolio/project-presentation/resolvers/overviewSectionResolver";

const createProject = (overrides: Partial<ProjectData> = {}): ProjectData => ({
  project: "Sample Project",
  description: "Base description",
  specifications: {
    Runtime: "Node",
  },
  technologiesUsed: [{ name: "React", url: "https://react.dev" }, { name: "TypeScript" }],
  blockDiagram: "",
  componentDiagram: "",
  sequenceDiagram: "",
  ...overrides,
});

describe("overviewSectionResolver", () => {
  it("builds markdown from wow factor, description, technologies, and specifications", () => {
    const markdown = resolveOverviewMarkdownContent(
      createProject({
        wowFactor: "Fast orchestration",
        description: "Detailed project summary.",
        specifications: {
          Runtime: "Node",
          Deployment: "Vercel",
        },
      }),
    );

    expect(markdown).toContain("> Fast orchestration");
    expect(markdown).toContain("Detailed project summary.");
    expect(markdown).toContain("### Tech Snapshot");
    expect(markdown).toContain("- [React](https://react.dev)");
    expect(markdown).toContain("### Implementation Scope");
    expect(markdown).toContain("- Runtime");
    expect(markdown).toContain("- Deployment");
  });

  it("creates a single overview media item with custom content", () => {
    const items = resolveOverviewItems("overview markdown");

    expect(items).toHaveLength(1);
    expect(items[0]?.key).toBe("overview-details");
    expect(items[0]?.mediaType).toBe("custom");
    expect(items[0]?.customContent).toBeTruthy();
  });
});
