"use client";

import type { ProjectData } from "@/types/components/portfolio";
import ProjectShowcasePage from "@/components/portfolio/ProjectShowcasePage";

interface AISummaryPageClientProps {
  project: ProjectData;
}

export default function AISummaryPageClient({ project }: AISummaryPageClientProps) {
  return (
    <ProjectShowcasePage
      documentTitle="AISummary"
      heading="Physician-Focused AI Summaries"
      project={project}
      subtitle={project.project}
    />
  );
}
