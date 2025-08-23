import * as resumeData from "@/consts/resumeData";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TronPaper from "@/components/app/TronPaper";

export default function ProjectsGrid() {
  return (
    <TronPaper>
      <Typography variant="h6" gutterBottom>
        Projects
      </Typography>
      <Grid container spacing={2}>
        {resumeData.projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={project.href}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                backgroundColor: "background.default",
                borderColor: "primary.main",
                boxShadow: "0 0 6px rgba(0,240,255,0.3)",
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" color="primary.main">
                  {project.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {project.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" href={project.href} color="secondary">
                  Launch
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </TronPaper>
  );
}
