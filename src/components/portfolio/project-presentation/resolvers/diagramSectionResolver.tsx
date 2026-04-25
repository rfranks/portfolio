import type { ReactNode } from "react";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { MediaCyclerItem } from "@/types/media/mediaCycler";
import type {
  ProjectData,
  ProjectDiagramConfig,
  ProjectDiagramVisualConfig,
} from "@/types/components/portfolio";
import type { SubsectionPagerItem } from "@/components/portfolio/layout/SubsectionPager";
import { renderNavigationIcon } from "@/components/portfolio/layout/navigationIcons";
import { withBasePath } from "@/utils/basePath";
import { resolveDiagramAutoFitConfig } from "@/utils/components/shared/diagramAutoFit";

export type ProjectDiagramEntry = {
  key: string;
  title: string;
  shortText: string;
  description: string;
  diagram: string;
  type?: ProjectDiagramConfig["type"];
  height?: ProjectDiagramConfig["height"];
  autoFitPadding?: number;
  autoFitScaleMultiplier?: number;
  autoFitOffsetX?: number;
  autoFitOffsetY?: number;
  autoFit?: {
    padding?: number;
    scaleMultiplier?: number;
    verticalAlign?: "top" | "center";
    offsetX?: number;
    offsetY?: number;
  };
  selectorOptionVisual?: ProjectDiagramVisualConfig;
  selectorSelectedVisual?: ProjectDiagramVisualConfig;
};

export type DiagramDeepLinkMode = "render" | "code";
export type DiagramDeepLinkZoomPreset = "fit" | "wide" | "focus" | "close";

type ResolvedDiagramVisual = {
  iconNode?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
};

const DIAGRAM_ZOOM_PRESET_MULTIPLIERS: Record<DiagramDeepLinkZoomPreset, number> = {
  fit: 1,
  wide: 0.9,
  focus: 1.15,
  close: 1.35,
};

const buildSectionLabel = (index: number, title: string) => `${index + 1}. ${title}`;

const hasResolvedDiagramVisual = (visual: ResolvedDiagramVisual) =>
  Boolean(visual.imageSrc || visual.iconNode);

const resolveDiagramVisual = (
  visual: ProjectDiagramVisualConfig | undefined,
  fallbackLabel: string,
): ResolvedDiagramVisual => {
  if (!visual) {
    return {};
  }

  if (visual.type === "image") {
    const source = visual.src?.trim();
    if (!source) {
      return {};
    }
    return {
      imageSrc: withBasePath(source),
      imageAlt: visual.alt?.trim() || `${fallbackLabel} diagram visual`,
    };
  }

  if (visual.type === "emoji") {
    const icon = visual.icon?.trim();
    if (!icon) {
      return {};
    }
    return {
      iconNode: renderNavigationIcon(
        { iconType: "emoji", icon },
        { fallbackIconKey: "science", emojiSize: "1rem" },
      ),
    };
  }

  return {
    iconNode: renderNavigationIcon(
      { iconType: "material", icon: visual.icon?.trim() || "science" },
      { fallbackIconKey: "science", fontSize: "small" },
    ),
  };
};

