import type { ProjectData } from "@/types/components/portfolio";

export type PresentationBehaviorConfig = {
  useSharedOverviewSlide: boolean;
  useSharedDemoSlide: boolean;
  useSharedArchitectureDiagramsSlide: boolean;
  enableWhyThisInterestsSection: boolean;
  demoLayout: "default" | "podcasts";
};

type PresentationProjectHref =
  | "/patientlistpodcasts"
  | "/aisummary"
  | "/patientlist"
  | "/assignmentlist";

const DEFAULT_PRESENTATION_BEHAVIOR: PresentationBehaviorConfig = {
  useSharedOverviewSlide: false,
  useSharedDemoSlide: false,
  useSharedArchitectureDiagramsSlide: false,
  enableWhyThisInterestsSection: false,
  demoLayout: "default",
};

const PRESENTATION_BEHAVIOR_BY_HREF: Record<PresentationProjectHref, PresentationBehaviorConfig> = {
  "/patientlistpodcasts": {
    useSharedOverviewSlide: true,
    useSharedDemoSlide: true,
    useSharedArchitectureDiagramsSlide: true,
    enableWhyThisInterestsSection: true,
    demoLayout: "podcasts",
  },
  "/aisummary": {
    useSharedOverviewSlide: true,
    useSharedDemoSlide: true,
    useSharedArchitectureDiagramsSlide: true,
    enableWhyThisInterestsSection: false,
    demoLayout: "default",
  },
  "/patientlist": {
    useSharedOverviewSlide: false,
    useSharedDemoSlide: true,
    useSharedArchitectureDiagramsSlide: true,
    enableWhyThisInterestsSection: false,
    demoLayout: "default",
  },
  "/assignmentlist": {
    useSharedOverviewSlide: false,
    useSharedDemoSlide: true,
    useSharedArchitectureDiagramsSlide: true,
    enableWhyThisInterestsSection: false,
    demoLayout: "default",
  },
};

export function resolvePresentationBehavior(project: ProjectData): PresentationBehaviorConfig {
  const normalizedHref = project.href?.trim().toLowerCase();
  if (!normalizedHref) {
    return DEFAULT_PRESENTATION_BEHAVIOR;
  }

  return (
    PRESENTATION_BEHAVIOR_BY_HREF[normalizedHref as PresentationProjectHref] ??
    DEFAULT_PRESENTATION_BEHAVIOR
  );
}
