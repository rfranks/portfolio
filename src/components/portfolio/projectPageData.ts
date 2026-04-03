import { projects } from "@/consts/resumeData";
import type { ProjectData } from "@/types/components/portfolio";

type ProjectPageOverrides = Partial<ProjectData>;

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

  return {
    ...(mergedProject as ProjectData),
    project: overrides.project ?? mergedProject.project ?? baseProject.name,
    description:
      overrides.description ??
      mergedProject.description ??
      baseProject.description,
  } satisfies ProjectData;
}
