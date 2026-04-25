import type {
  ProjectData,
  ProjectPresentationConfig,
  ProjectPresentationDemoLayout,
  ProjectPresentationSectionKey,
  ProjectSectionCapabilityConfig,
  ProjectSectionDeepLinkRestoreMode,
  ProjectSectionPagerSfxValue,
} from "@/types/components/portfolio";

export type PresentationBehaviorConfig = {
  useSharedOverviewSlide: boolean;
  useSharedDemoSlide: boolean;
  useSharedArchitectureDiagramsSlide: boolean;
  enableWhyThisInterestsSection: boolean;
  demoLayout: ProjectPresentationDemoLayout;
};

export type PresentationSectionCapabilityResolved = {
  enabled: boolean;
  pagerActions: {
    allowPrevious: boolean;
    allowNext: boolean;
    allowSelector: boolean;
  };
  audioProfile: ProjectSectionPagerSfxValue;
  deepLinkRestore: ProjectSectionDeepLinkRestoreMode;
};

const DEFAULT_PRESENTATION_BEHAVIOR: PresentationBehaviorConfig = {
  useSharedOverviewSlide: false,
  useSharedDemoSlide: false,
  useSharedArchitectureDiagramsSlide: false,
  enableWhyThisInterestsSection: false,
  demoLayout: "default",
};

const PRESENTATION_SECTION_KEYS: readonly ProjectPresentationSectionKey[] = [
  "overview",
  "why",
  "demo",
  "technologies",
  "specifications",
  "diagrams",
];

const DEFAULT_SECTION_CAPABILITY: PresentationSectionCapabilityResolved = {
  enabled: true,
  pagerActions: {
    allowPrevious: true,
    allowNext: true,
    allowSelector: true,
  },
  audioProfile: "random",
  deepLinkRestore: "always",
};

function resolveSectionCapability(args: {
  capability?: ProjectSectionCapabilityConfig;
  fallbackAudioProfile?: ProjectSectionPagerSfxValue;
}): PresentationSectionCapabilityResolved {
  const { capability, fallbackAudioProfile } = args;
  const resolvedAudioProfile = capability?.audioProfile?.trim();
  const resolvedFallbackAudio = fallbackAudioProfile?.trim();

  return {
    enabled: capability?.enabled ?? DEFAULT_SECTION_CAPABILITY.enabled,
    pagerActions: {
      allowPrevious:
        capability?.pagerActions?.allowPrevious ??
        DEFAULT_SECTION_CAPABILITY.pagerActions.allowPrevious,
      allowNext:
        capability?.pagerActions?.allowNext ?? DEFAULT_SECTION_CAPABILITY.pagerActions.allowNext,
      allowSelector:
        capability?.pagerActions?.allowSelector ??
        DEFAULT_SECTION_CAPABILITY.pagerActions.allowSelector,
    },
    audioProfile:
      (resolvedAudioProfile as ProjectSectionPagerSfxValue | undefined) ||
      (resolvedFallbackAudio as ProjectSectionPagerSfxValue | undefined) ||
      DEFAULT_SECTION_CAPABILITY.audioProfile,
    deepLinkRestore: capability?.deepLinkRestore ?? DEFAULT_SECTION_CAPABILITY.deepLinkRestore,
  };
}

export function resolvePresentationBehavior(project: ProjectData): PresentationBehaviorConfig {
  const configured = project.presentation;
  if (!configured) {
    return DEFAULT_PRESENTATION_BEHAVIOR;
  }

  return {
    useSharedOverviewSlide: configured.useSharedOverviewSlide ?? false,
    useSharedDemoSlide: configured.useSharedDemoSlide ?? false,
    useSharedArchitectureDiagramsSlide: configured.useSharedArchitectureDiagramsSlide ?? false,
    enableWhyThisInterestsSection: configured.enableWhyThisInterestsSection ?? false,
    demoLayout: configured.demoLayout ?? "default",
  };
}

export function resolvePresentationSectionOrder(
  project: ProjectData,
  fallbackOrder: readonly string[],
): readonly string[] {
  const configuredOrder = project.presentation?.sectionOrder;
  if (!configuredOrder || configuredOrder.length === 0) {
    return fallbackOrder;
  }

  const deduped = Array.from(new Set(configuredOrder.map((value) => value.trim()).filter(Boolean)));
  if (deduped.length === 0) {
    return fallbackOrder;
  }

  return deduped;
}

export function resolvePresentationSectionCapabilities(
  project: ProjectData,
): Record<ProjectPresentationSectionKey, PresentationSectionCapabilityResolved> {
  const sectionCapabilities = project.presentation?.sectionCapabilities;
  const fallbackSectionPagerSfx = project.sectionPagerSfx;

  return Object.fromEntries(
    PRESENTATION_SECTION_KEYS.map((sectionKey) => [
      sectionKey,
      resolveSectionCapability({
        capability: sectionCapabilities?.[sectionKey],
        fallbackAudioProfile: fallbackSectionPagerSfx?.[sectionKey],
      }),
    ]),
  ) as Record<ProjectPresentationSectionKey, PresentationSectionCapabilityResolved>;
}

export function resolvePresentationSectionCapability(
  project: ProjectData,
  sectionKey: ProjectPresentationSectionKey,
): PresentationSectionCapabilityResolved {
  return resolvePresentationSectionCapabilities(project)[sectionKey];
}

export function resolvePresentationPrefetchPlan(
  project: ProjectData,
): ProjectPresentationConfig["prefetchPlan"] {
  return project.presentation?.prefetchPlan;
}
