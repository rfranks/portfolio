import type { Metadata } from "next";
import AISummaryPageClient from "./AISummaryPageClient";
import { projectData } from "./project";

export const metadata: Metadata = {
  title: `${projectData.project} Project`,
  description: projectData.description,
};

export default function AISummaryPage() {
  return <AISummaryPageClient project={projectData} />;
}
