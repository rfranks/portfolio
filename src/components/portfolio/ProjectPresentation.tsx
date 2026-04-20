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
import { useEffect, useMemo, useState, type ReactNode } from "react";

import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import { ImageLightbox, MarkdownContent, MediaCycler, VideoLightbox } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import type { ProjectData } from "@/types/components/portfolio";
import { withBasePath } from "@/utils/basePath";
export type { ProjectData, Technology } from "@/types/components/portfolio";

interface ProjectPresentationProps {
  project: ProjectData;
}

export default function ProjectPresentation({
  project,
}: ProjectPresentationProps) {
  const diagramEntries = useMemo(
    () =>
      [
        {
          key: "block-diagram",
          title: "Block Diagram",
          diagram: project.blockDiagram,
          description: "High-level system boundaries and major data flow.",
        },
        {
          key: "component-diagram",
          title: "Component Diagram",
          diagram: project.componentDiagram,
          description: "Core modules, responsibilities, and integrations.",
        },
        {
          key: "sequence-diagram",
          title: "Sequence Diagram",
          diagram: project.sequenceDiagram,
          description: "Runtime interaction flow across the stack.",
        },
      ].filter((entry) => entry.diagram.trim().length > 0),
    [project.blockDiagram, project.componentDiagram, project.sequenceDiagram],
  );
  const [activeDiagramKey, setActiveDiagramKey] = useState<string | undefined>(
    diagramEntries[0]?.key,
  );
  const diagramItems = useMemo<MediaCyclerItem[]>(
    () =>
      diagramEntries.map((entry) => ({
        key: entry.key,
        title: entry.title,
        description: entry.description,
        mediaType: "diagram",
        mediaUrl: entry.diagram,
        onSelect: () => {
          setActiveDiagramKey(entry.key);
        },
        panelSx: {
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        },
        assetFrameSx: {
          width: "100%",
          minHeight: { xs: 300, md: 400 },
          height: { xs: 300, md: 400 },
        },
        diagramProps: {
          height: "100%",
          width: "100%",
          showToolbar: true,
          showDots: false,
        },
      })),
    [diagramEntries],
  );

  useEffect(() => {
    setActiveDiagramKey(diagramEntries[0]?.key);
  }, [diagramEntries]);

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
              <Box
                sx={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {project.demoGifUrl && (
                  <ImageLightbox
                    src={withBasePath(project.demoGifUrl)}
                    alt={`${project.project} demo`}
                    title={`${project.project} demo`}
                    triggerSx={{ width: "100%" }}
                  >
                    <Image
                      src={withBasePath(project.demoGifUrl)}
                      alt={`${project.project} demo`}
                      width={800}
                      height={450}
                      style={{ width: "100%", height: "auto", borderRadius: 8 }}
                    />
                  </ImageLightbox>
                )}
                {project.demoVideoUrl && (
                  <VideoLightbox
                    src={withBasePath(project.demoVideoUrl)}
                    title={`${project.project} demo video`}
                    controls
                    playsInline
                    previewVideoSx={{ width: "100%", borderRadius: 1 }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </PortfolioPanel>
      

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          
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
          
        </Grid>
        <Grid item xs={12} md={6}>
          
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
          
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {diagramItems.length ? (
          <Grid item xs={12}>
            <PortfolioPanel>
              <Typography variant="h5" gutterBottom>
                Architecture Diagrams
              </Typography>
              <MediaCycler
                items={diagramItems}
                singlePanel
                singlePanelActiveKey={activeDiagramKey}
                showChevronNavigation
                loopNavigation={diagramItems.length > 1}
                loopNavigationLabel="Loop architecture diagrams"
                stackSx={{ minHeight: { xs: 300, md: 400 } }}
              />
            </PortfolioPanel>
          </Grid>
        ) : null}
      </Grid>
    </Box>
  );
}
