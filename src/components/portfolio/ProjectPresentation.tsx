"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { renderNavigationIcon } from "@/components/portfolio/layout/navigationIcons";
import SubsectionPager, {
  type SubsectionPagerItem,
} from "@/components/portfolio/layout/SubsectionPager";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import type { CompetencyCategory } from "@/components/portfolio/panels/CoreCompetencies";
import { type MediaCyclerItem, PanelFrame } from "@/components/shared";
import { MarkdownContent } from "@/components/shared/content";
import type {
  ProjectData,
  ProjectDiagramConfig,
  ProjectDiagramVisualConfig,
  ProjectSectionPagerSfxValue,
  ProjectPresentationSectionKey,
} from "@/types/components/portfolio";
import { withBasePath } from "@/utils/basePath";
import { createLogger } from "@/utils/observability/logger";
import { markStart, measureAfterNextPaint } from "@/utils/observability/perf";
import { resolvePresentationBehavior } from "./project-presentation/presentationConfig";
import { useDeepLinkState } from "./project-presentation/hooks/useDeepLinkState";
import { usePresentationSections } from "./project-presentation/hooks/usePresentationSections";
import { useSectionAudio } from "./project-presentation/hooks/useSectionAudio";
import ArchitectureSection from "./project-presentation/sections/ArchitectureSection";
import DemoSection, {
  type ResolvedProjectTerminalDemo,
} from "./project-presentation/sections/DemoSection";
import OverviewSection from "./project-presentation/sections/OverviewSection";
import SpecificationsSection from "./project-presentation/sections/SpecificationsSection";
import TechnologiesSection from "./project-presentation/sections/TechnologiesSection";
import WhyThisInterestsSection from "./project-presentation/sections/WhyThisInterestsSection";

export type { ProjectData, Technology } from "@/types/components/portfolio";

interface ProjectPresentationProps {
  project: ProjectData;
}

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

const DEFAULT_SECTION_PAGER_SFX: Record<
  ProjectPresentationSectionKey,
  ProjectSectionPagerSfxValue
> = {
  overview: "random",
  why: "random",
  demo: "random",
  technologies: "random",
  specifications: "random",
  diagrams: "random",
};

const presentationPerfLogger = createLogger("presentation-perf");

