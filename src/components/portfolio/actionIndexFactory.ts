import type { ProjectPresentationSectionKey } from "@/types/components/portfolio";

export type ProjectRouteActionTarget = {
  href: string;
  projectTitle: string;
  projectSummary: string;
  projectDescription: string;
  projectType: string;
};

export type ProjectRouteActionTargetInput = {
  href?: string;
  project?: string;
  name?: string;
  shortText?: string;
  showcaseSubtitle?: string;
  description?: string;
  type?: string;
};

export type PresentationDeepLinkActionTargetInput = {
  href: string;
  projectSlug: string;
  projectTitle: string;
  slideKey: ProjectPresentationSectionKey;
  slideTitle: string;
  diagramIndex?: number;
  diagramKey?: string;
  diagramTitle?: string;
};

export type PresentationSlideActionTarget = {
  href: string;
  projectSlug: string;
  projectTitle: string;
  slideKey: ProjectPresentationSectionKey;
  slideTitle: string;
};

export type PresentationDiagramActionTarget = {
  href: string;
  projectSlug: string;
  projectTitle: string;
  slideKey: "diagrams";
  diagramIndex: number;
  diagramKey?: string;
  diagramTitle: string;
};

export function createProjectRouteActionTargets(
  projectEntries: readonly ProjectRouteActionTargetInput[],
): ProjectRouteActionTarget[] {
  return projectEntries
    .filter((project) => typeof project.href === "string" && project.href.trim().startsWith("/"))
    .map((project) => {
      const href = project.href!.trim();
      const projectTitle =
        project.project?.trim() || project.name?.trim() || href.replace(/^\/+/, "");
      const projectSummary =
        project.shortText?.trim() ||
        project.showcaseSubtitle?.trim() ||
        project.description?.trim() ||
        projectTitle;
      const projectDescription = project.description?.trim() || projectSummary;

      return {
        href,
        projectTitle,
        projectSummary,
        projectDescription,
        projectType: project.type?.trim().toLowerCase() || "project",
      } satisfies ProjectRouteActionTarget;
    });
}

export function createPresentationSlideActionTargets(
  deepLinks: readonly PresentationDeepLinkActionTargetInput[],
): PresentationSlideActionTarget[] {
  return deepLinks
    .filter((entry) => entry.diagramIndex === undefined)
    .map((entry) => ({
      href: entry.href,
      projectSlug: entry.projectSlug,
      projectTitle: entry.projectTitle,
      slideKey: entry.slideKey,
      slideTitle: entry.slideTitle,
    }));
}

export function createPresentationDiagramActionTargets(
  deepLinks: readonly PresentationDeepLinkActionTargetInput[],
): PresentationDiagramActionTarget[] {
  return deepLinks
    .filter(
      (entry): entry is PresentationDeepLinkActionTargetInput & { diagramIndex: number } =>
        typeof entry.diagramIndex === "number" && Number.isFinite(entry.diagramIndex),
    )
    .map((entry) => ({
      href: entry.href,
      projectSlug: entry.projectSlug,
      projectTitle: entry.projectTitle,
      slideKey: "diagrams",
      diagramIndex: entry.diagramIndex,
      diagramKey: entry.diagramKey,
      diagramTitle: entry.diagramTitle ?? `Diagram ${entry.diagramIndex + 1}`,
    }));
}
