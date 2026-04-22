"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { renderNavigationIcon } from "@/components/portfolio/layout/navigationIcons";
import SubsectionPager, {
  type SubsectionPagerItem,
} from "@/components/portfolio/layout/SubsectionPager";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import CoreCompetencies, {
  type CompetencyCategory,
} from "@/components/portfolio/panels/CoreCompetencies";
import {
  ArchitectureDiagramsSlide,
  DemoSlide,
  MarkdownContent,
  MediaCycler,
  PanelFrame,
  VideoLightbox,
} from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import type {
  ProjectData,
  ProjectDiagramConfig,
  ProjectDiagramVisualConfig,
} from "@/types/components/portfolio";
import { withBasePath } from "@/utils/basePath";
export type { ProjectData, Technology } from "@/types/components/portfolio";

interface ProjectPresentationProps {
  project: ProjectData;
}

type ProjectSection = {
  key: "overview" | "why" | "demo" | "technologies" | "specifications" | "diagrams";
  title: string;
  subtitle: string;
  icon: ReactNode;
};

type ProjectTerminalDemoConfig = {
  title?: string;
  subtitle?: string;
  caption?: string;
  videoUrl?: string;
};
type ProjectDiagramEntry = {
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
  selectorOptionVisual?: ProjectDiagramVisualConfig;
  selectorSelectedVisual?: ProjectDiagramVisualConfig;
};

type TechnologyDomainKey = "frontend" | "backend" | "aiData" | "cloud" | "quality" | "other";

type TechnologyDomainConfig = {
  title: string;
  shortText: string;
  pagerEmoji: string;
};

const buildSectionLabel = (index: number, title: string) => `${index + 1}. ${title}`;
const sectionEmojiIcon = (emoji: string) => (
  <Typography
    component="span"
    aria-hidden
    sx={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    }}
  >
    {emoji}
  </Typography>
);
type ResolvedDiagramVisual = {
  iconNode?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
};

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

const TECHNOLOGY_DOMAIN_CONFIG: Record<TechnologyDomainKey, TechnologyDomainConfig> = {
  frontend: {
    title: "Frontend & UX",
    shortText: "UI frameworks and client-side rendering",
    pagerEmoji: "🖥️",
  },
  backend: {
    title: "Backend & APIs",
    shortText: "Services, application logic, and transport",
    pagerEmoji: "⚙️",
  },
  aiData: {
    title: "AI & Data",
    shortText: "LLM tooling, storage, and data systems",
    pagerEmoji: "🤖",
  },
  cloud: {
    title: "Cloud & Platform",
    shortText: "Hosting, serverless, and infrastructure",
    pagerEmoji: "☁️",
  },
  quality: {
    title: "Quality & Tooling",
    shortText: "Testing, build, and developer workflow",
    pagerEmoji: "🧪",
  },
  other: {
    title: "Integrations",
    shortText: "Supporting frameworks and connectors",
    pagerEmoji: "🧩",
  },
};

const normalizeTechnologyName = (technologyName: string) => technologyName.toLowerCase();

const classifyTechnologyDomain = (technologyName: string): TechnologyDomainKey => {
  const normalized = normalizeTechnologyName(technologyName);

  if (
    /(react|next\.?js|vue|angular|material ui|mui|tailwind|css|html|handlebars|backbone|expo|react native|frontend|ui)/i.test(
      normalized,
    )
  ) {
    return "frontend";
  }

  if (
    /(langchain|openai|gemini|llm|ai|nlp|postgres|postgresql|mysql|sql|cosmos|mongodb|redis|vector|embedding|data)/i.test(
      normalized,
    )
  ) {
    return "aiData";
  }

  if (
    /(azure|aws|gcp|google cloud|cloud|s3|serverless|functions|docker|kubernetes|container)/i.test(
      normalized,
    )
  ) {
    return "cloud";
  }

  if (
    /(jest|junit|mockito|vitest|cypress|playwright|eslint|prettier|lint|test|maven|turborepo|webpack|github actions|ci\/cd|pipeline|build)/i.test(
      normalized,
    )
  ) {
    return "quality";
  }

  if (
    /(spring|flask|fastapi|nestjs|express|java|python|go|node|api|rest|axios)/i.test(normalized)
  ) {
    return "backend";
  }

  return "other";
};

