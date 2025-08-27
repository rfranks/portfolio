"use client";

import Container from "@mui/material/Container";
import ProjectPresentation, { ProjectData } from "@/components/showcase/ProjectPresentation";

interface AISummaryPageClientProps {
  project: ProjectData;
}

export default function AISummaryPageClient({ project }: AISummaryPageClientProps) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProjectPresentation project={project} />
    </Container>
  );
}

