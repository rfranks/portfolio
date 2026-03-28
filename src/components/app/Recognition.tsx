import * as resumeData from "@/personal/data/resumeData";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import TronPaper from "@/components/app/TronPaper";
import { withBasePath } from "@/utils/basePath";

export default function Recognition() {
  return (
    <TronPaper>
      <Typography variant="h6" gutterBottom className="mb-4">
        Recognition
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {resumeData.recognition.snippets.map((snippet, idx) => (
          <Grid item xs={12} sm={4} key={idx}>
            <Card variant="outlined" className="h-full">
              <CardContent className="h-full">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="leading-6 italic"
                >
                  {snippet}
                </Typography>
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
                      <Avatar
                        alt={rec.name}
                        src={withBasePath(rec.imageSrcUrl)}
                      />
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
                <Typography variant="body1" className="leading-7 italic">
                  {rec.text}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </TronPaper>
  );
}
