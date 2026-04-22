"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import IntegrationInstructionsOutlined from "@mui/icons-material/IntegrationInstructionsOutlined";
import OndemandVideoOutlined from "@mui/icons-material/OndemandVideoOutlined";
import SchemaOutlined from "@mui/icons-material/SchemaOutlined";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import SubsectionPager, {
  type SubsectionPagerItem,
} from "@/components/portfolio/layout/SubsectionPager";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import { MarkdownContent, MediaCycler, PanelFrame } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import type { ProjectData } from "@/types/components/portfolio";
import { withBasePath } from "@/utils/basePath";
export type { ProjectData, Technology } from "@/types/components/portfolio";

interface ProjectPresentationProps {
  project: ProjectData;
}

type ProjectSection = {
  key: "overview" | "demo" | "technologies" | "specifications" | "diagrams";
  title: string;
  subtitle: string;
  icon: ReactNode;
};

const buildSectionLabel = (index: number, title: string) => `${index + 1}. ${title}`;

export default function ProjectPresentation({ project }: ProjectPresentationProps) {
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
  const overviewMarkdownContent = useMemo(() => {
    const markdownSections: string[] = [];

    if (project.wowFactor?.trim()) {
      markdownSections.push(`> ${project.wowFactor.trim()}`);
    }

    if (project.description?.trim()) {
      markdownSections.push(project.description.trim());
    }

    const topTechnologies = project.technologiesUsed.slice(0, 8);
    if (topTechnologies.length > 0) {
      const technologyLines = topTechnologies.map((tech) =>
        tech.url ? `- [${tech.name}](${tech.url})` : `- ${tech.name}`,
      );
      markdownSections.push("### Tech Snapshot", technologyLines.join("\n"));
    }

    const specificationKeys = Object.keys(project.specifications || {}).slice(0, 8);
    if (specificationKeys.length > 0) {
      markdownSections.push(
        "### Implementation Scope",
        specificationKeys.map((key) => `- ${key}`).join("\n"),
      );
    }

    return markdownSections.filter(Boolean).join("\n\n");
  }, [project.description, project.specifications, project.technologiesUsed, project.wowFactor]);
  const overviewItems = useMemo<MediaCyclerItem[]>(() => {
    const items: MediaCyclerItem[] = [];

    items.push({
      key: "overview-details",
      title: "",
      mediaType: "custom",
      mediaUrl: "",
      customContent: (
        <MarkdownContent
          content={overviewMarkdownContent}
          variant="body1"
          sx={{
            "& p": { mb: 1.25, lineHeight: 1.55 },
            "& h3": { mt: 1.2, mb: 0.6, fontSize: "1.02rem", fontWeight: 700 },
            "& ul": { my: 0.4, pl: 2.3 },
            "& li": { mb: 0.35 },
          }}
        />
      ),
      panelSx: {
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      },
      assetFrameSx: {
        width: "100%",
        minHeight: 0,
        height: "100%",
      },
      customContentSx: {
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      },
    });

    return items;
  }, [overviewMarkdownContent]);
  const demoItems = useMemo<MediaCyclerItem[]>(() => {
    const items: MediaCyclerItem[] = [];

    if (project.demoGifUrl) {
      items.push({
        key: "demo-image",
        title: "",
        mediaType: "image",
        mediaUrl: withBasePath(project.demoGifUrl),
        mediaAlt: `${project.project} demo`,
        mediaLightboxTitle: `${project.project} demo`,
        panelSx: {
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        },
        assetFrameSx: {
          width: "100%",
          minHeight: 0,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        imageWidth: 800,
        imageHeight: 450,
        imageStyle: {
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          borderRadius: 0,
        },
      });
    }

    if (project.demoVideoUrl) {
      items.push({
        key: "demo-video",
        title: "",
        mediaType: "video",
        mediaUrl: withBasePath(project.demoVideoUrl),
        mediaLightboxTitle: `${project.project} demo video`,
        controls: true,
        playsInline: true,
        panelSx: {
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        },
        assetFrameSx: {
          width: "100%",
          minHeight: 0,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        previewVideoSx: {
          width: "100%",
          height: "100%",
          maxHeight: "100%",
          maxWidth: "100%",
          objectFit: "contain",
          borderRadius: 0,
        },
      });
    }

    return items;
  }, [project.demoGifUrl, project.demoVideoUrl, project.project]);
  const [activeOverviewMediaKey, setActiveOverviewMediaKey] = useState<string | undefined>(
    overviewItems[0]?.key,
  );
  const [activeDemoMediaKey, setActiveDemoMediaKey] = useState<string | undefined>(
    demoItems[0]?.key,
  );
  const projectPresentationNavigationControlSx: SxProps<Theme> = (theme) => ({
    color: theme.palette.common.black,
    borderColor: theme.palette.common.black,
    bgcolor: theme.palette.common.white,
    "&:hover": {
      bgcolor: theme.palette.common.white,
    },
    "&.Mui-disabled": {
      color: alpha(theme.palette.common.black, 0.36),
      borderColor: alpha(theme.palette.common.black, 0.36),
      bgcolor: alpha(theme.palette.common.white, 0.8),
    },
  });
  const projectPresentationExpandControlSx: SxProps<Theme> = (theme) => ({
    color: theme.palette.common.black,
    borderColor: theme.palette.common.black,
    bgcolor: theme.palette.common.white,
    "&:hover": {
      bgcolor: theme.palette.common.white,
    },
    "&.Mui-disabled": {
      color: alpha(theme.palette.common.black, 0.36),
      borderColor: alpha(theme.palette.common.black, 0.36),
      bgcolor: alpha(theme.palette.common.white, 0.8),
    },
  });
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
          minHeight: { xs: 300, md: 420 },
          height: { xs: 300, md: 420 },
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
  useEffect(() => {
    setActiveOverviewMediaKey(overviewItems[0]?.key);
  }, [overviewItems]);
  useEffect(() => {
    setActiveDemoMediaKey(demoItems[0]?.key);
  }, [demoItems]);

  const sections = useMemo<ProjectSection[]>(() => {
    const nextSections: ProjectSection[] = [
      {
        key: "overview",
        title: "Overview",
        subtitle: "Project narrative and implementation snapshot",
        icon: <AutoAwesomeOutlined fontSize="small" />,
      },
      ...(demoItems.length > 0
        ? [
            {
              key: "demo" as const,
              title: "Demo",
              subtitle: "Visual walkthrough",
              icon: <OndemandVideoOutlined fontSize="small" />,
            },
          ]
        : []),
      {
        key: "technologies",
        title: "Technologies",
        subtitle: "Stack and tools used",
        icon: <CategoryOutlined fontSize="small" />,
      },
      {
        key: "specifications",
        title: "Specifications",
        subtitle: "Structure and implementation details",
        icon: <IntegrationInstructionsOutlined fontSize="small" />,
      },
    ];

    if (diagramItems.length > 0) {
      nextSections.push({
        key: "diagrams",
        title: "Architecture",
        subtitle: "Diagram walkthrough",
        icon: <SchemaOutlined fontSize="small" />,
      });
    }

    return nextSections;
  }, [demoItems.length, diagramItems.length]);

  const [activeSectionKey, setActiveSectionKey] = useState<ProjectSection["key"]>(
    sections[0]?.key ?? "overview",
  );

  useEffect(() => {
    if (!sections.some((section) => section.key === activeSectionKey)) {
      setActiveSectionKey(sections[0]?.key ?? "overview");
    }
  }, [activeSectionKey, sections]);

  const activeSectionIndex = Math.max(
    0,
    sections.findIndex((section) => section.key === activeSectionKey),
  );
  const activeSection = sections[activeSectionIndex] ?? sections[0];
  const hasMultipleSections = sections.length > 1;

  const handlePreviousSection = () => {
    if (!hasMultipleSections) {
      return;
    }

    if (activeSectionIndex <= 0) {
      setActiveSectionKey(sections[sections.length - 1]?.key ?? sections[0]!.key);
      return;
    }

    setActiveSectionKey(sections[activeSectionIndex - 1]!.key);
  };

  const handleNextSection = () => {
    if (!hasMultipleSections) {
      return;
    }

    if (activeSectionIndex >= sections.length - 1) {
      setActiveSectionKey(sections[0]!.key);
      return;
    }

    setActiveSectionKey(sections[activeSectionIndex + 1]!.key);
  };

  const pagerItems = useMemo<SubsectionPagerItem[]>(
    () =>
      sections.map((section, index) => ({
        key: section.key,
        title: section.title,
        selectedTitle: section.title,
        selectedIcon: section.icon,
        optionTitle: buildSectionLabel(index, section.title),
        optionSubtitle: section.subtitle,
        optionIcon: section.icon,
      })),
    [sections],
  );

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
      return Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => (
        <Accordion key={childKey} sx={{ backgroundColor: "transparent" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{childKey}</Typography>
          </AccordionSummary>
          <AccordionDetails>{renderSpecification(childValue)}</AccordionDetails>
        </Accordion>
      ));
    }

    return <MarkdownContent content={String(value)} sx={{ "& p": { mb: 0 } }} />;
  };

  const renderOverview = () => (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <MediaCycler
        items={overviewItems.map((item) => ({
          ...item,
          onSelect: () => {
            setActiveOverviewMediaKey(item.key);
          },
        }))}
        singlePanel
        singlePanelActiveKey={activeOverviewMediaKey}
        allowSwipe
        showChevronNavigation={overviewItems.length > 1}
        loopNavigation={overviewItems.length > 1}
        navigationControlSx={projectPresentationNavigationControlSx}
        expandControlSx={projectPresentationExpandControlSx}
        stackSx={{ minHeight: 0, height: "100%" }}
      />
    </Box>
  );

  const renderTechnologies = () => (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <List
        dense
        sx={{
          mt: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          columnGap: 2,
          rowGap: 0,
          overflow: "hidden",
        }}
      >
        {project.technologiesUsed.map((tech) => (
          <ListItem key={tech.name} sx={{ py: 0.25 }}>
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
    </Box>
  );

  const renderDemo = () => (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      {demoItems.length > 0 ? (
        <MediaCycler
          items={demoItems.map((item) => ({
            ...item,
            onSelect: () => {
              setActiveDemoMediaKey(item.key);
            },
          }))}
          singlePanel
          singlePanelActiveKey={activeDemoMediaKey}
          allowSwipe
          showChevronNavigation={demoItems.length > 1}
          loopNavigation={demoItems.length > 1}
          navigationControlSx={projectPresentationNavigationControlSx}
          expandControlSx={projectPresentationExpandControlSx}
          stackSx={{ minHeight: 0, height: "100%" }}
        />
      ) : null}
    </Box>
  );

  const renderSpecifications = () => (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box sx={{ minHeight: 0, overflow: "hidden" }}>
        {Object.entries(project.specifications).map(([key, value]) => (
          <Accordion key={key} sx={{ backgroundColor: "transparent", my: 0.5 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{key}</Typography>
            </AccordionSummary>
            <AccordionDetails>{renderSpecification(value)}</AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );

  const renderDiagrams = () => (
    <Box
      sx={{
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        overflow: "hidden",
      }}
    >
      <Box sx={{ minHeight: 0, flex: "1 1 auto" }}>
        <MediaCycler
          items={diagramItems}
          singlePanel
          singlePanelActiveKey={activeDiagramKey}
          allowSwipe
          showChevronNavigation
          loopNavigation={diagramItems.length > 1}
          navigationControlSx={projectPresentationNavigationControlSx}
          stackSx={{ minHeight: 0, height: "100%" }}
        />
      </Box>
    </Box>
  );

  const renderActiveSection = () => {
    switch (activeSectionKey) {
      case "overview":
        return renderOverview();
      case "demo":
        return renderDemo();
      case "technologies":
        return renderTechnologies();
      case "specifications":
        return renderSpecifications();
      case "diagrams":
        return renderDiagrams();
      default:
        return renderOverview();
    }
  };

  return (
    <PortfolioPanel
      sx={{
        px: 0,
        py: { xs: 1, md: 1.25 },
        mb: "0 !important",
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <PanelFrame
        useNegativeTopRailMargins
        topRailSx={{
          minHeight: { xs: 78, md: 86 },
          display: "flex",
          alignItems: "center",
        }}
        topRail={
          hasMultipleSections ? (
            <Box sx={{ width: "100%" }}>
              <SubsectionPager
                menuId="project-showcase-section-selector"
                items={pagerItems}
                currentKey={activeSectionKey}
                selectedValueAsTitle
                selectedVisualSize={34}
                selectedIconFontSize="1.15rem"
                previousAriaLabel="Previous project section"
                nextAriaLabel="Next project section"
                selectorAriaLabel="Open project section selector"
                onSelect={(key) => setActiveSectionKey(key as ProjectSection["key"])}
                onPrevious={handlePreviousSection}
                onNext={handleNextSection}
              />
            </Box>
          ) : (
            <Box sx={{ px: { xs: 2.5, md: 3 }, py: 1.25 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {activeSection?.icon}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {activeSection?.title ?? "Overview"}
                </Typography>
              </Stack>
            </Box>
          )
        }
        rootSx={{ minHeight: 0, height: "100%" }}
      >
        <Box
          sx={{
            minHeight: 0,
            flex: "1 1 auto",
            height: "100%",
            overflow: "hidden",
            overflowX: "hidden",
          }}
        >
          {renderActiveSection()}
        </Box>
      </PanelFrame>
    </PortfolioPanel>
  );
}
