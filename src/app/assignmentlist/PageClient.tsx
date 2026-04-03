"use client";

import type { ProjectData } from "@/types/components/portfolio";
import ProjectShowcasePage from "@/components/portfolio/ProjectShowcasePage";

interface PageClientProps {
  project: ProjectData;
}

export default function PageClient({ project }: PageClientProps) {
  return (
    <ProjectShowcasePage
      documentTitle="Assignment List"
      heading="Managed AssignmentList with Time-based and Filter-based Population Criterion"
      project={project}
      subtitle={project.project}
    />
  );
}
