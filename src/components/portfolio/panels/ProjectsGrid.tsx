import Image from "next/image";
import { projects, projectsSection } from "@/consts/resumeData";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import ImageLightbox from "@/components/shared/ImageLightbox";
import MarkdownContent from "@/components/shared/MarkdownContent";
import { withBasePath } from "@/utils/basePath";
import { CardHeader } from "@mui/material";
import OpenInNew from "@mui/icons-material/OpenInNew";
import AccoladesCarousel from "@/components/portfolio/panels/AccoladesCarousel";
import Box from "@mui/material/Box";
import Chip from "@/components/fabric/Chip";

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

export default function ProjectsGrid() {
  const sortedProjects = [...projects].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  return (
    
      <PortfolioPanel className="relative overflow-hidden">
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
        <div className="relative z-[1] mb-6 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
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
          </div>
        </div>
        <Grid container spacing={2} alignItems="stretch">
          {sortedProjects.map((project) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={6}
              lg={6}
              key={project.href}
              sx={{ display: "flex" }}
            >
              <Card
                variant="outlined"
                className="group relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  width: "100%",
                }}
              >
                <Box className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400/70 via-blue-500/70 to-teal-400/70 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                {project.watermark &&
                  renderVisual(
                    project.watermark as ProjectVisual,
                    `${project.href}-watermark`,
                  )}
                <CardHeader
                  action={
                    <Chip
                      label={project.type === "work" ? "Work" : "Personal"}
                      size="small"
                      variant="outlined"
                      color={project.type === "work" ? "primary" : "secondary"}
                      sx={{ fontWeight: 600 }}
                    />
                  }
                  title={project.name}
                  titleTypographyProps={{
                    variant: "h6",
                    component: "h2",
                    color: "text.primary",
                  }}
                />
                <CardContent
                  sx={{ flexGrow: 1, maxHeight: "400px", overflow: "auto" }}
                  className="space-y-4"
                >
                  <MarkdownContent
                    content={project.description}
                    className="leading-6"
                  />
                  {project.interestsMeWhy && (
                    <Box className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-white/[0.03]">
                      <Typography variant="subtitle1" gutterBottom>
                        {projectsSection.interestHeading}
                      </Typography>
                      <MarkdownContent
                        content={project.interestsMeWhy}
                        className="leading-6"
                      />
                    </Box>
                  )}
                  {project.accolades && project.accolades.length > 0 && (
                    <Box className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-white/[0.03]">
                      <Typography variant="subtitle1" gutterBottom>
                        {projectsSection.accoladesHeading}
                      </Typography>
                      <AccoladesCarousel accolades={project.accolades} />
                    </Box>
                  )}
                </CardContent>
                <CardActions className="justify-end px-4 pb-4">
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
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </PortfolioPanel>
    
  );
}
