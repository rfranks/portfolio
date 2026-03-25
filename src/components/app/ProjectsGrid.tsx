import Image from "next/image";
import * as resumeData from "@/consts/resumeData";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";
import { withBasePath } from "@/utils/basePath";
import { CardHeader } from "@mui/material";
import OpenInNew from "@mui/icons-material/OpenInNew";
import AccoladesCarousel from "@/components/app/AccoladesCarousel";
import Box from "@mui/material/Box";
import Chip from "@/components/fabric/Chip";

const projectSectionMarks = [
  {
    src: "/dna/images/geneboard_banner.png",
    alt: "GeneBoard banner",
    className:
      "-left-6 top-2 w-36 rotate-[-10deg] lg:-left-4 lg:top-4 lg:w-40",
    imageClassName: "h-auto w-full object-contain",
    width: 260,
    height: 78,
  },
  {
    src: "/logo192.png",
    alt: "Bookworm logo",
    className:
      "left-52 top-0 h-16 w-16 rotate-[8deg] lg:left-64 lg:h-20 lg:w-20",
    imageClassName: "h-full w-full rounded-2xl object-contain",
    width: 192,
    height: 194,
  },
  {
    src: "/assets/titles/warbirds_title.png",
    alt: "Warbirds title",
    className:
      "right-0 top-12 w-40 rotate-[-5deg] lg:w-48",
    imageClassName: "h-auto w-full object-contain",
    width: 220,
    height: 80,
  },
];

function renderProjectAccent(href: string, projectName: string) {
  if (href === "/dna") {
    return (
      <Box className="pointer-events-none absolute bottom-5 right-4 opacity-[0.1] transition-all duration-500 group-hover:translate-y-[-2px] group-hover:opacity-[0.18]">
        <Image
          src={withBasePath("/dna/images/geneboard_banner.png")}
          alt={`${projectName} watermark`}
          width={240}
          height={72}
          className="h-auto w-52 object-contain"
        />
      </Box>
    );
  }

  if (href === "/warbirds") {
    return (
      <Box className="pointer-events-none absolute bottom-5 right-4 opacity-[0.12] transition-all duration-500 group-hover:translate-y-[-2px] group-hover:opacity-[0.2]">
        <Image
          src={withBasePath("/assets/titles/warbirds_title.png")}
          alt={`${projectName} watermark`}
          width={240}
          height={88}
          className="h-auto w-48 object-contain"
        />
      </Box>
    );
  }

  if (href === "/blackjack") {
    return (
      <Box className="pointer-events-none absolute bottom-3 right-3 h-36 w-40 opacity-[0.16] transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-[0.24]">
        <Image
          src={withBasePath("/assets/cards/PNG/Cards (medium)/card_back.png")}
          alt="Playing card back"
          width={128}
          height={179}
          className="absolute left-0 top-5 h-28 w-auto rounded-lg object-contain drop-shadow-lg"
        />
        <Image
          src={withBasePath("/assets/cards/PNG/Cards (medium)/card_spades_J.png")}
          alt="Jack of spades"
          width={128}
          height={179}
          className="absolute left-7 top-2 h-28 w-auto rounded-lg object-contain drop-shadow-lg"
        />
        <Image
          src={withBasePath("/assets/cards/PNG/Cards (medium)/card_spades_A.png")}
          alt="Ace of spades"
          width={128}
          height={179}
          className="absolute left-14 top-0 h-28 w-auto rounded-lg object-contain drop-shadow-lg"
        />
      </Box>
    );
  }

  if (href === "/bookworm") {
    return (
      <Box className="pointer-events-none absolute bottom-5 right-5 opacity-[0.08] transition-opacity duration-500 group-hover:opacity-[0.14]">
        <Image
          src={withBasePath("/logo192.png")}
          alt={`${projectName} watermark`}
          width={192}
          height={194}
          className="h-28 w-28 rounded-3xl object-contain"
        />
      </Box>
    );
  }

  if (href === "/aisummary" || href === "/patientlistpodcasts") {
    return (
      <Box className="pointer-events-none absolute bottom-5 right-5 opacity-[0.12] transition-all duration-500 group-hover:translate-y-[-2px] group-hover:opacity-[0.2]">
        <Image
          src={withBasePath("/commure.jpeg")}
          alt="Commure watermark"
          width={240}
          height={240}
          className="h-28 w-28 rounded-3xl object-contain"
        />
      </Box>
    );
  }

  if (href === "/patientlist" || href === "/assignmentlist") {
    return (
      <Box className="pointer-events-none absolute bottom-5 right-5 opacity-[0.12] transition-all duration-500 group-hover:translate-y-[-2px] group-hover:opacity-[0.2]">
        <Image
          src={withBasePath("/patientkeeper.png")}
          alt="PatientKeeper watermark"
          width={280}
          height={140}
          className="h-auto w-56 object-contain"
        />
      </Box>
    );
  }

  return null;
}

