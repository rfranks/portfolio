import * as React from "react";
import Image from "next/image";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { projects, projectsSection } from "@/consts/resumeData";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import AccoladesCarousel from "@/components/portfolio/panels/AccoladesCarousel";
import Chip from "@/components/fabric/Chip";
import { ImageLightbox, MarkdownContent, MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { withBasePath } from "@/utils/basePath";

type ImageVisual = {
  kind: "image";
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imageClassName?: string;
  containerClassName?: string;
};

type CardsFanVisual = {
  kind: "cardsFan";
  className?: string;
  containerClassName?: string;
  cards: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }>;
};

type ProjectVisual = ImageVisual | CardsFanVisual;
type ProjectEntry = (typeof projects)[number];

function renderVisual(visual: ProjectVisual, key: string) {
  if (visual.kind === "image") {
    const Wrapper = visual.containerClassName ? Box : "div";
    const imageSrc = withBasePath(visual.src);

    return (
      <Wrapper
        key={key}
        className={visual.containerClassName ?? visual.className ?? undefined}
      >
        <ImageLightbox
          src={imageSrc}
          alt={visual.alt}
          title={visual.alt}
          caption="Project visual"
          triggerSx={{ display: "block", width: "100%" }}
        >
          <Image
            src={imageSrc}
            alt={visual.alt}
            width={visual.width}
            height={visual.height}
            className={visual.imageClassName ?? visual.className ?? undefined}
          />
        </ImageLightbox>
      </Wrapper>
    );
  }

  return (
    <Box
      key={key}
      className={visual.containerClassName ?? visual.className ?? undefined}
    >
      {visual.cards.map((card) => (
        <ImageLightbox
          key={`${key}-${card.src}-${card.alt}`}
          src={withBasePath(card.src)}
          alt={card.alt}
          title={card.alt}
          caption="Project visual"
          triggerSx={{ display: "inline-block" }}
        >
          <Image
            src={withBasePath(card.src)}
            alt={card.alt}
            width={card.width}
            height={card.height}
            className={card.className}
          />
        </ImageLightbox>
      ))}
    </Box>
  );
}

function renderProjectContent(project: ProjectEntry) {
  return (
    <Box
      className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-4 md:p-5"
      sx={{
        width: "100%",
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400/70 via-blue-500/70 to-teal-400/70 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
      {project.watermark
        ? renderVisual(
            project.watermark as ProjectVisual,
            `${project.href}-watermark-cycle`,
          )
        : null}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        sx={{ minWidth: 0, position: "relative", zIndex: 1 }}
      >
        <Typography
          variant="h6"
          component="h3"
          color="text.primary"
          sx={{ minWidth: 0, pr: 1 }}
        >
          {project.name}
        </Typography>
        <Chip
          label={project.type === "work" ? "Work" : "Personal"}
          size="small"
          variant="outlined"
          color={project.type === "work" ? "primary" : "secondary"}
          sx={{ fontWeight: 600, flexShrink: 0 }}
        />
      </Stack>

      <Box
        sx={{
          minHeight: 0,
          flex: "1 1 auto",
          overflowY: "auto",
          pr: 0.5,
          position: "relative",
          zIndex: 1,
        }}
        className="space-y-4"
      >
        <MarkdownContent content={project.description} className="leading-6" />
        {project.interestsMeWhy ? (
          <Box
            className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-white/[0.03]"
            sx={{
              mt: 1.5,
              mb: project.accolades && project.accolades.length > 0 ? 2 : 0,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              {projectsSection.interestHeading}
            </Typography>
            <MarkdownContent
              content={project.interestsMeWhy}
              className="leading-6"
            />
          </Box>
        ) : null}
        {project.accolades && project.accolades.length > 0 ? (
          <Box
            className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-white/[0.03]"
            sx={{ mt: project.interestsMeWhy ? 0.5 : 0 }}
          >
            <Typography variant="subtitle1" gutterBottom>
              {projectsSection.accoladesHeading}
            </Typography>
            <AccoladesCarousel accolades={project.accolades} />
          </Box>
        ) : null}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: "auto" }}>
        <Button
          size="small"
          href={withBasePath(project.href)}
          color="secondary"
          variant="outlined"
          className="transition-transform duration-200 ease-out hover:-translate-y-0.5"
          sx={{ borderRadius: "999px" }}
          endIcon={<OpenInNew fontSize="small" />}
          target="_blank"
          rel="noopener noreferrer"
        >
          {projectsSection.launchLabel}
        </Button>
      </Box>
    </Box>
  );
}

export default function ProjectsGrid() {
  const sortedProjects = React.useMemo(
    () =>
      [...projects].sort((left, right) => left.name.localeCompare(right.name)),
    [],
  );
  const [activeProjectKey, setActiveProjectKey] = React.useState<
    string | undefined
  >(sortedProjects[0]?.href);

  React.useEffect(() => {
    setActiveProjectKey(sortedProjects[0]?.href);
  }, [sortedProjects]);

  const projectItems = React.useMemo<MediaCyclerItem[]>(
    () =>
      sortedProjects.map((project) => ({
        key: project.href,
        title: "",
        description: undefined,
        mediaType: "project",
        mediaUrl: withBasePath(project.href),
        onSelect: () => setActiveProjectKey(project.href),
        customContent: renderProjectContent(project),
        panelSx: {
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          height: "100%",
        },
        assetFrameSx: {
          width: "100%",
          minHeight: 0,
          height: "100%",
          px: { xs: 7, md: 8 },
          py: 1,
        },
        customContentSx: {
          width: "100%",
          minHeight: 0,
          height: "100%",
        },
      })),
    [sortedProjects],
  );

  return (
    <PortfolioPanel
      className="relative overflow-hidden"
      sx={{
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-36 overflow-hidden md:block">
        {projectsSection.marks.map((mark, index) =>
          mark.kind === "image" ? (
            <div
              key={`${mark.src}-${index}`}
              className={`absolute rounded-[28px] border border-white/10 bg-white/5 p-4 opacity-30 blur-[0.2px] transition-transform duration-500 ${mark.className ?? ""}`}
            >
              {renderVisual(mark as ImageVisual, `projects-mark-${index}`)}
            </div>
          ) : (
            renderVisual(mark as CardsFanVisual, `projects-mark-${index}`)
          ),
        )}
      </div>
      <Box className="relative z-[1] mb-4 flex items-end justify-between gap-4">
        <Box className="max-w-2xl">
          <Typography variant="h6" gutterBottom>
            {projectsSection.title}
          </Typography>
          {projectsSection.descriptionLines.map((line) => (
            <Typography
              key={line}
              variant="body2"
              color="text.secondary"
              className="max-w-2xl"
            >
              {line}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box sx={{ minHeight: 0, flex: "1 1 auto", overflow: "hidden" }}>
        <MediaCycler
          items={projectItems}
          singlePanel
          singlePanelActiveKey={activeProjectKey}
          showChevronNavigation={projectItems.length > 1}
          loopNavigation={projectItems.length > 1}
          loopNavigationIcon="leftChevron"
          loopFromBeginning
          loopNavigationLabel="Loop projects"
          navigationControlSx={{
            top: 12,
            transform: "none",
          }}
          stackSx={{
            minHeight: 0,
            height: "100%",
          }}
        />
      </Box>
    </PortfolioPanel>
  );
}