const resolveTechnologyEmoji = (technologyName: string, configuredEmoji?: string) => {
  const explicit = configuredEmoji?.trim();
  if (explicit) {
    return explicit;
  }

  const normalized = normalizeTechnologyName(technologyName);
  if (/(react|next|frontend|ui|material|tailwind|html|css)/i.test(normalized)) {
    return "🖥️";
  }
  if (/(typescript|javascript|node|npm|yarn|pnpm|turborepo|webpack|vite|build)/i.test(normalized)) {
    return "🛠️";
  }
  if (/(langchain|openai|gemini|llm|ai|rag|nlp|vector|embedding|audio|speech)/i.test(normalized)) {
    return "🤖";
  }
  if (/(azure|aws|cloud|serverless|functions|blob|storage|s3)/i.test(normalized)) {
    return "☁️";
  }
  if (/(postgres|mysql|sql|cosmos|mongo|redis|db|database)/i.test(normalized)) {
    return "🗄️";
  }
  if (/(python|java|flask|spring|nestjs|express|api|rest|axios|fetch)/i.test(normalized)) {
    return "⚙️";
  }
  if (/(jest|junit|mockito|cypress|playwright|test|lint|prettier|eslint)/i.test(normalized)) {
    return "✅";
  }
  if (/(mermaid|diagram)/i.test(normalized)) {
    return "🧭";
  }
  return "✨";
};

