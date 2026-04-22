import { projects } from "@/consts/resumeData";
import type { ProjectData, ProjectPresentationSectionKey } from "@/types/components/portfolio";

type ProjectPageOverrides = Partial<ProjectData>;
const PRESENTATION_PROJECT_TYPE = "presentation";
const PRESENTATION_SECTION_TITLE_BY_KEY: Record<ProjectPresentationSectionKey, string> = {
  overview: "Overview",
  why: "Why This Interests Me",
  demo: "Demo",
  technologies: "Technologies Used",
  specifications: "Specifications",
  diagrams: "Architecture",
};

const normalizeSlugToHref = (slug: string) => {
  const trimmed = slug.trim().replace(/^\/+/, "");
  return `/${trimmed}`;
};

const normalizeHrefToSlug = (href: string): string => href.replace(/^\/+/, "").trim();

const slugifyDiagramTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export type PresentationProjectDiagramTarget = {
  key: string;
  title: string;
  index: number;
};

export type PresentationProjectContract = {
  projectHref: string;
  projectSlug: string;
  projectName: string;
  projectTitle: string;
  hasDemoMedia: boolean;
  sections: ProjectPresentationSectionKey[];
  diagrams: PresentationProjectDiagramTarget[];
};

export type PresentationProjectDeepLinkTarget = {
  id: string;
  href: string;
  projectHref: string;
  projectSlug: string;
  projectTitle: string;
  slideKey: ProjectPresentationSectionKey;
  slideTitle: string;
  diagramIndex?: number;
  diagramKey?: string;
  diagramTitle?: string;
};

export function createProjectPageData(
  href: string,
  overrides: ProjectPageOverrides = {},
): ProjectData {
  const baseProject = projects.find((project) => project.href === href);

  if (!baseProject) {
    throw new Error(`Project metadata not found for href: ${href}`);
  }

  const mergedProject = {
    ...(baseProject as Partial<ProjectData>),
    ...overrides,
  };
  const baseProjectRecord = baseProject as Record<string, unknown>;
  const baseProjectBlurb =
    typeof baseProjectRecord.blurb === "string" && baseProjectRecord.blurb.trim()
      ? baseProjectRecord.blurb.trim()
      : undefined;

  return {
    ...(mergedProject as ProjectData),
    project: overrides.project ?? mergedProject.project ?? baseProject.name,
    description:
      overrides.description ??
      baseProjectBlurb ??
      mergedProject.description ??
      baseProject.description,
  } satisfies ProjectData;
}

function hasPresentationDemoMedia(project: ProjectData) {
  return Boolean(
    project.terminalDemo?.mediaUrl?.trim() ||
    project.demoVideoUrl?.trim() ||
    project.demoGifUrl?.trim(),
  );
}

function resolvePresentationDiagramTargets(
  project: ProjectData,
): PresentationProjectDiagramTarget[] {
  const configuredDiagrams = Array.isArray(project.diagrams) ? project.diagrams : [];
  if (configuredDiagrams.length > 0) {
    return configuredDiagrams
      .map((diagram, index) => {
        const title = diagram?.title?.trim() || `Diagram ${index + 1}`;
        const diagramSource = diagram?.diagram?.trim();
        if (!diagramSource) {
          return null;
        }
        return {
          key: `diagram-${index}-${slugifyDiagramTitle(title)}`,
          title,
          index,
        } satisfies PresentationProjectDiagramTarget;
      })
      .filter((entry): entry is PresentationProjectDiagramTarget => Boolean(entry));
  }

  const legacyDiagrams = [
    { key: "block-diagram", title: "Block Diagram", source: project.blockDiagram?.trim() },
    {
      key: "component-diagram",
      title: "Component Diagram",
      source: project.componentDiagram?.trim(),
    },
    {
      key: "sequence-diagram",
      title: "Sequence Diagram",
      source: project.sequenceDiagram?.trim(),
    },
  ];

  return legacyDiagrams
    .filter((diagram) => Boolean(diagram.source))
    .map((diagram, index) => ({
      key: diagram.key,
      title: diagram.title,
      index,
    }));
}

