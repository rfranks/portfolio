import { competencies, coreCompetencies, projects } from "@/consts/resumeData";
import type {
  CommandPaletteAction,
  ProjectData,
  ProjectPresentationSectionKey,
} from "@/types/components/portfolio";
import {
  createPresentationDiagramActionTargets,
  createPresentationSlideActionTargets,
  createProjectRouteActionTargets,
  type PresentationDiagramActionTarget,
  type PresentationSlideActionTarget,
  type ProjectRouteActionTarget,
} from "@/components/portfolio/actionIndexFactory";
import {
  resolvePresentationSectionCapabilities,
  resolvePresentationSectionOrder,
} from "./project-presentation/presentationConfig";
import { slugifyLooseToken } from "@/utils/content/presentationDeepLink";
import { getAppCapabilityRegistry } from "./appCapabilityRegistry";

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

const slugifyDiagramTitle = (title: string) => slugifyLooseToken(title);
const slugifyToken = (value: string) => slugifyLooseToken(value.trim());

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
  const hasWhySection = Boolean(project.interestsMeWhy?.trim());
  const hasDemoSection = hasPresentationDemoMedia(project);
  const hasDiagramsSection = resolvePresentationDiagramTargets(project).length > 0;
  const sectionCapabilities = resolvePresentationSectionCapabilities(project);

  const availabilityByKey: Record<ProjectPresentationSectionKey, boolean> = {
    overview: sectionCapabilities.overview.enabled,
    why: hasWhySection && sectionCapabilities.why.enabled,
    demo: hasDemoSection && sectionCapabilities.demo.enabled,
    technologies: sectionCapabilities.technologies.enabled,
    specifications: sectionCapabilities.specifications.enabled,
    diagrams: hasDiagramsSection && sectionCapabilities.diagrams.enabled,
  };

  const defaultOrder: readonly ProjectPresentationSectionKey[] = [
    "overview",
    "why",
    "demo",
    "technologies",
    "specifications",
    "diagrams",
  ];
  const configuredOrder = resolvePresentationSectionOrder(
    project,
    defaultOrder,
  ) as readonly ProjectPresentationSectionKey[];
  const orderedUniqueKeys = Array.from(new Set(configuredOrder));
  const fallbackKeys = defaultOrder.filter((key) => !orderedUniqueKeys.includes(key));
  const mergedOrder = [...orderedUniqueKeys, ...fallbackKeys];

  return mergedOrder.filter((key) => availabilityByKey[key]);
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

export function getPresentationProjectContractBySlug(
  slug: string,
): PresentationProjectContract | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return (
    getPresentationProjectContracts().find(
      (contract) => contract.projectSlug.trim().toLowerCase() === normalized,
    ) ?? null
  );
}

