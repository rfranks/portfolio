import Typography from "@mui/material/Typography";
import { summary } from "@/consts/resumeData";
import TronPaper from "@/components/app/TronPaper";

export default function ResumeSummary() {
  return (
    <TronPaper>
      <Typography variant="h6" gutterBottom>
        Summary
      </Typography>
      <Typography>{summary.blurb}</Typography>
    </TronPaper>
  );
}