export default function ProjectsGrid() {
  const sortedProjects = [...resumeData.projects].sort((left, right) =>
    left.name.localeCompare(right.name)
  );

  return (
    <FadeInSection>
      <TronPaper className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-36 overflow-hidden md:block">
          {projectSectionMarks.map((mark) => (
            <div
              key={mark.src}
              className={`absolute rounded-[28px] border border-white/10 bg-white/5 p-4 opacity-30 blur-[0.2px] transition-transform duration-500 ${mark.className}`}
            >
              <Image
                src={withBasePath(mark.src)}
                alt={mark.alt}
                width={mark.width}
                height={mark.height}
                className={mark.imageClassName}
              />
            </div>
          ))}
          <div className="absolute right-28 top-2 h-28 w-28 rotate-[10deg] opacity-35 transition-transform duration-500">
            <Image
              src={withBasePath("/assets/cards/PNG/Cards (medium)/card_back.png")}
              alt="Playing card back"
              width={110}
              height={154}
              className="absolute left-0 top-3 h-24 w-auto rounded-lg object-contain drop-shadow-xl"
            />
            <Image
              src={withBasePath("/assets/cards/PNG/Cards (medium)/card_spades_J.png")}
              alt="Jack of spades"
              width={110}
              height={154}
              className="absolute left-6 top-1 h-24 w-auto rounded-lg object-contain drop-shadow-xl"
            />
            <Image
              src={withBasePath("/assets/cards/PNG/Cards (medium)/card_spades_A.png")}
              alt="Ace of spades"
              width={110}
              height={154}
              className="absolute left-12 top-0 h-24 w-auto rounded-lg object-contain drop-shadow-xl"
            />
          </div>
        </div>
        <div className="relative z-[1] mb-6 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Typography variant="h6" gutterBottom>
              Projects
            </Typography>
            <Typography variant="body2" color="text.secondary" className="max-w-2xl">
              Selected work across AI-assisted systems, full-stack product engineering,
              and experimental applications.
            </Typography>
          </div>
        </div>
        <Grid
          container
          spacing={2}
          alignItems="stretch"
        >
          {sortedProjects.map((project, index) => (
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
                {renderProjectAccent(project.href, project.name)}
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
                  {project.image && (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <Image
                        src={project.image}
                        alt={`${project.name} screenshot`}
                        width={400}
                        height={300}
                        priority={index === 0}
                        style={{ width: "100%", height: "auto" }}
                        className="transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                      />
                    </div>
                  )}
                  <Typography variant="body2" color="text.secondary" className="leading-6">
                    {project.description}
                  </Typography>
                  {project.interestsMeWhy && (
                    <Box className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-white/[0.03]">
                      <Typography variant="subtitle1" gutterBottom>
                        Why this interests me...
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="leading-6">
                        {project.interestsMeWhy}
                      </Typography>
                    </Box>
                  )}
                  {project.accolades && project.accolades.length > 0 && (
                    <Box className="rounded-2xl border border-white/10 bg-white/5 p-4 dark:bg-white/[0.03]">
                      <Typography variant="subtitle1" gutterBottom>
                        Accolades
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
                    target={
                      project.href === "/blasteroids" ? "_blank" : undefined
                    }
                    rel={
                      project.href === "/blasteroids"
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    Launch
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TronPaper>
    </FadeInSection>
  );
}
