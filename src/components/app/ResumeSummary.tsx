import Typography from "@mui/material/Typography";
import { summary } from "@/consts/resumeData";
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";

export default function ResumeSummary() {
  return (
    <FadeInSection>
      <TronPaper>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Typography>{summary.blurb}</Typography>
      </TronPaper>
    </FadeInSection>
  );
}
