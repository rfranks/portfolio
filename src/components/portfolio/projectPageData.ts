import { projects } from "@/consts/resumeData";
import type { ProjectData } from "./ProjectPresentation";

type ProjectPageOverrides = Omit<ProjectData, "project" | "description"> &
  Partial<Pick<ProjectData, "project" | "description">>;

export function createProjectPageData(
  href: string,
  overrides: ProjectPageOverrides,
): ProjectData {
  const baseProject = projects.find((project) => project.href === href);

  if (!baseProject) {
    throw new Error(`Project metadata not found for href: ${href}`);
  }

  return {
    project: overrides.project ?? baseProject.name,
    description: overrides.description ?? baseProject.description,
    ...overrides,
  };
}
