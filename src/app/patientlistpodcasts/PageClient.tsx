"use client";

import type { ProjectData } from "@/types/components/portfolio";
import ProjectShowcasePage from "@/components/portfolio/ProjectShowcasePage";

interface PageClientProps {
  project: ProjectData;
}

export default function PageClient({ project }: PageClientProps) {
  const heading = project.showcaseHeading?.trim() || project.project;
  const subtitle = project.showcaseSubtitle?.trim() || project.project;

  return (
    <ProjectShowcasePage
      documentTitle="Patient List Podcasts"
      heading={heading}
      project={project}
      subtitle={subtitle}
    />
  );
}
