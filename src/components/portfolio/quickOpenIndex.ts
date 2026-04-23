import { competencies, coreCompetencies, projects } from "@/consts/resumeData";
import type { CommandPaletteAction } from "@/types/components/portfolio";
import { getPresentationProjectDeepLinkIndex } from "@/components/portfolio/projectPageData";
import { getAppCapabilityRegistry } from "@/components/portfolio/appCapabilityRegistry";

const normalizeText = (value: string) => value.trim().toLowerCase();

const dedupeActions = (actions: CommandPaletteAction[]) => {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = `${normalizeText(action.label)}::${action.href ?? ""}::${action.group ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const buildAppActions = (): CommandPaletteAction[] =>
  getAppCapabilityRegistry()
    .filter((item) => item.kind === "app" && item.href !== "/")
    .map((item) => ({
      id: `quick-open-app-${item.href}`,
      label: `Open App: ${item.label}`,
      subtitle: item.href,
      group: "Apps",
      href: item.href,
      keywords: ["app", "open", item.label, item.href, ...item.features],
    }));

const buildProjectActions = (): CommandPaletteAction[] =>
  getAppCapabilityRegistry()
    .filter((item) => item.kind === "project")
    .map((item) => {
      const project = projects.find((entry) => entry.href?.trim() === item.href);
      const projectTitle = item.label;
      const projectSubtitle =
        project?.shortText || project?.showcaseSubtitle || project?.description || item.href;
      return {
        id: `quick-open-project-${item.href}`,
        label: `Open Project: ${projectTitle}`,
        subtitle: projectSubtitle,
        group: "Projects",
        href: item.href,
        keywords: [
          "project",
          "open",
          projectTitle,
          project?.name ?? "",
          project?.description ?? "",
          project?.type ?? "",
          item.href,
          ...item.features,
        ],
      } satisfies CommandPaletteAction;
    });

const buildSlideActions = (): CommandPaletteAction[] =>
  getPresentationProjectDeepLinkIndex()
    .filter((entry) => entry.diagramIndex === undefined)
    .map((entry) => ({
      id: `quick-open-slide-${entry.projectSlug}-${entry.slideKey}`,
      label: `Slide: ${entry.projectTitle} • ${entry.slideTitle}`,
      subtitle: entry.href,
      group: "Slides",
      href: entry.href,
      keywords: [
        "slide",
        "presentation",
        "section",
        entry.projectTitle,
        entry.projectSlug,
        entry.slideKey,
        entry.slideTitle,
      ],
    }));

const buildDiagramActions = (): CommandPaletteAction[] =>
  getPresentationProjectDeepLinkIndex()
    .filter((entry) => entry.diagramIndex !== undefined)
    .map((entry) => ({
      id: `quick-open-diagram-${entry.projectSlug}-${entry.diagramIndex}`,
      label: `Diagram: ${entry.projectTitle} • ${entry.diagramTitle ?? `Diagram ${entry.diagramIndex! + 1}`}`,
      subtitle: entry.href,
      group: "Diagrams",
      href: entry.href,
      keywords: [
        "diagram",
        "architecture",
        "mermaid",
        "presentation",
        entry.projectTitle,
        entry.projectSlug,
        entry.diagramTitle ?? "",
        entry.diagramKey ?? "",
      ],
    }));

const buildSkillActions = (): CommandPaletteAction[] => {
  const categorySkills =
    competencies.categories?.flatMap((category) =>
      (category.items ?? []).map((skill) => ({
        id: `quick-open-skill-${normalizeText(`${category.title}-${skill.label}`).replace(/[^a-z0-9]+/g, "-")}`,
        label: `Skill: ${skill.label}`,
        subtitle: category.title,
        group: "Skills",
        href: "/#competencies",
        keywords: ["skill", "competency", "core competency", skill.label, category.title],
      })),
    ) ?? [];

  const coreSkills = coreCompetencies.map((skill) => ({
    id: `quick-open-core-skill-${normalizeText(skill).replace(/[^a-z0-9]+/g, "-")}`,
    label: `Skill: ${skill}`,
    subtitle: "Core Competencies",
    group: "Skills",
    href: "/#competencies",
    keywords: ["skill", "competency", "core competency", skill],
  }));

  return [...categorySkills, ...coreSkills];
};

export const STATIC_QUICK_OPEN_ACTIONS: CommandPaletteAction[] = dedupeActions([
  ...buildAppActions(),
  ...buildProjectActions(),
  ...buildSlideActions(),
  ...buildDiagramActions(),
  ...buildSkillActions(),
]);
