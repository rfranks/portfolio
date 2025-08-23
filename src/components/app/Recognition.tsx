import * as resumeData from "@/consts/resumeData";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Section from "./Section";

export default function Recognition() {
    return (
      <Section>
        <Typography variant="h6" gutterBottom>
          Recognition
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {resumeData.recognition.snippets.map((snippet, idx) => (
            <Grid item xs={12} sm={4} key={idx}>
              <Card variant="outlined">
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    {snippet}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Typography variant="h6" gutterBottom>
          Recommendations
        </Typography>
        <Grid container spacing={2}>
          {resumeData.recognition.recommendations.map((rec) => (
            <Grid item xs={12} key={`${rec.name}-${rec.date}`}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    {rec.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rec.title} · {rec.date}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rec.relationship}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, fontStyle: "italic" }}>
                    {rec.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Section>
    );
  }

