import * as resumeData from "@/consts/resumeData";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Section from "./Section";

export default function ProjectsGrid() {
    return (
      <Section>
        <Typography variant="h6" gutterBottom>
          Projects
        </Typography>
        <Grid container spacing={2}>
          {resumeData.projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.href}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1">{project.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {project.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" href={project.href}>
                    Launch
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Section>
    );
  }
