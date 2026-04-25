import { MarkdownContent } from "@/components/shared/content";
import type { ProjectData } from "@/types/components/portfolio";
import type { MediaCyclerItem } from "@/types/media/mediaCycler";

export const resolveOverviewMarkdownContent = (project: ProjectData): string => {
  const markdownSections: string[] = [];

  if (project.wowFactor?.trim()) {
    markdownSections.push(`> ${project.wowFactor.trim()}`);
  }

  if (project.description?.trim()) {
    markdownSections.push(project.description.trim());
  }

  const topTechnologies = project.technologiesUsed.slice(0, 8);
  if (topTechnologies.length > 0) {
    const technologyLines = topTechnologies.map((technology) =>
      technology.url ? `- [${technology.name}](${technology.url})` : `- ${technology.name}`,
    );
    markdownSections.push("### Tech Snapshot", technologyLines.join("\n"));
  }

  const specificationKeys = Object.keys(project.specifications || {}).slice(0, 8);
  if (specificationKeys.length > 0) {
    markdownSections.push(
      "### Implementation Scope",
      specificationKeys.map((key) => `- ${key}`).join("\n"),
    );
  }

  return markdownSections.filter(Boolean).join("\n\n");
};

export const resolveOverviewItems = (overviewMarkdownContent: string): MediaCyclerItem[] => [
  {
    key: "overview-details",
    title: "",
    mediaType: "custom",
    mediaUrl: "",
    customContent: (
      <MarkdownContent
        content={overviewMarkdownContent}
        variant="body1"
        sx={{
          "& p": { mb: 1.25, lineHeight: 1.55 },
          "& h3": { mt: 1.2, mb: 0.6, fontSize: "1.02rem", fontWeight: 700 },
          "& ul": { my: 0.4, pl: 2.3 },
          "& li": { mb: 0.35 },
        }}
      />
    ),
    panelSx: {
      minHeight: 0,
      height: "100%",
      display: "flex",
      flexDirection: "column",
    },
    assetFrameSx: {
      width: "100%",
      minHeight: 0,
      height: "100%",
    },
    customContentSx: {
      width: "100%",
      height: "100%",
      minHeight: 0,
      overflowY: "auto",
      overflowX: "hidden",
      overscrollBehavior: "contain",
      pr: 0.4,
    },
  },
];
