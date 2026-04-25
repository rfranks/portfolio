import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { SubsectionPagerItem } from "@/components/portfolio/layout/SubsectionPager";
import type { CompetencyCategory } from "@/components/portfolio/panels/CoreCompetencies";
import type { MediaCyclerItem } from "@/components/shared";
import type {
  ProjectData,
  ProjectPresentationSectionKey,
  ProjectPresentationPrefetchPlan,
  ProjectSectionPagerSfxValue,
} from "@/types/components/portfolio";
import { createLogger } from "@/utils/observability/logger";
import { markStart, measureAfterNextPaint } from "@/utils/observability/perf";
import {
  resolveAliasedParamValue,
  resolveEntryKeyFromParam,
  resolveIndexedKeyFromParam,
  resolveSectionKeyFromParam,
} from "@/utils/content/presentationDeepLink";
import {
  resolvePresentationBehavior,
  resolvePresentationPrefetchPlan,
  resolvePresentationSectionCapabilities,
  resolvePresentationSectionOrder,
} from "../presentationConfig";
import {
  type DiagramDeepLinkMode,
  type DiagramDeepLinkZoomPreset,
  type ProjectDiagramEntry,
  resolveDiagramEntries,
  resolveDiagramItems,
  resolveDiagramPagerItems,
} from "../resolvers/diagramSectionResolver";
import { resolveDemoItems, resolveTerminalDemo } from "../resolvers/demoSectionResolver";
import {
  resolveOverviewItems,
  resolveOverviewMarkdownContent,
} from "../resolvers/overviewSectionResolver";
import { resolveTechnologyCompetencyCategories } from "../resolvers/technologiesSectionResolver";
import { usePresentationSections } from "./usePresentationSections";
import { useSectionAudio } from "./useSectionAudio";
import type { ResolvedProjectTerminalDemo } from "../sections/DemoSection";