export default function ProjectPresentation({ project }: ProjectPresentationProps) {
  const diagramEntries = useMemo<ProjectDiagramEntry[]>(() => {
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
        selectorOptionVisual: { type: "emoji" as const, icon: "🧱" },
      },
      {
        key: "component-diagram",
        title: "Component Diagram",
        shortText: "Core modules, responsibilities, and integrations.",
        description: "Core modules, responsibilities, and integrations.",
        diagram: project.componentDiagram?.trim() || "",
        selectorOptionVisual: { type: "emoji" as const, icon: "🧩" },
      },
      {
        key: "sequence-diagram",
        title: "Sequence Diagram",
        shortText: "Runtime interaction flow across the stack.",
        description: "Runtime interaction flow across the stack.",
        diagram: project.sequenceDiagram?.trim() || "",
        selectorOptionVisual: { type: "emoji" as const, icon: "🔀" },
      },
    ];

    return fallbackDiagrams.filter((entry) => entry.diagram.length > 0);
  }, [project]);
  const [activeDiagramKey, setActiveDiagramKey] = useState<string | undefined>(
    diagramEntries[0]?.key,
  );
  const activeDiagramIndex = useMemo(() => {
    const index = diagramEntries.findIndex((entry) => entry.key === activeDiagramKey);
    return index >= 0 ? index : 0;
  }, [activeDiagramKey, diagramEntries]);
  const hasMultipleArchitectureDiagrams = diagramEntries.length > 1;
  const diagramPagerItems = useMemo<SubsectionPagerItem[]>(
    () =>
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
      }),
    [diagramEntries],
  );
  const handleSelectArchitectureDiagram = useCallback((key: string) => {
    setActiveDiagramKey(key);
  }, []);
  const handlePreviousArchitectureDiagram = useCallback(() => {
    if (diagramEntries.length === 0) {
      return;
    }
    const previousIndex = (activeDiagramIndex - 1 + diagramEntries.length) % diagramEntries.length;
    setActiveDiagramKey(diagramEntries[previousIndex]?.key);
  }, [activeDiagramIndex, diagramEntries]);
  const handleNextArchitectureDiagram = useCallback(() => {
    if (diagramEntries.length === 0) {
      return;
    }
    const nextIndex = (activeDiagramIndex + 1) % diagramEntries.length;
    setActiveDiagramKey(diagramEntries[nextIndex]?.key);
  }, [activeDiagramIndex, diagramEntries]);
  const useSharedArchitectureDiagramsSlide = /podcast/i.test(project.project);
  const useSharedDemoSlide = /podcast/i.test(project.project);
  const useWhyThisInterestsSlide =
    /podcast/i.test(project.project) && (project.interestsMeWhy?.trim().length ?? 0) > 0;
  const isAiPatientListPodcasts = /ai patient list podcasts/i.test(project.project);
  const projectTerminalDemo = useMemo(() => {
    const configured = (project as { terminalDemo?: ProjectTerminalDemoConfig } | undefined)
      ?.terminalDemo;
    const fallbackVideoUrl = project.demoVideoUrl?.trim();
    const videoUrl = configured?.videoUrl?.trim() || fallbackVideoUrl || "";
    if (!videoUrl) {
      return null;
    }

    const title = configured?.title?.trim() || `${project.project} Demo`;
    const subtitle = configured?.subtitle?.trim() || "";
    const caption = configured?.caption?.trim() || "";

    return {
      title,
      subtitle,
      caption,
      videoUrl,
    };
  }, [project]);
  const demoCaptionSlotSx = useMemo<SxProps<Theme>>(
    () => ({
      mt: isAiPatientListPodcasts ? 0 : 0.75,
      flexShrink: 0,
      width: "100%",
      minHeight: isAiPatientListPodcasts ? { xs: 44, md: 58 } : { xs: 40, md: 52 },
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      alignContent: "flex-start",
      pt: 0,
      pb: 0,
    }),
    [isAiPatientListPodcasts],
  );
  const demoCaptionTextSx = useMemo<SxProps<Theme>>(
    () => ({
      width: "100%",
      fontSize: isAiPatientListPodcasts
        ? { xs: "1.02rem", md: "1.12rem", lg: "1.18rem" }
        : { xs: "0.96rem", md: "1.06rem", lg: "1.12rem" },
      fontWeight: 500,
      lineHeight: isAiPatientListPodcasts ? 1.45 : 1.45,
      textAlign: "left",
      color: (theme) =>
        isAiPatientListPodcasts
          ? alpha(theme.palette.common.white, 0.96)
          : alpha(theme.palette.common.white, 0.9),
      ...(isAiPatientListPodcasts
        ? {
            display: "block",
            overflow: "visible",
          }
        : {
            display: "-webkit-box",
            WebkitLineClamp: { xs: 2, md: 3 },
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }),
    }),
    [isAiPatientListPodcasts],
  );
  const sharedDemoVideoMaxHeight = useMemo(
    () =>
      isAiPatientListPodcasts
        ? { xs: 450, sm: 510, md: 570, lg: 630 }
        : { xs: 300, sm: 340, md: 380, lg: 420 },
    [isAiPatientListPodcasts],
  );
  const projectArchitectureMenuId = useMemo(
    () =>
      `project-architecture-diagram-selector-${project.project
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}`,
    [project.project],
  );
  const overviewMarkdownContent = useMemo(() => {
    const markdownSections: string[] = [];

    if (project.wowFactor?.trim()) {
      markdownSections.push(`> ${project.wowFactor.trim()}`);
    }

    if (project.description?.trim()) {
      markdownSections.push(project.description.trim());
    }

    const topTechnologies = project.technologiesUsed.slice(0, 8);
    if (topTechnologies.length > 0) {
      const technologyLines = topTechnologies.map((tech) =>
        tech.url ? `- [${tech.name}](${tech.url})` : `- ${tech.name}`,
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
  }, [project.description, project.specifications, project.technologiesUsed, project.wowFactor]);
  const overviewItems = useMemo<MediaCyclerItem[]>(() => {
    const items: MediaCyclerItem[] = [];

    items.push({
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
    });

    return items;
  }, [overviewMarkdownContent]);
  const demoItems = useMemo<MediaCyclerItem[]>(() => {
    const items: MediaCyclerItem[] = [];

    if (project.demoGifUrl) {
      items.push({
        key: "demo-image",
        title: "",
        mediaType: "image",
        mediaUrl: withBasePath(project.demoGifUrl),
        mediaAlt: `${project.project} demo`,
        mediaLightboxTitle: `${project.project} demo`,
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        imageWidth: 800,
        imageHeight: 450,
        imageStyle: {
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          borderRadius: 0,
        },
      });
    }

    if (project.demoVideoUrl) {
      items.push({
        key: "demo-video",
        title: "",
        mediaType: "video",
        mediaUrl: withBasePath(project.demoVideoUrl),
        mediaLightboxTitle: `${project.project} demo video`,
        controls: true,
        playsInline: true,
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        previewVideoSx: {
          width: "100%",
          height: "100%",
          maxHeight: "100%",
          maxWidth: "100%",
          objectFit: "contain",
          borderRadius: 0,
        },
      });
    }

    return items;
  }, [project.demoGifUrl, project.demoVideoUrl, project.project]);
  const [activeOverviewMediaKey, setActiveOverviewMediaKey] = useState<string | undefined>(
    overviewItems[0]?.key,
  );
  const [activeDemoMediaKey, setActiveDemoMediaKey] = useState<string | undefined>(
    demoItems[0]?.key,
  );
  const technologyDomainBuckets = useMemo(() => {
    const grouped = project.technologiesUsed.reduce<
      Record<TechnologyDomainKey, ProjectData["technologiesUsed"]>
    >(
      (accumulator, technology) => {
        const domainKey = classifyTechnologyDomain(technology.name);
        accumulator[domainKey].push(technology);
        return accumulator;
      },
      {
        frontend: [],
        backend: [],
        aiData: [],
        cloud: [],
        quality: [],
        other: [],
      },
    );

    return (Object.keys(TECHNOLOGY_DOMAIN_CONFIG) as TechnologyDomainKey[])
      .map((domainKey) => {
        const technologies = grouped[domainKey];
        if (technologies.length === 0) {
          return null;
        }

        const config = TECHNOLOGY_DOMAIN_CONFIG[domainKey];
        return {
          key: domainKey,
          title: config.title,
          shortText: config.shortText,
          pagerEmoji: config.pagerEmoji,
          technologies,
        };
      })
      .filter((domain): domain is NonNullable<typeof domain> => Boolean(domain));
  }, [project.technologiesUsed]);
  const technologyCompetencyCategories = useMemo<CompetencyCategory[]>(
    () =>
      technologyDomainBuckets.map((domain) => ({
        title: domain.title,
        shortText: domain.shortText,
        emoji: domain.pagerEmoji,
        items: domain.technologies.map((technology) => ({
          label: technology.name,
          description: `${domain.shortText}.`,
          emoji: resolveTechnologyEmoji(technology.name, technology.emoji),
          sourceLink: technology.url,
        })),
      })),
    [technologyDomainBuckets],
  );
  const projectPresentationNavigationControlSx: SxProps<Theme> = (theme) => ({
    color: theme.palette.common.black,
    borderColor: theme.palette.common.black,
    bgcolor: theme.palette.common.white,
    "&:hover": {
      bgcolor: theme.palette.common.white,
    },
    "&.Mui-disabled": {
      color: alpha(theme.palette.common.black, 0.36),
      borderColor: alpha(theme.palette.common.black, 0.36),
      bgcolor: alpha(theme.palette.common.white, 0.8),
    },
  });
  const projectPresentationExpandControlSx: SxProps<Theme> = (theme) => ({
    color: theme.palette.common.black,
    borderColor: theme.palette.common.black,
    bgcolor: theme.palette.common.white,
    "&:hover": {
      bgcolor: theme.palette.common.white,
    },
    "&.Mui-disabled": {
      color: alpha(theme.palette.common.black, 0.36),
      borderColor: alpha(theme.palette.common.black, 0.36),
      bgcolor: alpha(theme.palette.common.white, 0.8),
    },
  });
  const diagramItems = useMemo<MediaCyclerItem[]>(
    () =>
      diagramEntries.map((entry) => {
        return {
          key: entry.key,
          title: "",
          mediaType: "diagram",
          mediaUrl: entry.diagram,
          mediaLightboxTitle: entry.title,
          lightboxSubtitle: entry.shortText || undefined,
          onSelect: () => {
            setActiveDiagramKey(entry.key);
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
            height: "100%",
            width: "100%",
            showToolbar: true,
            showGridDots: true,
            autoFitPadding: entry.autoFitPadding ?? 14,
            autoFitScaleMultiplier: entry.autoFitScaleMultiplier ?? 1,
            autoFitOffsetX: entry.autoFitOffsetX ?? 0,
            autoFitOffsetY: entry.autoFitOffsetY ?? 0,
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
      }),
    [diagramEntries],
  );

  useEffect(() => {
    setActiveDiagramKey(diagramEntries[0]?.key);
  }, [diagramEntries]);
  useEffect(() => {
    setActiveOverviewMediaKey(overviewItems[0]?.key);
  }, [overviewItems]);
  useEffect(() => {
    setActiveDemoMediaKey(demoItems[0]?.key);
  }, [demoItems]);

  const sections = useMemo<ProjectSection[]>(() => {
    const nextSections: ProjectSection[] = [
      {
        key: "overview",
        title: "Overview",
        subtitle: "Project narrative and implementation snapshot",
        icon: sectionEmojiIcon("🔎"),
      },
      ...(useWhyThisInterestsSlide
        ? [
            {
              key: "why" as const,
              title: "Why This Interests Me",
              subtitle: "Personal engineering motivation",
              icon: sectionEmojiIcon("❓"),
            },
          ]
        : []),
      ...(demoItems.length > 0
        ? [
            {
              key: "demo" as const,
              title: "Demo",
              subtitle: "Visual walkthrough",
              icon: sectionEmojiIcon("🎬"),
            },
          ]
        : []),
      {
        key: "technologies",
        title: "Technologies",
        subtitle: "Stack and tools used",
        icon: sectionEmojiIcon("🤖"),
      },
      {
        key: "specifications",
        title: "Specifications",
        subtitle: "Structure and implementation details",
        icon: sectionEmojiIcon("📐"),
      },
    ];

    if (diagramItems.length > 0) {
      nextSections.push({
        key: "diagrams",
        title: "Architecture",
        subtitle: "Diagram walkthrough",
        icon: sectionEmojiIcon("🚧"),
      });
    }

    return nextSections;
  }, [demoItems.length, diagramItems.length, useWhyThisInterestsSlide]);

  const [activeSectionKey, setActiveSectionKey] = useState<ProjectSection["key"]>(
    sections[0]?.key ?? "overview",
  );

  useEffect(() => {
    if (!sections.some((section) => section.key === activeSectionKey)) {
      setActiveSectionKey(sections[0]?.key ?? "overview");
    }
  }, [activeSectionKey, sections]);

  const activeSectionIndex = Math.max(
    0,
    sections.findIndex((section) => section.key === activeSectionKey),
  );
  const activeSection = sections[activeSectionIndex] ?? sections[0];
  const hasMultipleSections = sections.length > 1;

  const handlePreviousSection = () => {
    if (!hasMultipleSections) {
      return;
    }

    if (activeSectionIndex <= 0) {
      setActiveSectionKey(sections[sections.length - 1]?.key ?? sections[0]!.key);
      return;
    }

    setActiveSectionKey(sections[activeSectionIndex - 1]!.key);
  };

  const handleNextSection = () => {
    if (!hasMultipleSections) {
      return;
    }

    if (activeSectionIndex >= sections.length - 1) {
      setActiveSectionKey(sections[0]!.key);
      return;
    }

    setActiveSectionKey(sections[activeSectionIndex + 1]!.key);
  };

  const pagerItems = useMemo<SubsectionPagerItem[]>(
    () =>
      sections.map((section, index) => ({
        key: section.key,
        title: section.title,
        selectedTitle: section.title,
        selectedIcon: section.icon,
        optionTitle: buildSectionLabel(index, section.title),
        optionSubtitle: section.subtitle,
        optionIcon: section.icon,
      })),
    [sections],
  );

  const renderSpecification = (value: unknown): ReactNode => {
    if (Array.isArray(value)) {
      return (
        <List dense>
          {value.map((item, index) => (
            <ListItem key={index}>{renderSpecification(item)}</ListItem>
          ))}
        </List>
      );
    }

    if (typeof value === "object" && value !== null) {
      return Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => (
        <Accordion key={childKey} sx={{ backgroundColor: "transparent" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{childKey}</Typography>
          </AccordionSummary>
          <AccordionDetails>{renderSpecification(childValue)}</AccordionDetails>
        </Accordion>
      ));
    }

    return <MarkdownContent content={String(value)} sx={{ "& p": { mb: 0 } }} />;
  };

  const renderOverview = () => (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {useSharedDemoSlide ? (
        <DemoSlide
          title=""
          subtitle=""
          contentSx={{
            minHeight: 0,
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MediaCycler
            items={overviewItems.map((item) => ({
              ...item,
              onSelect: () => {
                setActiveOverviewMediaKey(item.key);
              },
            }))}
            singlePanel
            singlePanelActiveKey={activeOverviewMediaKey}
            allowSwipe
            showChevronNavigation={overviewItems.length > 1}
            loopNavigation={overviewItems.length > 1}
            navigationControlSx={projectPresentationNavigationControlSx}
            expandControlSx={projectPresentationExpandControlSx}
            stackSx={{ minHeight: 0, height: "100%" }}
          />
        </DemoSlide>
      ) : (
        <MediaCycler
          items={overviewItems.map((item) => ({
            ...item,
            onSelect: () => {
              setActiveOverviewMediaKey(item.key);
            },
          }))}
          singlePanel
          singlePanelActiveKey={activeOverviewMediaKey}
          allowSwipe
          showChevronNavigation={overviewItems.length > 1}
          loopNavigation={overviewItems.length > 1}
          navigationControlSx={projectPresentationNavigationControlSx}
          expandControlSx={projectPresentationExpandControlSx}
          stackSx={{ minHeight: 0, height: "100%" }}
        />
      )}
    </Box>
  );

  const renderTechnologies = () => {
    return (
      <Box
        sx={{
          px: { xs: 1.5, md: 2 },
          py: { xs: 1.5, md: 2 },
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <CoreCompetencies
          embedded
          categoriesOverride={technologyCompetencyCategories}
          menuIdPrefix={`${project.project.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-technologies`}
        />
      </Box>
    );
  };

  const renderWhyThisInterests = () => (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <DemoSlide
        title=""
        subtitle=""
        contentSx={{
          minHeight: 0,
          height: "100%",
          overflow: "auto",
          pr: 0.3,
        }}
      >
        <MarkdownContent
          content={project.interestsMeWhy ?? ""}
          variant="body1"
          sx={{
            "& p": { mb: 1.2, lineHeight: 1.6 },
            "& p:last-of-type": { mb: 0 },
          }}
        />
      </DemoSlide>
    </Box>
  );

  const renderDemo = () => (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {useSharedDemoSlide && projectTerminalDemo ? (
        <Box sx={{ minHeight: 0, height: "100%", display: "flex", flexDirection: "column" }}>
          <DemoSlide
            title=""
            subtitle=""
            caption={projectTerminalDemo.caption}
            contentSx={{
              minHeight: 0,
              flex: isAiPatientListPodcasts ? "0 0 auto" : "1 1 auto",
              display: "flex",
              alignItems: isAiPatientListPodcasts ? "flex-start" : "center",
              justifyContent: isAiPatientListPodcasts ? "flex-start" : "center",
              overflow: isAiPatientListPodcasts ? "visible" : "hidden",
            }}
            captionSlotSx={demoCaptionSlotSx}
            captionTextSx={demoCaptionTextSx}
          >
            <VideoLightbox
              src={withBasePath(projectTerminalDemo.videoUrl)}
              title={projectTerminalDemo.title}
              caption={projectTerminalDemo.caption}
              controls
              playsInline
              preload="metadata"
              triggerSx={{
                width: "100%",
                height: "auto",
                maxHeight: sharedDemoVideoMaxHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto",
              }}
              previewVideoSx={{
                width: "100%",
                maxWidth: "100%",
                height: "auto",
                maxHeight: sharedDemoVideoMaxHeight,
                objectFit: "contain",
                borderRadius: "16px",
              }}
              expandButtonSx={projectPresentationExpandControlSx}
            />
          </DemoSlide>
        </Box>
      ) : demoItems.length > 0 ? (
        <MediaCycler
          items={demoItems.map((item) => ({
            ...item,
            onSelect: () => {
              setActiveDemoMediaKey(item.key);
            },
          }))}
          singlePanel
          singlePanelActiveKey={activeDemoMediaKey}
          allowSwipe
          showChevronNavigation={demoItems.length > 1}
          loopNavigation={demoItems.length > 1}
          navigationControlSx={projectPresentationNavigationControlSx}
          expandControlSx={projectPresentationExpandControlSx}
          stackSx={{ minHeight: 0, height: "100%" }}
        />
      ) : null}
    </Box>
  );

  const renderSpecifications = () => (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {useSharedDemoSlide ? (
        <DemoSlide
          title=""
          subtitle=""
          contentSx={{
            minHeight: 0,
            height: "100%",
            overflow: "auto",
          }}
        >
          <Box sx={{ minHeight: 0, overflow: "hidden" }}>
            {Object.entries(project.specifications).map(([key, value]) => (
              <Accordion key={key} sx={{ backgroundColor: "transparent", my: 0.5 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">{key}</Typography>
                </AccordionSummary>
                <AccordionDetails>{renderSpecification(value)}</AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DemoSlide>
      ) : (
        <Box sx={{ minHeight: 0, overflow: "hidden" }}>
          {Object.entries(project.specifications).map(([key, value]) => (
            <Accordion key={key} sx={{ backgroundColor: "transparent", my: 0.5 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{key}</Typography>
              </AccordionSummary>
              <AccordionDetails>{renderSpecification(value)}</AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );

  const renderDiagrams = () => (
    <Box
      sx={{
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        overflow: "hidden",
      }}
    >
      {useSharedArchitectureDiagramsSlide ? (
        <ArchitectureDiagramsSlide
          activeDiagramKey={activeDiagramKey}
          diagramPagerItems={diagramPagerItems}
          diagramItems={diagramItems}
          suppressMediaHeading
          hasMultipleDiagrams={hasMultipleArchitectureDiagrams}
          onSelectDiagram={handleSelectArchitectureDiagram}
          onPreviousDiagram={handlePreviousArchitectureDiagram}
          onNextDiagram={handleNextArchitectureDiagram}
          rootSx={{
            minHeight: 0,
            height: "100%",
            flex: "1 1 auto",
          }}
          panelSx={{
            width: "100%",
            maxWidth: "1200px",
            minHeight: 0,
            height: "100%",
            flex: "1 1 auto",
            mx: "auto",
            p: 0,
            borderColor: "transparent",
            bgcolor: "transparent",
            backgroundImage: "none",
            boxShadow: "none",
          }}
          menuId={projectArchitectureMenuId}
          previousAriaLabel="Previous architecture diagram"
          nextAriaLabel="Next architecture diagram"
          selectorAriaLabel="Open architecture diagram selector"
          selectedValueAsTitle
          selectedVisualSize={34}
          fallbackTitle="Architecture Diagram"
          topRailSx={{
            mx: 0,
            mt: 0,
            position: "relative",
            zIndex: 6,
            color: (theme) => alpha(theme.palette.common.white, 0.84),
            bgcolor: "transparent !important",
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            borderBottom: "0 !important",
            borderColor: "transparent !important",
            backdropFilter: "none !important",
            filter: "none !important",
            boxShadow: "none !important",
            "& .MuiTypography-root": {
              color: (theme) => `${alpha(theme.palette.common.white, 0.84)} !important`,
            },
            "& .MuiChip-root": {
              color: (theme) => `${alpha(theme.palette.common.white, 0.84)} !important`,
            },
            "& .MuiIconButton-root, & .MuiSvgIcon-root": {
              color: (theme) => `${alpha(theme.palette.common.white, 0.84)} !important`,
            },
          }}
          contentSx={{
            minHeight: 0,
            flex: "1 1 auto",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            pt: 0,
            pb: 0,
          }}
          hostSx={{
            px: { xs: 1, md: 1.5 },
            pt: { xs: 0.75, md: 1 },
            pb: { xs: 1, md: 1.5 },
            minHeight: 0,
            flex: "1 1 auto",
            "& .MuiToolbar-root": {
              border: "1px solid rgba(96, 165, 250, 0.22)",
              borderBottom: 0,
              borderTopLeftRadius: "14px",
              borderTopRightRadius: "14px",
              background:
                "linear-gradient(180deg, rgba(30, 41, 59, 0.94), rgba(15, 23, 42, 0.9)), rgba(15, 23, 42, 0.92)",
              color: "#dbeafe",
            },
            "& .MuiIconButton-root": {
              color: "#dbeafe",
            },
            "& .MuiIconButton-root.Mui-disabled": {
              color: "rgba(148, 163, 184, 0.38)",
            },
            "& .MuiDivider-root": {
              borderColor: "rgba(96, 165, 250, 0.24)",
            },
            "& [id$='-container']": {
              width: "100% !important",
              borderColor: "rgba(96, 165, 250, 0.24)",
              borderRadius: "14px",
              overflow: "hidden",
            },
            "& .diagram-mermaid": {
              width: "100%",
            },
            "& .diagram-mermaid svg": {
              display: "block",
              width: "100%",
              maxWidth: "100%",
              height: "auto",
            },
          }}
          mediaCyclerShowChevronNavigation={false}
          mediaCyclerLoopNavigation={false}
          mediaCyclerAllowSwipe={false}
          mediaCyclerNavigationControlSx={projectPresentationNavigationControlSx}
          mediaCyclerExpandControlSx={projectPresentationExpandControlSx}
          mediaCyclerStackSx={{ minHeight: 0, height: "100%" }}
        />
      ) : (
        <Box sx={{ minHeight: 0, flex: "1 1 auto" }}>
          <MediaCycler
            items={diagramItems}
            singlePanel
            singlePanelActiveKey={activeDiagramKey}
            allowSwipe
            showChevronNavigation
            loopNavigation={diagramItems.length > 1}
            navigationControlSx={projectPresentationNavigationControlSx}
            stackSx={{ minHeight: 0, height: "100%" }}
          />
        </Box>
      )}
    </Box>
  );

  const renderActiveSection = () => {
    switch (activeSectionKey) {
      case "overview":
        return renderOverview();
      case "why":
        return renderWhyThisInterests();
      case "demo":
        return renderDemo();
      case "technologies":
        return renderTechnologies();
      case "specifications":
        return renderSpecifications();
      case "diagrams":
        return renderDiagrams();
      default:
        return renderOverview();
    }
  };

  return (
    <PortfolioPanel
      sx={{
        px: 0,
        py: { xs: 1, md: 1.25 },
        mb: "0 !important",
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <PanelFrame
        useNegativeTopRailMargins
        topRailSx={{
          minHeight: { xs: 78, md: 86 },
          display: "flex",
          alignItems: "center",
        }}
        topRail={
          hasMultipleSections ? (
            <Box sx={{ width: "100%" }}>
              <SubsectionPager
                menuId="project-showcase-section-selector"
                items={pagerItems}
                currentKey={activeSectionKey}
                selectedValueAsTitle
                selectedVisualSize={56}
                selectedIconFontSize="1.5rem"
                selectedEmojiFontSize="2.66rem"
                optionVisualSize={42.5}
                optionEmojiFontSize="1.465rem"
                iconFrameStyle="none"
                previousAriaLabel="Previous project section"
                nextAriaLabel="Next project section"
                selectorAriaLabel="Open project section selector"
                previousButtonSx={{
                  ml: { xs: 1, md: 1.25 },
                }}
                onSelect={(key) => setActiveSectionKey(key as ProjectSection["key"])}
                onPrevious={handlePreviousSection}
                onNext={handleNextSection}
              />
            </Box>
          ) : (
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 1.25 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {activeSection?.icon}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {activeSection?.title ?? "Overview"}
                </Typography>
              </Stack>
            </Box>
          )
        }
        rootSx={{ minHeight: 0, height: "100%" }}
      >
        <Box
          sx={{
            minHeight: 0,
            flex: "1 1 auto",
            height: "100%",
            overflow: "hidden",
            overflowX: "hidden",
          }}
        >
          {renderActiveSection()}
        </Box>
      </PanelFrame>
    </PortfolioPanel>
  );
}
