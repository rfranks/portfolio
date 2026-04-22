import * as React from "react";
import Image from "next/image";
import OpenInNew from "@mui/icons-material/OpenInNew";
import AutoStoriesOutlined from "@mui/icons-material/AutoStoriesOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { ResumeData } from "@/consts/resumeData";
import SubsectionPager, {
  type SubsectionPagerItem,
} from "@/components/portfolio/layout/SubsectionPager";
import AccoladesCarousel from "@/components/portfolio/panels/AccoladesCarousel";
import Chip from "@/components/fabric/Chip";
import {
  ImageLightbox,
  MarkdownContent,
  MediaCycler,
  PortfolioPanelShell,
} from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
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
type ProjectEntry = ResumeData["projects"][number];
type ProjectsSection = ResumeData["projectsSection"];

function getProjectOptionImage(project: ProjectEntry): string | undefined {
  const watermark = project.watermark as ProjectVisual | null | undefined;
  if (!watermark) {
    return undefined;
  }

  if (watermark.kind === "image") {
    return withBasePath(watermark.src);
  }

  if (watermark.kind === "cardsFan") {
    const firstCard = watermark.cards[0];
    return firstCard?.src ? withBasePath(firstCard.src) : undefined;
  }

  return undefined;
}

function getProjectOptionShortText(project: ProjectEntry): string {
  const maybeShortText = (project as Record<string, unknown>).shortText;
  if (typeof maybeShortText === "string" && maybeShortText.trim()) {
    return maybeShortText.trim();
  }

  const fromDescription = project.description
    ?.split(/\n{2,}/)[0]
    ?.replace(/\s+/g, " ")
    ?.trim();
  if (fromDescription) {
    return fromDescription.length > 140
      ? `${fromDescription.slice(0, 137).trimEnd()}...`
      : fromDescription;
  }

  const fromInterests = project.interestsMeWhy
    ?.split(/\n{2,}/)[0]
    ?.replace(/\s+/g, " ")
    ?.trim();
  if (fromInterests) {
    return fromInterests.length > 140
      ? `${fromInterests.slice(0, 137).trimEnd()}...`
      : fromInterests;
  }

  return "";
}

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

function renderProjectContent(
  project: ProjectEntry,
  sectionLabels: Pick<
    ProjectsSection,
    "interestHeading" | "accoladesHeading" | "launchLabel"
  >,
) {
  return (
    <Box
      className="relative overflow-hidden rounded-[24px] p-4 md:p-5"
      sx={{
        width: "100%",
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: "transparent",
        backdropFilter: "none",
      }}
    >
      {project.watermark
        ? renderVisual(
            project.watermark as ProjectVisual,
            `${project.href}-watermark-cycle`,
          )
        : null}
      <Box sx={{ display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 1 }}>
        <Chip
          label={project.type === "work" ? "Work" : "Personal"}
          size="small"
          variant="outlined"
          color={project.type === "work" ? "primary" : "secondary"}
          sx={{ fontWeight: 600, flexShrink: 0 }}
        />
      </Box>

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
              {sectionLabels.interestHeading}
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
              {sectionLabels.accoladesHeading}
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
          {sectionLabels.launchLabel}
        </Button>
      </Box>
    </Box>
  );
}

type ProjectsGridProps = {
  topRail?: React.ReactNode;
};

export default function ProjectsGrid({ topRail }: ProjectsGridProps) {
  const { projects, projectsSection } = useResumeData();
  const sortedProjects = React.useMemo(
    () =>
      [...projects].sort((left, right) => left.name.localeCompare(right.name)),
    [projects],
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
        customContent: renderProjectContent(project, {
          interestHeading: projectsSection.interestHeading,
          accoladesHeading: projectsSection.accoladesHeading,
          launchLabel: projectsSection.launchLabel,
        }),
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
          px: { xs: 0.75, md: 1 },
          py: 0.5,
        },
        customContentSx: {
          width: "100%",
          minHeight: 0,
          height: "100%",
        },
      })),
    [projectsSection, sortedProjects],
  );
  const projectPickerItems = React.useMemo<SubsectionPagerItem[]>(
    () =>
      sortedProjects.map((project) => {
        const optionImageSrc = getProjectOptionImage(project);
        const optionSubtitle = getProjectOptionShortText(project);
        return {
          key: project.href,
          title: project.name,
          optionTitle: project.name,
          optionSubtitle: optionSubtitle || undefined,
          optionTypeChipLabel: project.type === "work" ? "Work" : "Personal",
          optionTypeChipColor: project.type === "work" ? "primary" : "secondary",
          optionImageSrc,
          optionImageAlt: `${project.name} preview`,
          selectedImageSrc: optionImageSrc,
          selectedImageAlt: `${project.name} preview`,
          selectedIcon: optionImageSrc ? undefined : (
            <AutoStoriesOutlined fontSize="small" />
          ),
          optionIcon: optionImageSrc ? undefined : (
            <AutoStoriesOutlined fontSize="small" />
          ),
        };
      }),
    [sortedProjects],
  );
  const activeProjectIndex = React.useMemo(
    () => projectItems.findIndex((item) => item.key === activeProjectKey),
    [activeProjectKey, projectItems],
  );
  const hasMultipleProjectItems = projectItems.length > 1;

  const handlePreviousProject = React.useCallback(() => {
    if (!hasMultipleProjectItems) {
      return;
    }

    if (activeProjectIndex <= 0) {
      setActiveProjectKey(projectItems[projectItems.length - 1]?.key);
      return;
    }

    setActiveProjectKey(projectItems[activeProjectIndex - 1]?.key);
  }, [activeProjectIndex, hasMultipleProjectItems, projectItems]);

  const handleNextProject = React.useCallback(() => {
    if (!hasMultipleProjectItems) {
      return;
    }

    if (activeProjectIndex >= projectItems.length - 1) {
      setActiveProjectKey(projectItems[0]?.key);
      return;
    }

    setActiveProjectKey(projectItems[activeProjectIndex + 1]?.key);
  }, [activeProjectIndex, hasMultipleProjectItems, projectItems]);

  return (
    <PortfolioPanelShell
      panelClassName="relative overflow-hidden"
      topRail={topRail}
      topRailSx={{ position: "relative", zIndex: 6 }}
      contentSx={{
        minHeight: 0,
        flex: "1 1 auto",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
      className="relative overflow-hidden"
      sx={{
        minHeight: 0,
        flex: "1 1 auto",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
      {hasMultipleProjectItems ? (
        <Box sx={{ py: 1.25 }}>
          <SubsectionPager
            menuId="project-item-selector-menu"
            items={projectPickerItems}
            currentKey={activeProjectKey}
            selectedValueAsTitle
            selectedVisualSize={38}
            selectedIconFontSize="1.35rem"
            previousAriaLabel="Previous project"
            nextAriaLabel="Next project"
            selectorAriaLabel="Open project selector"
            onSelect={setActiveProjectKey}
            onPrevious={handlePreviousProject}
            onNext={handleNextProject}
          />
        </Box>
      ) : null}

      <Box sx={{ minHeight: 0, flex: "1 1 auto", overflow: "hidden", pt: 0.5 }}>
        <MediaCycler
          items={projectItems}
          singlePanel
          singlePanelActiveKey={activeProjectKey}
          showChevronNavigation={false}
          stackSx={{
            minHeight: 0,
            height: "100%",
          }}
        />
      </Box>
      </Box>
    </PortfolioPanelShell>
  );
}
