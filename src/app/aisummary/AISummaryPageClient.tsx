"use client";

import type { ProjectData } from "@/components/portfolio/ProjectPresentation";
import ProjectShowcasePage from "@/components/portfolio/ProjectShowcasePage";

interface AISummaryPageClientProps {
  project: ProjectData;
}

export default function AISummaryPageClient({
  project,
}: AISummaryPageClientProps) {
  return (
    <ProjectShowcasePage
      documentTitle="AISummary"
      heading="Physician-Focused AI Summaries"
      project={project}
      subtitle={project.project}
    />
  );
}
