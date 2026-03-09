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
import { CardHeader, Chip } from "@mui/material";
import AccoladesCarousel from "@/components/app/AccoladesCarousel";
import Box from "@mui/material/Box";

export default function ProjectsGrid() {
  return (
    <FadeInSection>
      <TronPaper>
        <Typography variant="h6" gutterBottom>
          Projects
        </Typography>
        <Grid
          container
          spacing={2}
          alignItems="stretch"
        >
          {resumeData.projects.map((project, index) => (
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
                sx={{
                  backgroundColor: "background.default",
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  width: "100%",
                }}
              >
                <CardHeader
                  action={
                    <Chip
                      label={project.type === "work" ? "Work" : "Personal"}
                      size="small"
                      color={project.type === "work" ? "primary" : "secondary"}
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
                >
                  {project.image && (
                    <Image
                      src={project.image}
                      alt={`${project.name} screenshot`}
                      width={400}
                      height={300}
                      priority={index === 0}
                      style={{ width: "100%", height: "auto" }}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {project.description}
                  </Typography>
                  {project.interestsMeWhy && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Why this interests me...
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.interestsMeWhy}
                      </Typography>
                    </Box>
                  )}
                  {project.accolades && project.accolades.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Accolades
                      </Typography>
                      <AccoladesCarousel accolades={project.accolades} />
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    href={withBasePath(project.href)}
                    color="secondary"
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
