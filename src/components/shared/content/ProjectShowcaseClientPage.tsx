"use client";

import ProjectShowcasePage from "@/components/portfolio/ProjectShowcasePage";
import type { ProjectData } from "@/types/components/portfolio";

interface ProjectShowcaseClientPageProps {
  project: ProjectData;
  documentTitle?: string;
  heading?: string;
  subtitle?: string;
}

export default function ProjectShowcaseClientPage({
  project,
  documentTitle,
  heading,
  subtitle,
}: ProjectShowcaseClientPageProps) {
  const resolvedHeading = heading?.trim() || project.showcaseHeading?.trim() || project.project;
  const resolvedSubtitle = subtitle?.trim() || project.showcaseSubtitle?.trim() || project.project;
  const resolvedDocumentTitle = documentTitle?.trim() || project.project;

  return (
    <ProjectShowcasePage
      documentTitle={resolvedDocumentTitle}
      heading={resolvedHeading}
      project={project}
      subtitle={resolvedSubtitle}
    />
  );
}

export type { ProjectShowcaseClientPageProps };