const resolveSectionPagerSfxPath = (
  configured: ProjectSectionPagerSfxValue | undefined,
  fallback: ProjectSectionPagerSfxValue,
): ProjectSectionPagerSfxValue => {
  const normalized = configured?.trim();
  if (!normalized) {
    return fallback;
  }
  return normalized as ProjectSectionPagerSfxValue;
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

const resolveTerminalDemo = (project: ProjectData): ResolvedProjectTerminalDemo | null => {
  const configured = project.terminalDemo;
  const configuredMediaUrl = configured?.mediaUrl?.trim();
  const fallbackVideoUrl = project.demoVideoUrl?.trim();
  const fallbackImageUrl = project.demoGifUrl?.trim();
  const fallbackMediaType: "video" | "image" | null = fallbackVideoUrl
    ? "video"
    : fallbackImageUrl
      ? "image"
      : null;
  const mediaType = configured?.mediaType ?? fallbackMediaType;

  if (!mediaType) {
    return null;
  }

  const mediaUrl =
    configuredMediaUrl ||
    (mediaType === "video" ? fallbackVideoUrl : fallbackImageUrl) ||
    fallbackVideoUrl ||
    fallbackImageUrl;

  if (!mediaUrl) {
    return null;
  }

  return {
    title: configured?.title?.trim() || `${project.project} Demo`,
    subtitle: configured?.subtitle?.trim(),
    caption: configured?.caption?.trim() || project.demoCaption?.trim() || "",
    mediaType,
    mediaUrl,
    mediaAlt: configured?.mediaAlt?.trim() || `${project.project} demo`,
  };
};

export default function ProjectPresentation({ project }: ProjectPresentationProps) {
  const projectMenuIdBase = useMemo(
    () => project.project.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    [project.project],
  );
  const presentationBehavior = useMemo(() => resolvePresentationBehavior(project), [project]);
  const useSharedOverviewSlide = presentationBehavior.useSharedOverviewSlide;
  const useSharedDemoSlide = presentationBehavior.useSharedDemoSlide;
  const useSharedArchitectureDiagramsSlide =
    presentationBehavior.useSharedArchitectureDiagramsSlide;
  const isPodcastsLayout = presentationBehavior.demoLayout === "podcasts";
  const useWhyThisInterestsSlide =
    presentationBehavior.enableWhyThisInterestsSection &&
    (project.interestsMeWhy?.trim().length ?? 0) > 0;
  const projectSlug = useMemo(() => {
    const hrefSlug = project.href?.trim().replace(/^\/+|\/+$/g, "");
    if (hrefSlug) {
      return hrefSlug.toLowerCase();
    }
    return projectMenuIdBase.toLowerCase();
  }, [project.href, projectMenuIdBase]);
  const sectionPagerSfxPaths = useMemo(
    () => ({
      overview: resolveSectionPagerSfxPath(
        project.sectionPagerSfx?.overview,
        DEFAULT_SECTION_PAGER_SFX.overview,
      ),
      why: resolveSectionPagerSfxPath(project.sectionPagerSfx?.why, DEFAULT_SECTION_PAGER_SFX.why),
      demo: resolveSectionPagerSfxPath(
        project.sectionPagerSfx?.demo,
        DEFAULT_SECTION_PAGER_SFX.demo,
      ),
      technologies: resolveSectionPagerSfxPath(
        project.sectionPagerSfx?.technologies,
        DEFAULT_SECTION_PAGER_SFX.technologies,
      ),
      specifications: resolveSectionPagerSfxPath(
        project.sectionPagerSfx?.specifications,
        DEFAULT_SECTION_PAGER_SFX.specifications,
      ),
      diagrams: resolveSectionPagerSfxPath(
        project.sectionPagerSfx?.diagrams,
        DEFAULT_SECTION_PAGER_SFX.diagrams,
      ),
    }),
    [project.sectionPagerSfx],
  );

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

  const projectTerminalDemo = useMemo(() => resolveTerminalDemo(project), [project]);

  const demoCaptionSlotSx = useMemo<SxProps<Theme>>(
    () => ({
      mt: isPodcastsLayout ? 0 : 0.75,
      flexShrink: 0,
      width: "100%",
      minHeight: isPodcastsLayout ? { xs: 44, md: 58 } : { xs: 40, md: 52 },
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      alignContent: "flex-start",
      pt: 0,
      pb: 0,
    }),
    [isPodcastsLayout],
  );
  const demoCaptionTextSx = useMemo<SxProps<Theme>>(
    () => ({
      width: "100%",
      fontSize: isPodcastsLayout
        ? { xs: "1.02rem", md: "1.12rem", lg: "1.18rem" }
        : { xs: "0.96rem", md: "1.06rem", lg: "1.12rem" },
      fontWeight: 500,
      lineHeight: 1.45,
      textAlign: "left",
      color: (theme) =>
        isPodcastsLayout
          ? alpha(theme.palette.common.white, 0.96)
          : alpha(theme.palette.common.white, 0.9),
      ...(isPodcastsLayout
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
    [isPodcastsLayout],
  );
  const sharedDemoVideoMaxHeight = useMemo(
    () =>
      isPodcastsLayout
        ? { xs: 450, sm: 510, md: 570, lg: 630 }
        : { xs: 300, sm: 340, md: 380, lg: 420 },
    [isPodcastsLayout],
  );

  const projectArchitectureMenuId = useMemo(
    () => `project-architecture-diagram-selector-${projectMenuIdBase}`,
    [projectMenuIdBase],
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
    const items: MediaCyclerItem[] = [
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
      diagramEntries.map((entry) => ({
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
      })),
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

  const {
    sections,
    activeSection,
    activeSectionKey,
    hasMultipleSections,
    setActiveSectionKey,
    handlePreviousSection,
    handleNextSection,
  } = usePresentationSections({
    useWhyThisInterestsSlide,
    hasDemoSection: demoItems.length > 0,
    hasDiagramsSection: diagramItems.length > 0,
  });
  const pendingInteractionMarkRef = useRef<{
    markName: string;
    interactionType: "section" | "diagram";
    from: string | undefined;
    to: string | undefined;
  } | null>(null);

  const sectionIconByKey = useMemo<Record<ProjectPresentationSectionKey, ReactNode>>(
    () => ({
      overview: sectionEmojiIcon("🔎"),
      why: sectionEmojiIcon("❓"),
      demo: sectionEmojiIcon("🎬"),
      technologies: sectionEmojiIcon("🤖"),
      specifications: sectionEmojiIcon("📐"),
      diagrams: sectionEmojiIcon("🏗"),
    }),
    [],
  );
  const sectionsWithIcons = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        icon: sectionIconByKey[section.key],
      })),
    [sectionIconByKey, sections],
  );
  const activeSectionWithIcon = useMemo(
    () => sectionsWithIcons.find((section) => section.key === activeSection?.key) ?? null,
    [activeSection?.key, sectionsWithIcons],
  );

  const { deepLinkInitialized, copyDeepLinkSucceeded, handleCopyDeepLink } = useDeepLinkState({
    projectSlug,
    sections,
    diagramEntries,
    activeSectionKey,
    setActiveSectionKey,
    activeDiagramKey,
    setActiveDiagramKey,
  });

  useSectionAudio({
    projectSlug,
    activeSectionKey,
    deepLinkInitialized,
    sectionPagerSfxPaths,
  });

  const startInteractionMeasure = useCallback(
    ({
      interactionType,
      from,
      to,
    }: {
      interactionType: "section" | "diagram";
      from: string | undefined;
      to: string | undefined;
    }) => {
      const markName = `project-presentation:${projectSlug}:${interactionType}:${Math.round(performance.now())}`;
      pendingInteractionMarkRef.current = { markName, interactionType, from, to };
      markStart(markName);
    },
    [projectSlug],
  );

  const handleSelectSection = useCallback(
    (key: ProjectPresentationSectionKey) => {
      if (key === activeSectionKey) {
        return;
      }
      startInteractionMeasure({
        interactionType: "section",
        from: activeSectionKey,
        to: key,
      });
      setActiveSectionKey(key);
    },
    [activeSectionKey, setActiveSectionKey, startInteractionMeasure],
  );

  const handlePreviousSectionMeasured = useCallback(() => {
    if (!sections.length) {
      return;
    }
    const currentIndex = Math.max(
      0,
      sections.findIndex((section) => section.key === activeSectionKey),
    );
    const previousIndex = currentIndex <= 0 ? sections.length - 1 : currentIndex - 1;
    const previousSectionKey = sections[previousIndex]?.key;
    startInteractionMeasure({
      interactionType: "section",
      from: activeSectionKey,
      to: previousSectionKey,
    });
    handlePreviousSection();
  }, [activeSectionKey, handlePreviousSection, sections, startInteractionMeasure]);

  const handleNextSectionMeasured = useCallback(() => {
    if (!sections.length) {
      return;
    }
    const currentIndex = Math.max(
      0,
      sections.findIndex((section) => section.key === activeSectionKey),
    );
    const nextIndex = currentIndex >= sections.length - 1 ? 0 : currentIndex + 1;
    const nextSectionKey = sections[nextIndex]?.key;
    startInteractionMeasure({
      interactionType: "section",
      from: activeSectionKey,
      to: nextSectionKey,
    });
    handleNextSection();
  }, [activeSectionKey, handleNextSection, sections, startInteractionMeasure]);

  const handleSelectArchitectureDiagramMeasured = useCallback(
    (key: string) => {
      if (key === activeDiagramKey) {
        return;
      }
      startInteractionMeasure({
        interactionType: "diagram",
        from: activeDiagramKey,
        to: key,
      });
      handleSelectArchitectureDiagram(key);
    },
    [activeDiagramKey, handleSelectArchitectureDiagram, startInteractionMeasure],
  );

  const handlePreviousArchitectureDiagramMeasured = useCallback(() => {
    if (!diagramEntries.length) {
      return;
    }
    const previousIndex = (activeDiagramIndex - 1 + diagramEntries.length) % diagramEntries.length;
    const nextDiagramKey = diagramEntries[previousIndex]?.key;
    startInteractionMeasure({
      interactionType: "diagram",
      from: activeDiagramKey,
      to: nextDiagramKey,
    });
    handlePreviousArchitectureDiagram();
  }, [
    activeDiagramIndex,
    activeDiagramKey,
    diagramEntries,
    handlePreviousArchitectureDiagram,
    startInteractionMeasure,
  ]);

  const handleNextArchitectureDiagramMeasured = useCallback(() => {
    if (!diagramEntries.length) {
      return;
    }
    const nextIndex = (activeDiagramIndex + 1) % diagramEntries.length;
    const nextDiagramKey = diagramEntries[nextIndex]?.key;
    startInteractionMeasure({
      interactionType: "diagram",
      from: activeDiagramKey,
      to: nextDiagramKey,
    });
    handleNextArchitectureDiagram();
  }, [
    activeDiagramIndex,
    activeDiagramKey,
    diagramEntries,
    handleNextArchitectureDiagram,
    startInteractionMeasure,
  ]);

  useEffect(() => {
    const renderMarkName = `project-presentation:render:${projectSlug}:${activeSectionKey}:${activeSectionKey === "diagrams" ? (activeDiagramKey ?? "none") : "section"}`;
    markStart(renderMarkName);
    return measureAfterNextPaint(renderMarkName, (durationMs) => {
      presentationPerfLogger.debug("Project presentation render", {
        project: projectSlug,
        section: activeSectionKey,
        diagram: activeSectionKey === "diagrams" ? (activeDiagramKey ?? null) : null,
        durationMs: durationMs === null ? null : Math.round(durationMs),
      });
    });
  }, [activeDiagramKey, activeSectionKey, projectSlug]);

  useEffect(() => {
    const pendingMark = pendingInteractionMarkRef.current;
    if (!pendingMark) {
      return;
    }

    pendingInteractionMarkRef.current = null;
    return measureAfterNextPaint(pendingMark.markName, (durationMs) => {
      presentationPerfLogger.info("Project presentation interaction latency", {
        project: projectSlug,
        interactionType: pendingMark.interactionType,
        from: pendingMark.from ?? null,
        to: pendingMark.to ?? null,
        activeSection: activeSectionKey,
        activeDiagram: activeDiagramKey ?? null,
        durationMs: durationMs === null ? null : Math.round(durationMs),
      });
    });
  }, [activeDiagramKey, activeSectionKey, projectSlug]);

  const pagerItems = useMemo<SubsectionPagerItem[]>(
    () =>
      sectionsWithIcons.map((section, index) => ({
        key: section.key,
        title: section.title,
        selectedTitle: section.title,
        selectedIcon: section.icon,
        optionTitle: buildSectionLabel(index, section.title),
        optionSubtitle: section.subtitle,
        optionIcon: section.icon,
      })),
    [sectionsWithIcons],
  );

  const renderActiveSection = () => {
    switch (activeSectionKey) {
      case "overview":
        return (
          <OverviewSection
            useSharedOverviewSlide={useSharedOverviewSlide}
            overviewItems={overviewItems}
            activeOverviewMediaKey={activeOverviewMediaKey}
            onSelectOverviewMediaKey={setActiveOverviewMediaKey}
            navigationControlSx={projectPresentationNavigationControlSx}
            expandControlSx={projectPresentationExpandControlSx}
          />
        );
      case "why":
        return <WhyThisInterestsSection content={project.interestsMeWhy ?? ""} />;
      case "demo":
        return (
          <DemoSection
            useSharedDemoSlide={useSharedDemoSlide}
            isPodcastsLayout={isPodcastsLayout}
            terminalDemo={projectTerminalDemo}
            demoItems={demoItems}
            activeDemoMediaKey={activeDemoMediaKey}
            onSelectDemoMediaKey={setActiveDemoMediaKey}
            navigationControlSx={projectPresentationNavigationControlSx}
            expandControlSx={projectPresentationExpandControlSx}
            sharedDemoVideoMaxHeight={sharedDemoVideoMaxHeight}
            captionSlotSx={demoCaptionSlotSx}
            captionTextSx={demoCaptionTextSx}
          />
        );
      case "technologies":
        return (
          <TechnologiesSection
            menuIdPrefix={projectMenuIdBase}
            categories={technologyCompetencyCategories}
          />
        );
      case "specifications":
        return (
          <SpecificationsSection
            specifications={project.specifications}
            useSharedDemoSlide={useSharedDemoSlide}
          />
        );
      case "diagrams":
        return (
          <ArchitectureSection
            useSharedArchitectureDiagramsSlide={useSharedArchitectureDiagramsSlide}
            activeDiagramKey={activeDiagramKey}
            diagramPagerItems={diagramPagerItems}
            diagramItems={diagramItems}
            hasMultipleArchitectureDiagrams={hasMultipleArchitectureDiagrams}
            onSelectArchitectureDiagram={handleSelectArchitectureDiagramMeasured}
            onPreviousArchitectureDiagram={handlePreviousArchitectureDiagramMeasured}
            onNextArchitectureDiagram={handleNextArchitectureDiagramMeasured}
            projectArchitectureMenuId={projectArchitectureMenuId}
            navigationControlSx={projectPresentationNavigationControlSx}
            expandControlSx={projectPresentationExpandControlSx}
            onCopyDeepLink={handleCopyDeepLink}
            copyDeepLinkSucceeded={copyDeepLinkSucceeded}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PortfolioPanel
      sx={{
        px: 0,
        py: { xs: 0, sm: 0, md: 1.25 },
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
          bgcolor: "transparent",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "none",
          boxShadow: "none",
        }}
        topRail={
          hasMultipleSections ? (
            <Box sx={{ width: "100%" }}>
              <SubsectionPager
                menuId="project-showcase-section-selector"
                items={pagerItems}
                currentKey={activeSectionKey}
                selectedValueAsTitle
                showSelectedVisualOnSmallScreens
                selectedVisualSize={56}
                selectedIconFontSize="1.5rem"
                selectedEmojiFontSize="2.66rem"
                optionVisualSize={42.5}
                optionEmojiFontSize="1.465rem"
                selectedEmojiAnimation="random"
                iconFrameStyle="none"
                previousAriaLabel="Previous project section"
                nextAriaLabel="Next project section"
                selectorAriaLabel="Open project section selector"
                previousButtonSx={{
                  ml: { xs: 1, md: 1.25 },
                }}
                onSelect={(key) => handleSelectSection(key as ProjectPresentationSectionKey)}
                onPrevious={handlePreviousSectionMeasured}
                onNext={handleNextSectionMeasured}
              />
            </Box>
          ) : (
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 1.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {activeSectionWithIcon?.icon}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {activeSection?.title ?? "Overview"}
                </Typography>
              </Box>
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
