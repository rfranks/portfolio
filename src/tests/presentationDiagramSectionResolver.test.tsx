import type { ProjectData } from "@/types/components/portfolio";
import {
  resolveDiagramEntries,
  resolveDiagramItems,
  resolveDiagramPagerItems,
  type ProjectDiagramEntry,
} from "@/components/portfolio/project-presentation/resolvers/diagramSectionResolver";

const createProject = (overrides: Partial<ProjectData> = {}): ProjectData => ({
  project: "Sample Project",
  description: "Base description",
  specifications: {},
  technologiesUsed: [],
  blockDiagram: "",
  componentDiagram: "",
  sequenceDiagram: "",
  ...overrides,
});

describe("diagramSectionResolver", () => {
  it("normalizes configured diagram entries and filters blank diagram code", () => {
    const entries = resolveDiagramEntries(
      createProject({
        diagrams: [
          {
            title: "Primary",
            diagram: "flowchart LR\nA-->B",
            shortText: "Overview",
            description: "Primary diagram",
          },
          {
            title: "Blank",
            diagram: "   ",
          },
        ],
      }),
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]?.key).toBe("diagram-0-primary");
    expect(entries[0]?.title).toBe("Primary");
    expect(entries[0]?.shortText).toBe("Overview");
  });

  it("falls back to legacy diagram fields when normalized diagrams are missing", () => {
    const entries = resolveDiagramEntries(
      createProject({
        blockDiagram: "graph TD\nA-->B",
        sequenceDiagram: "sequenceDiagram\nA->>B: Ping",
      }),
    );

    expect(entries.map((entry) => entry.key)).toEqual(["block-diagram", "sequence-diagram"]);
  });

  it("builds pager items with selector visuals and section labels", () => {
    const pagerItems = resolveDiagramPagerItems([
      {
        key: "diagram-1",
        title: "System Flow",
        shortText: "Runtime flow",
        description: "Runtime flow",
        diagram: "flowchart LR\nA-->B",
        selectorOptionVisual: {
          type: "image",
          src: "/images/diagram.png",
          alt: "System flow",
        },
      },
    ]);

    expect(pagerItems).toHaveLength(1);
    expect(pagerItems[0]?.optionTitle).toBe("1. System Flow");
    expect(pagerItems[0]?.optionSubtitle).toBe("Runtime flow");
    expect(pagerItems[0]?.optionImageSrc).toContain("/images/diagram.png");
  });

  it("builds diagram media items with deep-link mode and zoom preset behavior", () => {
    const onSelectDiagram = jest.fn();
    const entries: ProjectDiagramEntry[] = [
      {
        key: "diagram-1",
        title: "System",
        shortText: "Overview",
        description: "System overview",
        diagram: "flowchart LR\nA-->B",
        autoFit: {
          padding: 10,
          scaleMultiplier: 2,
          verticalAlign: "top",
          offsetX: 4,
          offsetY: 8,
        },
      },
    ];

    const items = resolveDiagramItems({
      diagramEntries: entries,
      diagramDeepLinkMode: "code",
      diagramDeepLinkZoomPreset: "focus",
      onSelectDiagram,
    });

    expect(items).toHaveLength(1);
    const diagramItem = items[0];
    expect(diagramItem?.mediaType).toBe("diagram");
    expect(diagramItem?.diagramProps?.syntax).toBe("text");
    expect(diagramItem?.diagramProps?.autoFitScaleMultiplier).toBeCloseTo(2.3, 5);
    diagramItem?.onSelect?.();
    expect(onSelectDiagram).toHaveBeenCalledWith("diagram-1");
  });
});
