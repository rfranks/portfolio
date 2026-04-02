"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import ProjectPresentation, {
  ProjectData,
} from "@/components/portfolio/ProjectPresentation";
import { Divider } from "@mui/material";
import { useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface PageClientProps {
  project: ProjectData;
}

export default function PageClient({ project }: PageClientProps) {
  const { setDocumentTitle } = useDocumentTitle();
  useEffect(() => {
    setDocumentTitle("Patient List");
  }, [setDocumentTitle]);
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0e7ff 0%, #fdf2f8 100%)",
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          align="left"
          sx={{
            fontWeight: 700,
            mb: 6,
            background: "linear-gradient(90deg, #1976d2, #21cbf3)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Physician-Focused Patient-list with Time-based and Filter-based
          Population Criteria.
        </Typography>
        <Divider sx={{ mb: 6 }} />
        <ProjectPresentation project={project} />
      </Container>
    </Box>
  );
}
