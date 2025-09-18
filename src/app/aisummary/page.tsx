import type { Metadata } from "next";
import AISummaryPageClient from "./AISummaryPageClient";
import { projectData } from "./project";

export const metadata: Metadata = {
  title: "AISummary Project",
  description: "PowerPoint-style presentation for the AISummary page",
};

export default function AISummaryPage() {
  return <AISummaryPageClient project={projectData} />;
}

