"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Link from "@mui/material/Link";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";
import { Diagram } from "@/components/showcase/Diagram";
import { withBasePath } from "@/utils/basePath";

export interface Technology {
  name: string;
  url?: string;
}

export interface ProjectData {
  project: string;
  description: string;
  /**
   * Brief punchline that highlights the value proposition of the
   * project. Rendered prominently to give the presentation a bit of
   * "wow" for viewers such as physicians evaluating the tooling.
   */
  wowFactor?: string;
  demoGifUrl: string;
  specifications: Record<string, unknown>;
  technologiesUsed: Technology[];
  blockDiagram: string;
  componentDiagram: string;
  sequenceDiagram: string;
}

interface ProjectPresentationProps {
  project: ProjectData;
}

export default function ProjectPresentation({ project }: ProjectPresentationProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <FadeInSection>
        <TronPaper>
          <Typography variant="h4" gutterBottom>
            {project.project}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {project.description}
          </Typography>
          {project.wowFactor && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(90deg, #1976d2, #21cbf3)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                mb: 2,
              }}
            >
              {project.wowFactor}
            </Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Image
              src={withBasePath(project.demoGifUrl)}
              alt={`${project.project} demo`}
              width={800}
              height={450}
              style={{ width: "100%", height: "auto" }}
            />
          </Box>
        </TronPaper>
      </FadeInSection>

      <FadeInSection>
        <TronPaper>
          <Typography variant="h5" gutterBottom>
            Technologies Used
          </Typography>
          <List dense>
            {project.technologiesUsed.map((tech) => (
              <ListItem key={tech.name}>
                {tech.url ? (
                  <Link href={tech.url} target="_blank" rel="noopener noreferrer">
                    {tech.name}
                  </Link>
                ) : (
                  tech.name
                )}
              </ListItem>
            ))}
          </List>
        </TronPaper>
      </FadeInSection>

      <FadeInSection>
        <TronPaper>
          <Typography variant="h5" gutterBottom>
            Specifications
          </Typography>
          {Object.entries(project.specifications).map(([key, value]) => (
            <Accordion key={key} sx={{ backgroundColor: "transparent" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{key}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
                  {JSON.stringify(value, null, 2)}
                </pre>
              </AccordionDetails>
            </Accordion>
          ))}
        </TronPaper>
      </FadeInSection>

      <FadeInSection>
        <TronPaper>
          <Typography variant="h5" gutterBottom>
            Block Diagram
          </Typography>
          <Diagram diagram={project.blockDiagram} height="400px" />
        </TronPaper>
      </FadeInSection>

      <FadeInSection>
        <TronPaper>
          <Typography variant="h5" gutterBottom>
            Component Diagram
          </Typography>
          <Diagram diagram={project.componentDiagram} height="400px" />
        </TronPaper>
      </FadeInSection>

      <FadeInSection>
        <TronPaper>
          <Typography variant="h5" gutterBottom>
            Sequence Diagram
          </Typography>
          <Diagram
            diagram={project.sequenceDiagram}        
            height="400px"
          />
        </TronPaper>
      </FadeInSection>
    </Box>
  );
}