function resolvePresentationSections(project: ProjectData): ProjectPresentationSectionKey[] {
  const sections: ProjectPresentationSectionKey[] = ["overview"];
  if (project.interestsMeWhy?.trim()) {
    sections.push("why");
  }
  if (hasPresentationDemoMedia(project)) {
    sections.push("demo");
  }
  sections.push("technologies", "specifications");
  if (resolvePresentationDiagramTargets(project).length > 0) {
    sections.push("diagrams");
  }
  return sections;
}

export function createPresentationProjectDeepLinkHref({
  projectSlug,
  slideKey,
  diagramIndex,
}: {
  projectSlug: string;
  slideKey: ProjectPresentationSectionKey;
  diagramIndex?: number;
}) {
  const normalizedSlug = projectSlug.trim().replace(/^\/+/, "");
  const params = new URLSearchParams();
  params.set("project", normalizedSlug);
  params.set("slide", slideKey);
  if (slideKey === "diagrams" && diagramIndex !== undefined) {
    params.set("diagram", String(diagramIndex + 1));
  }

  const query = params.toString();
  return `/${normalizedSlug}${query ? `?${query}` : ""}`;
}

export function getPresentationProjectSlugs(): string[] {
  return projects
    .filter(
      (project) =>
        typeof project.type === "string" &&
        project.type.trim().toLowerCase() === PRESENTATION_PROJECT_TYPE &&
        typeof project.href === "string" &&
        project.href.trim().startsWith("/"),
    )
    .map((project) => normalizeHrefToSlug(project.href))
    .filter(Boolean);
}

export function getPresentationProjectContracts(): PresentationProjectContract[] {
  return getPresentationProjectSlugs()
    .map((slug) => {
      const project = createPresentationProjectPageData(slug);
      if (!project) {
        return null;
      }
      const projectTitle = project.project?.trim() || project.description?.trim() || slug;
      return {
        projectHref: normalizeSlugToHref(slug),
        projectSlug: slug,
        projectName: project.project,
        projectTitle,
        hasDemoMedia: hasPresentationDemoMedia(project),
        sections: resolvePresentationSections(project),
        diagrams: resolvePresentationDiagramTargets(project),
      } satisfies PresentationProjectContract;
    })
    .filter((contract): contract is PresentationProjectContract => Boolean(contract));
}

export function getPresentationProjectDeepLinkIndex(): PresentationProjectDeepLinkTarget[] {
  const deepLinks: PresentationProjectDeepLinkTarget[] = [];

  getPresentationProjectContracts().forEach((contract) => {
    contract.sections.forEach((slideKey) => {
      deepLinks.push({
        id: `presentation-${contract.projectSlug}-${slideKey}`,
        href: createPresentationProjectDeepLinkHref({
          projectSlug: contract.projectSlug,
          slideKey,
        }),
        projectHref: contract.projectHref,
        projectSlug: contract.projectSlug,
        projectTitle: contract.projectTitle,
        slideKey,
        slideTitle: PRESENTATION_SECTION_TITLE_BY_KEY[slideKey],
      });
    });

    contract.diagrams.forEach((diagram) => {
      deepLinks.push({
        id: `presentation-${contract.projectSlug}-diagrams-${diagram.index + 1}`,
        href: createPresentationProjectDeepLinkHref({
          projectSlug: contract.projectSlug,
          slideKey: "diagrams",
          diagramIndex: diagram.index,
        }),
        projectHref: contract.projectHref,
        projectSlug: contract.projectSlug,
        projectTitle: contract.projectTitle,
        slideKey: "diagrams",
        slideTitle: PRESENTATION_SECTION_TITLE_BY_KEY.diagrams,
        diagramIndex: diagram.index,
        diagramKey: diagram.key,
        diagramTitle: diagram.title,
      });
    });
  });

  return deepLinks;
}

export function createPresentationProjectPageData(
  slug: string,
  overrides: ProjectPageOverrides = {},
): ProjectData | null {
  const href = normalizeSlugToHref(slug);
  const project = projects.find((entry) => entry.href === href);

  if (!project) {
    return null;
  }

  if (
    typeof project.type !== "string" ||
    project.type.trim().toLowerCase() !== PRESENTATION_PROJECT_TYPE
  ) {
    return null;
  }

  return createProjectPageData(href, overrides);
}
