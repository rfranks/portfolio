"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Link from "@mui/material/Link";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { ReactNode } from "react";

import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import FadeInSection from "@/components/shared/FadeInSection";
import { Diagram } from "@/components/shared/Diagram";
import MarkdownContent from "@/components/shared/MarkdownContent";
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
  demoGifUrl?: string;
  demoVideoUrl?: string;
  specifications: Record<string, unknown>;
  technologiesUsed: Technology[];
  blockDiagram: string;
  componentDiagram: string;
  sequenceDiagram: string;
}

interface ProjectPresentationProps {
  project: ProjectData;
}

export default function ProjectPresentation({
  project,
}: ProjectPresentationProps) {
  const renderSpecification = (value: unknown): ReactNode => {
    if (Array.isArray(value)) {
      return (
        <List dense>
          {value.map((item, index) => (
            <ListItem key={index}>{renderSpecification(item)}</ListItem>
          ))}
        </List>
      );
    }

    if (typeof value === "object" && value !== null) {
      return Object.entries(value as Record<string, unknown>).map(
        ([childKey, childValue]) => (
          <Accordion key={childKey} sx={{ backgroundColor: "transparent" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{childKey}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderSpecification(childValue)}
            </AccordionDetails>
          </Accordion>
        ),
      );
    }

    return <MarkdownContent content={String(value)} sx={{ "& p": { mb: 0 } }} />;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <FadeInSection>
        <PortfolioPanel>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" gutterBottom>
                {project.project}
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
              <MarkdownContent
                content={project.description}
                variant="body1"
                sx={{ "& p": { mb: 2 }, "& > :last-child": { mb: 0 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: "center" }}>
                {project.demoGifUrl && (
                  <Image
                    src={withBasePath(project.demoGifUrl)}
                    alt={`${project.project} demo`}
                    width={800}
                    height={450}
                    style={{ width: "100%", height: "auto", borderRadius: 8 }}
                  />
                )}
                {project.demoVideoUrl && (
                  <video
                    src={withBasePath(project.demoVideoUrl)}
                    controls
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </PortfolioPanel>
      </FadeInSection>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <FadeInSection>
            <PortfolioPanel>
              <Typography variant="h5" gutterBottom>
                Technologies Used
              </Typography>
              <List dense>
                {project.technologiesUsed.map((tech) => (
                  <ListItem key={tech.name}>
                    {tech.url ? (
                      <Link
                        href={tech.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {tech.name}
                      </Link>
                    ) : (
                      tech.name
                    )}
                  </ListItem>
                ))}
              </List>
            </PortfolioPanel>
          </FadeInSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <FadeInSection>
            <PortfolioPanel>
              <Typography variant="h5" gutterBottom>
                Specifications
              </Typography>
              {Object.entries(project.specifications).map(([key, value]) => (
                <Accordion key={key} sx={{ backgroundColor: "transparent" }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">{key}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {renderSpecification(value)}
                  </AccordionDetails>
                </Accordion>
              ))}
            </PortfolioPanel>
          </FadeInSection>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <FadeInSection>
            <PortfolioPanel>
              <Typography variant="h5" gutterBottom>
                Block Diagram
              </Typography>
              <Diagram diagram={project.blockDiagram} height="400px" />
            </PortfolioPanel>
          </FadeInSection>
        </Grid>
        <Grid item xs={12}>
          <FadeInSection>
            <PortfolioPanel>
              <Typography variant="h5" gutterBottom>
                Component Diagram
              </Typography>
              <Diagram diagram={project.componentDiagram} height="400px" />
            </PortfolioPanel>
          </FadeInSection>
        </Grid>
        <Grid item xs={12}>
          <FadeInSection>
            <PortfolioPanel>
              <Typography variant="h5" gutterBottom>
                Sequence Diagram
              </Typography>
              <Diagram diagram={project.sequenceDiagram} height="400px" />
            </PortfolioPanel>
          </FadeInSection>
        </Grid>
      </Grid>
    </Box>
  );
}