export const resolveDiagramEntries = (project: ProjectData): ProjectDiagramEntry[] => {
  const configuredDiagrams = Array.isArray(project.diagrams) ? project.diagrams : undefined;
  if (configuredDiagrams && configuredDiagrams.length > 0) {
    return configuredDiagrams
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .map((entry, index) => {
        const title = entry.title?.trim() || `Diagram ${index + 1}`;
        const diagramCode = entry.diagram?.trim() || "";
        return {
          key: `diagram-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          title,
          shortText: entry.shortText?.trim() || "",
          description: entry.description?.trim() || "",
          type: entry.type,
          height: entry.height,
          diagram: diagramCode,
          autoFitPadding: entry.autoFitPadding,
          autoFitScaleMultiplier: entry.autoFitScaleMultiplier,
          autoFitOffsetX: entry.autoFitOffsetX,
          autoFitOffsetY: entry.autoFitOffsetY,
          autoFit: entry.autoFit,
          selectorOptionVisual: entry.selectorOptionVisual,
          selectorSelectedVisual: entry.selectorSelectedVisual,
        };
      })
      .filter((entry) => entry.diagram.length > 0);
  }

  const fallbackDiagrams: ProjectDiagramEntry[] = [
    {
      key: "block-diagram",
      title: "Block Diagram",
      shortText: "High-level system boundaries and major data flow.",
      description: "High-level system boundaries and major data flow.",
      diagram: project.blockDiagram?.trim() || "",
      selectorOptionVisual: { type: "emoji", icon: "🧱" },
    },
    {
      key: "component-diagram",
      title: "Component Diagram",
      shortText: "Core modules, responsibilities, and integrations.",
      description: "Core modules, responsibilities, and integrations.",
      diagram: project.componentDiagram?.trim() || "",
      selectorOptionVisual: { type: "emoji", icon: "🧩" },
    },
    {
      key: "sequence-diagram",
      title: "Sequence Diagram",
      shortText: "Runtime interaction flow across the stack.",
      description: "Runtime interaction flow across the stack.",
      diagram: project.sequenceDiagram?.trim() || "",
      selectorOptionVisual: { type: "emoji", icon: "🔀" },
    },
  ];

  return fallbackDiagrams.filter((entry) => entry.diagram.length > 0);
};

export const resolveDiagramPagerItems = (
  diagramEntries: ProjectDiagramEntry[],
): SubsectionPagerItem[] =>
  diagramEntries.map((entry, index) => {
    const optionVisual = resolveDiagramVisual(entry.selectorOptionVisual, entry.title);
    const selectedVisualCandidate = resolveDiagramVisual(
      entry.selectorSelectedVisual ?? entry.selectorOptionVisual,
      entry.title,
    );
    const selectedVisual = hasResolvedDiagramVisual(selectedVisualCandidate)
      ? selectedVisualCandidate
      : optionVisual;

    return {
      key: entry.key,
      title: entry.title,
      selectedTitle: entry.title,
      selectedImageSrc: selectedVisual.imageSrc,
      selectedImageAlt: selectedVisual.imageAlt,
      selectedIcon: selectedVisual.iconNode,
      optionTitle: buildSectionLabel(index, entry.title),
      optionSubtitle: entry.shortText || entry.description || undefined,
      optionImageSrc: optionVisual.imageSrc,
      optionImageAlt: optionVisual.imageAlt,
      optionIcon: optionVisual.iconNode,
    };
  });

export const resolveDiagramItems = ({
  diagramEntries,
  diagramDeepLinkMode,
  diagramDeepLinkZoomPreset,
  onSelectDiagram,
}: {
  diagramEntries: ProjectDiagramEntry[];
  diagramDeepLinkMode: DiagramDeepLinkMode;
  diagramDeepLinkZoomPreset: DiagramDeepLinkZoomPreset;
  onSelectDiagram: (diagramKey: string) => void;
}): MediaCyclerItem[] =>
  diagramEntries.map((entry) => {
    const autoFit = resolveDiagramAutoFitConfig(entry);
    return {
      key: entry.key,
      title: "",
      mediaType: "diagram",
      mediaUrl: entry.diagram,
      mediaLightboxTitle: entry.title,
      lightboxSubtitle: entry.shortText || undefined,
      onSelect: () => {
        onSelectDiagram(entry.key);
      },
      panelSx: {
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
        flex: "1 1 auto",
      },
      assetFrameSx: {
        width: "100%",
        minHeight: 0,
        height: "100%",
        flex: "1 1 auto",
        display: "flex",
        overflow: "hidden",
      },
      diagramProps: {
        title: entry.title,
        type: entry.type,
        syntax: diagramDeepLinkMode === "code" ? "text" : "mermaid",
        height: "100%",
        width: "100%",
        showToolbar: true,
        showGridDots: true,
        autoFitPadding: autoFit.padding,
        autoFitScaleMultiplier:
          autoFit.scaleMultiplier *
          (DIAGRAM_ZOOM_PRESET_MULTIPLIERS[diagramDeepLinkZoomPreset] ?? 1),
        autoFitVerticalAlign: autoFit.verticalAlign,
        autoFitOffsetX: autoFit.offsetX,
        autoFitOffsetY: autoFit.offsetY,
      },
      extraContent: entry.description ? (
        <Typography
          component="div"
          variant="body2"
          sx={{
            mt: 0.75,
            width: "100%",
            minHeight: { xs: 40, md: 52 },
            fontSize: { xs: "0.96rem", md: "1.06rem", lg: "1.12rem" },
            fontWeight: 500,
            lineHeight: 1.45,
            textAlign: "left",
            color: (theme) => alpha(theme.palette.common.white, 0.9),
            display: "-webkit-box",
            WebkitLineClamp: { xs: 2, md: 3 },
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {entry.description}
        </Typography>
      ) : undefined,
    };
  });