export type ProjectPresentationController = {
  useSharedOverviewSlide: boolean;
  useSharedDemoSlide: boolean;
  useSharedArchitectureDiagramsSlide: boolean;
  isPodcastsLayout: boolean;
  useTightDemoCaptionLayout: boolean;
  deepLinkInitialized: boolean;
  activeSectionKey: ProjectPresentationSectionKey;
  sectionNavigationDirection: "forward" | "backward" | "neutral";
  hasMultipleSections: boolean;
  activeSectionWithIcon: {
    key: ProjectPresentationSectionKey;
    title: string;
    subtitle: string;
    icon: ReactNode;
  } | null;
  pagerItems: SubsectionPagerItem[];
  allowPreviousSectionAction: boolean;
  allowNextSectionAction: boolean;
  allowSectionSelectorAction: boolean;
  handleSelectSection: (key: ProjectPresentationSectionKey) => void;
  handlePreviousSectionMeasured: () => void;
  handleNextSectionMeasured: () => void;
  activeDiagramKey?: string;
  diagramPagerItems: SubsectionPagerItem[];
  diagramItems: MediaCyclerItem[];
  hasMultipleArchitectureDiagrams: boolean;
  handleSelectArchitectureDiagramMeasured: (key: string) => void;
  handlePreviousArchitectureDiagramMeasured: () => void;
  handleNextArchitectureDiagramMeasured: () => void;
  projectArchitectureMenuId: string;
  overviewItems: MediaCyclerItem[];
  activeOverviewMediaKey?: string;
  setActiveOverviewMediaKey: (key: string) => void;
  projectTerminalDemo: ResolvedProjectTerminalDemo | null;
  demoItems: MediaCyclerItem[];
  activeDemoMediaKey?: string;
  setActiveDemoMediaKey: (key: string) => void;
  technologyCompetencyCategories: CompetencyCategory[];
  demoCaptionSlotSx: SxProps<Theme>;
  demoCaptionTextSx: SxProps<Theme>;
  sharedDemoVideoMaxHeight: { xs: number; sm: number; md: number; lg: number };
  projectPresentationNavigationControlSx: SxProps<Theme>;
  projectPresentationExpandControlSx: SxProps<Theme>;
  presentationPrefetchPlan?: ProjectPresentationPrefetchPlan;
  copyDeepLinkSucceeded: boolean;
  handleCopyDeepLink: () => void;
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
const TIGHT_DEMO_CAPTION_HREFS = new Set(["/aisummary", "/patientlist", "/assignmentlist"]);
const TIGHT_DEMO_CAPTION_SHOWCASE_HEADINGS = new Set(["ai clinical copilot"]);

const buildSectionLabel = (index: number, title: string) => `${index + 1}. ${title}`;

const DIAGRAM_DEEP_LINK_MODE_ALIASES: Record<DiagramDeepLinkMode, readonly string[]> = {
  code: ["source", "text", "src"],
  render: ["diagram", "visual", "view"],
};

const DIAGRAM_DEEP_LINK_ZOOM_PRESET_ALIASES: Record<DiagramDeepLinkZoomPreset, readonly string[]> =
  {
    fit: ["default"],
    wide: ["overview", "out", "zoomout"],
    focus: ["focused", "normal", "zoomin"],
    close: ["closeup", "tight", "zoomed"],
  };

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

export function useProjectPresentationController(
  project: ProjectData,
): ProjectPresentationController {
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
  const useTightDemoCaptionLayout = useMemo(() => {
    const normalizedHref = project.href?.trim().toLowerCase() ?? "";
    const normalizedShowcaseHeading = project.showcaseHeading?.trim().toLowerCase() ?? "";
    return (
      TIGHT_DEMO_CAPTION_HREFS.has(normalizedHref) ||
      TIGHT_DEMO_CAPTION_SHOWCASE_HEADINGS.has(normalizedShowcaseHeading)
    );
  }, [project.href, project.showcaseHeading]);
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

  const sectionCapabilitiesByKey = useMemo(
    () => resolvePresentationSectionCapabilities(project),
    [project],
  );

  const sectionPagerSfxPaths = useMemo(
    () => ({
      overview: resolveSectionPagerSfxPath(
        sectionCapabilitiesByKey.overview.audioProfile,
        DEFAULT_SECTION_PAGER_SFX.overview,
      ),
      why: resolveSectionPagerSfxPath(
        sectionCapabilitiesByKey.why.audioProfile,
        DEFAULT_SECTION_PAGER_SFX.why,
      ),
      demo: resolveSectionPagerSfxPath(
        sectionCapabilitiesByKey.demo.audioProfile,
        DEFAULT_SECTION_PAGER_SFX.demo,
      ),
      technologies: resolveSectionPagerSfxPath(
        sectionCapabilitiesByKey.technologies.audioProfile,
        DEFAULT_SECTION_PAGER_SFX.technologies,
      ),
      specifications: resolveSectionPagerSfxPath(
        sectionCapabilitiesByKey.specifications.audioProfile,
        DEFAULT_SECTION_PAGER_SFX.specifications,
      ),
      diagrams: resolveSectionPagerSfxPath(
        sectionCapabilitiesByKey.diagrams.audioProfile,
        DEFAULT_SECTION_PAGER_SFX.diagrams,
      ),
    }),
    [sectionCapabilitiesByKey],
  );
  const presentationPrefetchPlan = useMemo(
    () => resolvePresentationPrefetchPlan(project),
    [project],
  );

  const diagramEntries = useMemo<ProjectDiagramEntry[]>(
    () => resolveDiagramEntries(project),
    [project],
  );

  const [activeDiagramKey, setActiveDiagramKey] = useState<string | undefined>(
    diagramEntries[0]?.key,
  );

  const activeDiagramIndex = useMemo(() => {
    const index = diagramEntries.findIndex((entry) => entry.key === activeDiagramKey);
    return index >= 0 ? index : 0;
  }, [activeDiagramKey, diagramEntries]);

  const hasMultipleArchitectureDiagrams = diagramEntries.length > 1;

  const diagramPagerItems = useMemo<SubsectionPagerItem[]>(
    () => resolveDiagramPagerItems(diagramEntries),
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
      mt: isPodcastsLayout || useTightDemoCaptionLayout ? 0 : 0.75,
      flex: useTightDemoCaptionLayout ? "1 1 0%" : undefined,
      flexBasis: useTightDemoCaptionLayout ? 0 : undefined,
      flexShrink: useTightDemoCaptionLayout ? 1 : 0,
      width: "100%",
      minHeight: isPodcastsLayout || useTightDemoCaptionLayout ? 0 : { xs: 40, md: 52 },
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      alignContent: "flex-start",
      pt: 0,
      pb: 0,
    }),
    [isPodcastsLayout, useTightDemoCaptionLayout],
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

  const overviewMarkdownContent = useMemo(() => resolveOverviewMarkdownContent(project), [project]);
  const overviewItems = useMemo<MediaCyclerItem[]>(
    () => resolveOverviewItems(overviewMarkdownContent),
    [overviewMarkdownContent],
  );
  const demoItems = useMemo<MediaCyclerItem[]>(() => resolveDemoItems(project), [project]);

  const [activeOverviewMediaKey, setActiveOverviewMediaKey] = useState<string | undefined>(
    overviewItems[0]?.key,
  );
  const [activeDemoMediaKey, setActiveDemoMediaKey] = useState<string | undefined>(
    demoItems[0]?.key,
  );
  const [diagramDeepLinkMode, setDiagramDeepLinkMode] = useState<DiagramDeepLinkMode>("render");
  const [diagramDeepLinkZoomPreset, setDiagramDeepLinkZoomPreset] =
    useState<DiagramDeepLinkZoomPreset>("fit");
  const [deepLinkInitialized, setDeepLinkInitialized] = useState(false);
  const [copyDeepLinkSucceeded, setCopyDeepLinkSucceeded] = useState(false);
  const copyDeepLinkResetTimeoutRef = useRef<number | null>(null);

  const technologyCompetencyCategories = useMemo<CompetencyCategory[]>(
    () => resolveTechnologyCompetencyCategories(project.technologiesUsed),
    [project.technologiesUsed],
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
      resolveDiagramItems({
        diagramEntries,
        diagramDeepLinkMode,
        diagramDeepLinkZoomPreset,
        onSelectDiagram: setActiveDiagramKey,
      }),
    [diagramDeepLinkMode, diagramDeepLinkZoomPreset, diagramEntries],
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
    sectionCapabilityEnabledByKey: {
      overview: sectionCapabilitiesByKey.overview.enabled,
      why: sectionCapabilitiesByKey.why.enabled,
      demo: sectionCapabilitiesByKey.demo.enabled,
      technologies: sectionCapabilitiesByKey.technologies.enabled,
      specifications: sectionCapabilitiesByKey.specifications.enabled,
      diagrams: sectionCapabilitiesByKey.diagrams.enabled,
    },
    sectionOrder: resolvePresentationSectionOrder(project, [
      "overview",
      "why",
      "demo",
      "technologies",
      "specifications",
      "diagrams",
    ]) as ProjectPresentationSectionKey[],
  });
  const [sectionNavigationDirection, setSectionNavigationDirection] = useState<
    "forward" | "backward" | "neutral"
  >("neutral");

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
  const activeSectionCapability = sectionCapabilitiesByKey[activeSectionKey];
  const allowPreviousSectionAction = activeSectionCapability.pagerActions.allowPrevious;
  const allowNextSectionAction = activeSectionCapability.pagerActions.allowNext;
  const allowSectionSelectorAction = activeSectionCapability.pagerActions.allowSelector;

  const activeOverviewMediaIndex = useMemo(
    () => overviewItems.findIndex((item) => item.key === activeOverviewMediaKey),
    [activeOverviewMediaKey, overviewItems],
  );
  const activeDemoMediaIndex = useMemo(
    () => demoItems.findIndex((item) => item.key === activeDemoMediaKey),
    [activeDemoMediaKey, demoItems],
  );

  const canRestoreDeepLinkForSection = useCallback(
    (sectionKey: ProjectPresentationSectionKey, hasParam: boolean) => {
      const mode = sectionCapabilitiesByKey[sectionKey]?.deepLinkRestore ?? "always";
      if (mode === "never") {
        return false;
      }
      if (mode === "if-present") {
        return hasParam;
      }
      return true;
    },
    [sectionCapabilitiesByKey],
  );

  useEffect(() => {
    if (deepLinkInitialized || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const deepLinkProject = params.get("project")?.trim().toLowerCase();
    if (deepLinkProject && deepLinkProject !== projectSlug) {
      setDeepLinkInitialized(true);
      return;
    }

    const sectionParam = params.get("section")?.trim() || params.get("slide")?.trim();
    const hasSectionParam = Boolean(sectionParam);
    const resolvedSectionKey = resolveSectionKeyFromParam(sectionParam, sections);
    const shouldRestoreResolvedSection = resolvedSectionKey
      ? canRestoreDeepLinkForSection(resolvedSectionKey, hasSectionParam)
      : false;
    const targetSectionKey =
      resolvedSectionKey && shouldRestoreResolvedSection ? resolvedSectionKey : activeSectionKey;
    if (resolvedSectionKey && shouldRestoreResolvedSection) {
      setActiveSectionKey(resolvedSectionKey);
    }

    const subParam = params.get("sub")?.trim();
    const mediaParam = params.get("media")?.trim();
    const hasSubParam = Boolean(subParam || mediaParam);

    if (
      targetSectionKey === "diagrams" &&
      diagramEntries.length > 0 &&
      canRestoreDeepLinkForSection("diagrams", hasSubParam || Boolean(params.get("diagram")))
    ) {
      const diagramParam = subParam || params.get("diagram")?.trim() || mediaParam;
      const resolvedDiagramKey = resolveEntryKeyFromParam(diagramParam, diagramEntries);
      if (resolvedDiagramKey) {
        setActiveDiagramKey(resolvedDiagramKey);
      }
    }

    if (
      targetSectionKey === "overview" &&
      overviewItems.length > 0 &&
      canRestoreDeepLinkForSection("overview", hasSubParam)
    ) {
      const overviewKeys = overviewItems.map((item) => item.key);
      const resolvedOverviewKey =
        resolveIndexedKeyFromParam(subParam, overviewKeys) ||
        resolveIndexedKeyFromParam(mediaParam, overviewKeys);
      if (resolvedOverviewKey) {
        setActiveOverviewMediaKey(resolvedOverviewKey);
      }
    }

    if (
      targetSectionKey === "demo" &&
      demoItems.length > 0 &&
      canRestoreDeepLinkForSection("demo", hasSubParam)
    ) {
      const demoKeys = demoItems.map((item) => item.key);
      const resolvedDemoKey =
        resolveIndexedKeyFromParam(subParam, demoKeys) ||
        resolveIndexedKeyFromParam(mediaParam, demoKeys);
      if (resolvedDemoKey) {
        setActiveDemoMediaKey(resolvedDemoKey);
      }
    }

    const resolvedMode = resolveAliasedParamValue(
      params.get("diagramMode")?.trim() || params.get("mode")?.trim(),
      DIAGRAM_DEEP_LINK_MODE_ALIASES,
    );
    if (
      resolvedMode &&
      canRestoreDeepLinkForSection(
        "diagrams",
        Boolean(params.get("diagramMode")?.trim() || params.get("mode")?.trim()),
      )
    ) {
      setDiagramDeepLinkMode(resolvedMode);
    }

    const resolvedZoomPreset = resolveAliasedParamValue(
      params.get("diagramZoom")?.trim() ||
        params.get("zoomPreset")?.trim() ||
        params.get("zoom")?.trim(),
      DIAGRAM_DEEP_LINK_ZOOM_PRESET_ALIASES,
    );
    if (
      resolvedZoomPreset &&
      canRestoreDeepLinkForSection(
        "diagrams",
        Boolean(
          params.get("diagramZoom")?.trim() ||
          params.get("zoomPreset")?.trim() ||
          params.get("zoom")?.trim(),
        ),
      )
    ) {
      setDiagramDeepLinkZoomPreset(resolvedZoomPreset);
    }

    setDeepLinkInitialized(true);
  }, [
    activeSectionKey,
    deepLinkInitialized,
    demoItems,
    diagramEntries,
    overviewItems,
    projectSlug,
    sections,
    canRestoreDeepLinkForSection,
    setActiveDemoMediaKey,
    setActiveDiagramKey,
    setActiveOverviewMediaKey,
    setActiveSectionKey,
  ]);

  const buildPresentationDeepLinkUrl = useCallback(
    (baseHref: string) => {
      const nextUrl = new URL(baseHref);
      nextUrl.searchParams.set("project", projectSlug);
      nextUrl.searchParams.set("section", activeSectionKey);
      nextUrl.searchParams.set("slide", activeSectionKey);
      nextUrl.searchParams.set("diagramMode", diagramDeepLinkMode);
      nextUrl.searchParams.set("diagramZoom", diagramDeepLinkZoomPreset);

      if (activeSectionKey === "diagrams" && diagramEntries.length > 0) {
        const index = diagramEntries.findIndex((entry) => entry.key === activeDiagramKey);
        if (index >= 0) {
          const key = diagramEntries[index]?.key;
          nextUrl.searchParams.set("sub", key);
          nextUrl.searchParams.set("media", String(index + 1));
          nextUrl.searchParams.set("diagram", String(index + 1));
        } else {
          nextUrl.searchParams.delete("sub");
          nextUrl.searchParams.delete("media");
          nextUrl.searchParams.delete("diagram");
        }
      } else if (activeSectionKey === "overview" && overviewItems.length > 0) {
        if (activeOverviewMediaIndex >= 0) {
          const key = overviewItems[activeOverviewMediaIndex]?.key;
          nextUrl.searchParams.set("sub", key);
          nextUrl.searchParams.set("media", String(activeOverviewMediaIndex + 1));
        } else {
          nextUrl.searchParams.delete("sub");
          nextUrl.searchParams.delete("media");
        }
        nextUrl.searchParams.delete("diagram");
      } else if (activeSectionKey === "demo" && demoItems.length > 0) {
        if (activeDemoMediaIndex >= 0) {
          const key = demoItems[activeDemoMediaIndex]?.key;
          nextUrl.searchParams.set("sub", key);
          nextUrl.searchParams.set("media", String(activeDemoMediaIndex + 1));
        } else {
          nextUrl.searchParams.delete("sub");
          nextUrl.searchParams.delete("media");
        }
        nextUrl.searchParams.delete("diagram");
      } else {
        nextUrl.searchParams.delete("sub");
        nextUrl.searchParams.delete("media");
        nextUrl.searchParams.delete("diagram");
      }

      return nextUrl;
    },
    [
      activeDemoMediaIndex,
      activeDiagramKey,
      activeOverviewMediaIndex,
      activeSectionKey,
      demoItems,
      diagramDeepLinkMode,
      diagramDeepLinkZoomPreset,
      diagramEntries,
      overviewItems,
      projectSlug,
    ],
  );

  useEffect(() => {
    if (!deepLinkInitialized || typeof window === "undefined") {
      return;
    }

    const nextUrl = buildPresentationDeepLinkUrl(window.location.href);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    if (currentPath !== nextPath) {
      window.history.replaceState(window.history.state, "", nextPath);
    }
  }, [buildPresentationDeepLinkUrl, deepLinkInitialized]);

  useEffect(() => {
    return () => {
      if (copyDeepLinkResetTimeoutRef.current !== null) {
        window.clearTimeout(copyDeepLinkResetTimeoutRef.current);
        copyDeepLinkResetTimeoutRef.current = null;
      }
    };
  }, []);

  const handleCopyDeepLink = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const url = buildPresentationDeepLinkUrl(window.location.href);
    const link = url.toString();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopyDeepLinkSucceeded(true);
      if (copyDeepLinkResetTimeoutRef.current !== null) {
        window.clearTimeout(copyDeepLinkResetTimeoutRef.current);
      }
      copyDeepLinkResetTimeoutRef.current = window.setTimeout(() => {
        setCopyDeepLinkSucceeded(false);
        copyDeepLinkResetTimeoutRef.current = null;
      }, 1400);
    } catch {
      // no-op: ignore clipboard failures.
    }
  }, [buildPresentationDeepLinkUrl]);

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
      if (!allowSectionSelectorAction) {
        return;
      }
      if (!sectionCapabilitiesByKey[key].enabled) {
        return;
      }
      if (key === activeSectionKey) {
        return;
      }
      const currentIndex = sections.findIndex((section) => section.key === activeSectionKey);
      const nextIndex = sections.findIndex((section) => section.key === key);
      if (currentIndex >= 0 && nextIndex >= 0 && sections.length > 1) {
        const forwardDistance = (nextIndex - currentIndex + sections.length) % sections.length;
        const backwardDistance = (currentIndex - nextIndex + sections.length) % sections.length;
        setSectionNavigationDirection(forwardDistance <= backwardDistance ? "forward" : "backward");
      } else {
        setSectionNavigationDirection("neutral");
      }
      startInteractionMeasure({
        interactionType: "section",
        from: activeSectionKey,
        to: key,
      });
      setActiveSectionKey(key);
    },
    [
      activeSectionKey,
      allowSectionSelectorAction,
      sectionCapabilitiesByKey,
      sections,
      setActiveSectionKey,
      startInteractionMeasure,
    ],
  );

  const handlePreviousSectionMeasured = useCallback(() => {
    if (!allowPreviousSectionAction) {
      return;
    }
    if (!sections.length) {
      return;
    }
    const currentIndex = Math.max(
      0,
      sections.findIndex((section) => section.key === activeSectionKey),
    );
    const previousIndex = currentIndex <= 0 ? sections.length - 1 : currentIndex - 1;
    const previousSectionKey = sections[previousIndex]?.key;
    setSectionNavigationDirection("backward");
    startInteractionMeasure({
      interactionType: "section",
      from: activeSectionKey,
      to: previousSectionKey,
    });
    handlePreviousSection();
  }, [
    activeSectionKey,
    allowPreviousSectionAction,
    handlePreviousSection,
    sections,
    startInteractionMeasure,
  ]);

  const handleNextSectionMeasured = useCallback(() => {
    if (!allowNextSectionAction) {
      return;
    }
    if (!sections.length) {
      return;
    }
    const currentIndex = Math.max(
      0,
      sections.findIndex((section) => section.key === activeSectionKey),
    );
    const nextIndex = currentIndex >= sections.length - 1 ? 0 : currentIndex + 1;
    const nextSectionKey = sections[nextIndex]?.key;
    setSectionNavigationDirection("forward");
    startInteractionMeasure({
      interactionType: "section",
      from: activeSectionKey,
      to: nextSectionKey,
    });
    handleNextSection();
  }, [
    activeSectionKey,
    allowNextSectionAction,
    handleNextSection,
    sections,
    startInteractionMeasure,
  ]);

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

  return {
    useSharedOverviewSlide,
    useSharedDemoSlide,
    useSharedArchitectureDiagramsSlide,
    isPodcastsLayout,
    useTightDemoCaptionLayout,
    deepLinkInitialized,
    activeSectionKey,
    sectionNavigationDirection,
    hasMultipleSections,
    activeSectionWithIcon,
    pagerItems,
    allowPreviousSectionAction,
    allowNextSectionAction,
    allowSectionSelectorAction,
    handleSelectSection,
    handlePreviousSectionMeasured,
    handleNextSectionMeasured,
    activeDiagramKey,
    diagramPagerItems,
    diagramItems,
    hasMultipleArchitectureDiagrams,
    handleSelectArchitectureDiagramMeasured,
    handlePreviousArchitectureDiagramMeasured,
    handleNextArchitectureDiagramMeasured,
    projectArchitectureMenuId,
    overviewItems,
    activeOverviewMediaKey,
    setActiveOverviewMediaKey,
    projectTerminalDemo,
    demoItems,
    activeDemoMediaKey,
    setActiveDemoMediaKey,
    technologyCompetencyCategories,
    demoCaptionSlotSx,
    demoCaptionTextSx,
    sharedDemoVideoMaxHeight,
    projectPresentationNavigationControlSx,
    projectPresentationExpandControlSx,
    presentationPrefetchPlan,
    copyDeepLinkSucceeded,
    handleCopyDeepLink,
  };
}
