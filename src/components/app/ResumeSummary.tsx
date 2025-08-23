import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import { summary } from "@/consts/resumeData";

export default function ResumeSummary() {
  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Summary
      </Typography>
      <Typography>{summary.blurb}</Typography>
    </Paper>
  );
}