export function getPresentationSectionTitle(key: ProjectPresentationSectionKey): string {
  return PRESENTATION_SECTION_TITLE_BY_KEY[key];
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

export function getProjectRouteActionTargets(): ProjectRouteActionTarget[] {
  return createProjectRouteActionTargets(projects);
}

export function getPresentationSlideActionTargets(): PresentationSlideActionTarget[] {
  return createPresentationSlideActionTargets(getPresentationProjectDeepLinkIndex());
}

export function getPresentationDiagramActionTargets(): PresentationDiagramActionTarget[] {
  return createPresentationDiagramActionTargets(getPresentationProjectDeepLinkIndex());
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

const dedupeCommandPaletteActions = (actions: CommandPaletteAction[]) => {
  const seen = new Set<string>();
  const deduped: CommandPaletteAction[] = [];
  actions.forEach((action) => {
    const key = `${action.id}::${action.label}::${action.href ?? ""}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push(action);
  });
  return deduped;
};

const buildStaticProjectSearchActions = (): CommandPaletteAction[] =>
  getProjectRouteActionTargets().map((target) => {
    const previewMeta = `${target.projectType.toUpperCase()} • ${target.href}`;
    return {
      id: `search-project-${target.href}`,
      label: `Project: ${target.projectTitle}`,
      subtitle: target.projectSummary,
      previewTitle: target.projectTitle,
      previewBody: target.projectDescription || target.projectSummary,
      previewMeta,
      group: "Projects",
      href: target.href,
      keywords: [
        "project",
        target.projectTitle,
        target.projectSummary,
        target.projectDescription,
        target.projectType,
        target.href,
      ],
    } satisfies CommandPaletteAction;
  });

const buildStaticSlideSearchActions = (): CommandPaletteAction[] =>
  getPresentationSlideActionTargets().map((entry) => ({
    id: `search-slide-${entry.projectSlug}-${entry.slideKey}`,
    label: `Slide: ${entry.projectTitle} • ${entry.slideTitle}`,
    subtitle: entry.href,
    previewTitle: `${entry.projectTitle} • ${entry.slideTitle}`,
    previewBody: `Jump directly to the ${entry.slideTitle} slide.`,
    previewMeta: `/${entry.projectSlug}`,
    group: "Slides",
    href: entry.href,
    keywords: [
      "slide",
      "presentation",
      "section",
      entry.projectTitle,
      entry.projectSlug,
      entry.slideTitle,
      entry.slideKey,
    ],
  }));

const buildStaticDiagramSearchActions = (): CommandPaletteAction[] =>
  getPresentationDiagramActionTargets().map((entry) => {
    const diagramTitle = entry.diagramTitle;
    return {
      id: `search-diagram-${entry.projectSlug}-${entry.diagramIndex}`,
      label: `Diagram: ${entry.projectTitle} • ${diagramTitle}`,
      subtitle: entry.href,
      previewTitle: `${entry.projectTitle} • ${diagramTitle}`,
      previewBody: "Jump to this architecture diagram and focus the diagrams slide.",
      previewMeta: `/${entry.projectSlug} • ${entry.diagramIndex + 1}`,
      group: "Diagrams",
      href: entry.href,
      keywords: [
        "diagram",
        "architecture",
        "mermaid",
        "presentation",
        entry.projectTitle,
        entry.projectSlug,
        diagramTitle,
        entry.diagramKey ?? "",
      ],
    } satisfies CommandPaletteAction;
  });

const buildStaticTechnologySearchActions = (): CommandPaletteAction[] =>
  projects.flatMap((project) => {
    const projectHref = typeof project.href === "string" ? project.href.trim() : "";
    const projectTitle = project.name.trim() || projectHref.replace(/^\/+/, "");
    const technologies = Array.isArray(project.technologiesUsed) ? project.technologiesUsed : [];
    const projectSlug = projectHref.replace(/^\/+/, "");
    const technologyHref =
      project.type?.toLowerCase() === PRESENTATION_PROJECT_TYPE && projectSlug
        ? createPresentationProjectDeepLinkHref({
            projectSlug,
            slideKey: "technologies",
          })
        : projectHref;

    return technologies
      .filter((tech) => Boolean(tech?.name?.trim()) && Boolean(technologyHref))
      .map<CommandPaletteAction>((tech) => ({
        id: `search-technology-${slugifyToken(projectTitle)}-${slugifyToken(tech.name)}`,
        label: `Technology: ${tech.name}`,
        subtitle: projectTitle,
        previewTitle: `${tech.name} • ${projectTitle}`,
        previewBody: `Used in ${projectTitle}.`,
        previewMeta: technologyHref,
        group: "Technologies",
        href: technologyHref,
        keywords: [
          "technology",
          "tech",
          tech.name,
          projectTitle,
          project.description,
          project.type ?? "",
          technologyHref,
        ],
      }));
  });

const buildStaticSkillSearchActions = (): CommandPaletteAction[] => {
  const categorySkills =
    competencies.categories?.flatMap((category) =>
      (category.items ?? [])
        .filter((skill) => Boolean(skill?.label?.trim()))
        .map<CommandPaletteAction>((skill) => ({
          id: `search-skill-${slugifyToken(`${category.title}-${skill.label}`)}`,
          label: `Skill: ${skill.label}`,
          subtitle: category.title,
          previewTitle: `${skill.label} • ${category.title}`,
          previewBody: skill.description?.trim() || `Jump to Core Competencies for ${skill.label}.`,
          previewMeta: "/#competencies",
          group: "Skills",
          href: "/#competencies",
          keywords: [
            "skill",
            "competency",
            "core competency",
            skill.label,
            category.title,
            skill.description ?? "",
          ],
        })),
    ) ?? [];

  const coreSkills = coreCompetencies.map((skill) => ({
    id: `search-core-skill-${slugifyToken(skill)}`,
    label: `Skill: ${skill}`,
    subtitle: "Core Competencies",
    previewTitle: `${skill} • Core Competencies`,
    previewBody: `Jump to Core Competencies for ${skill}.`,
    previewMeta: "/#competencies",
    group: "Skills",
    href: "/#competencies",
    keywords: ["skill", "competency", "core competency", skill],
  })) satisfies CommandPaletteAction[];

  return [...categorySkills, ...coreSkills];
};

const buildStaticAppRouteSearchActions = (): CommandPaletteAction[] =>
  getAppCapabilityRegistry()
    .filter((entry) => entry.kind === "app" && entry.href !== "/")
    .map((entry) => ({
      id: `search-app-route-${slugifyToken(entry.href)}`,
      label: `App Route: ${entry.label}`,
      subtitle: entry.href,
      previewTitle: `${entry.label} • App Route`,
      previewBody: `Open ${entry.label} and jump directly into its app surface.`,
      previewMeta: entry.href,
      group: entry.commandGroup,
      href: entry.href,
      keywords: [
        "app",
        "route",
        "open",
        entry.label,
        entry.href,
        ...entry.features,
        ...entry.dataSources,
      ],
    }));

const STATIC_SEARCH_INDEX_ACTIONS = dedupeCommandPaletteActions([
  ...buildStaticAppRouteSearchActions(),
  ...buildStaticSkillSearchActions(),
  ...buildStaticTechnologySearchActions(),
  ...buildStaticProjectSearchActions(),
  ...buildStaticSlideSearchActions(),
  ...buildStaticDiagramSearchActions(),
]);

export function getPortfolioStaticSearchIndexActions(): CommandPaletteAction[] {
  return STATIC_SEARCH_INDEX_ACTIONS;
}
