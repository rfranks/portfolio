import type {
  ProjectData,
  ProjectPresentationConfig,
  ProjectPresentationDemoLayout,
} from "@/types/components/portfolio";

export type PresentationBehaviorConfig = {
  useSharedOverviewSlide: boolean;
  useSharedDemoSlide: boolean;
  useSharedArchitectureDiagramsSlide: boolean;
  enableWhyThisInterestsSection: boolean;
  demoLayout: ProjectPresentationDemoLayout;
};

const DEFAULT_PRESENTATION_BEHAVIOR: PresentationBehaviorConfig = {
  useSharedOverviewSlide: false,
  useSharedDemoSlide: false,
  useSharedArchitectureDiagramsSlide: false,
  enableWhyThisInterestsSection: false,
  demoLayout: "default",
};

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

export function resolvePresentationPrefetchPlan(
  project: ProjectData,
): ProjectPresentationConfig["prefetchPlan"] {
  return project.presentation?.prefetchPlan;
}
