"use client";

import type { ProjectData } from "@/types/components/portfolio";
import ProjectShowcasePage from "@/components/portfolio/ProjectShowcasePage";

interface PageClientProps {
  project: ProjectData;
}

export default function PageClient({ project }: PageClientProps) {
  return (
    <ProjectShowcasePage
      documentTitle="Patient List Podcasts"
      heading="Physician-Focused Patient-list Podcasts"
      project={project}
      subtitle={project.project}
    />
  );
}
