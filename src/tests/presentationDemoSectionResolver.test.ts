import type { ProjectData } from "@/types/components/portfolio";
import {
  resolveDemoItems,
  resolveTerminalDemo,
} from "@/components/portfolio/project-presentation/resolvers/demoSectionResolver";

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

describe("demoSectionResolver", () => {
  it("resolves configured terminal demo metadata", () => {
    const terminalDemo = resolveTerminalDemo(
      createProject({
        demoCaption: "Fallback caption",
        terminalDemo: {
          mediaType: "video",
          mediaUrl: "/videos/demo.mp4",
          caption: "Configured caption",
          title: "Configured title",
          subtitle: "Configured subtitle",
          mediaAlt: "Configured alt",
        },
      }),
    );

    expect(terminalDemo).toEqual({
      title: "Configured title",
      subtitle: "Configured subtitle",
      caption: "Configured caption",
      mediaType: "video",
      mediaUrl: "/videos/demo.mp4",
      mediaAlt: "Configured alt",
    });
  });

  it("falls back to project demo assets when terminal demo is not configured", () => {
    const terminalDemo = resolveTerminalDemo(
      createProject({
        demoGifUrl: "/images/demo.gif",
        demoCaption: "Fallback caption",
      }),
    );

    expect(terminalDemo).toEqual({
      title: "Sample Project Demo",
      subtitle: undefined,
      caption: "Fallback caption",
      mediaType: "image",
      mediaUrl: "/images/demo.gif",
      mediaAlt: "Sample Project demo",
    });
  });

  it("builds demo media items for gif and video previews", () => {
    const items = resolveDemoItems(
      createProject({
        demoGifUrl: "/images/demo.gif",
        demoVideoUrl: "/videos/demo.mp4",
      }),
    );

    expect(items).toHaveLength(2);
    expect(items[0]?.key).toBe("demo-image");
    expect(items[0]?.mediaType).toBe("image");
    expect(items[0]?.mediaUrl).toContain("/images/demo.gif");
    expect(items[1]?.key).toBe("demo-video");
    expect(items[1]?.mediaType).toBe("video");
    expect(items[1]?.mediaUrl).toContain("/videos/demo.mp4");
  });
});
