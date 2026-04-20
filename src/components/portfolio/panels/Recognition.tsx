import * as resumeData from "@/consts/resumeData";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import { ImageLightbox } from "@/components/shared";
import { MarkdownContent } from "@/components/shared";
import { withBasePath } from "@/utils/basePath";

export default function Recognition() {
  return (
    <PortfolioPanel>
      <Typography variant="h6" gutterBottom className="mb-4">
        Recognition
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {resumeData.recognition.snippets.map((snippet, idx) => (
          <Grid item xs={12} sm={4} key={idx}>
            <Card variant="outlined" className="h-full">
              <CardContent className="h-full">
                <MarkdownContent
                  content={snippet}
                  className="leading-6 italic"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Typography variant="h6" gutterBottom className="mb-4 mt-6">
        Recommendations
      </Typography>
      <Grid container spacing={2}>
        {resumeData.recognition.recommendations.map((rec) => (
          <Grid item xs={12} key={`${rec.name}-${rec.date}`}>
            <Card variant="outlined">
              <CardContent className="space-y-3">
                <ListItem alignItems="flex-start" disableGutters>
                  {rec.imageSrcUrl && (
                    <ListItemAvatar>
                      <ImageLightbox
                        src={withBasePath(rec.imageSrcUrl)}
                        alt={rec.name}
                        title={rec.name}
                        caption={`${rec.title} · ${rec.date}`}
                        triggerSx={{ borderRadius: "50%", lineHeight: 0 }}
                      >
                        <Avatar
                          alt={rec.name}
                          src={withBasePath(rec.imageSrcUrl)}
                        />
                      </ImageLightbox>
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    disableTypography
                    primary={
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="primary"
                      >
                        {rec.name}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {rec.title} · {rec.date}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rec.relationship}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <MarkdownContent
                  content={rec.text}
                  variant="body1"
                  className="leading-7 italic"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </PortfolioPanel>
  );
}
