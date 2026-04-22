import type { Metadata } from "next";
import type { ProjectData } from "@/types/components/portfolio";
import ProjectShowcaseClientPage from "./ProjectShowcaseClientPage";

interface ProjectShowcaseRoutePageProps {
  project: ProjectData;
  documentTitle?: string;
  heading?: string;
  subtitle?: string;
}

const createProjectShowcaseMetadata = (project: ProjectData): Metadata => ({
  title: `${project.project} Project`,
  description: project.description,
});

export default function ProjectShowcaseRoutePage({
  project,
  documentTitle,
  heading,
  subtitle,
}: ProjectShowcaseRoutePageProps) {
  return (
    <ProjectShowcaseClientPage
      project={project}
      documentTitle={documentTitle}
      heading={heading}
      subtitle={subtitle}
    />
  );
}

export { createProjectShowcaseMetadata };
export type { ProjectShowcaseRoutePageProps };
