import Typography from "@mui/material/Typography";
import { summary } from "@/consts/resumeData";
import Section from "./Section";

export default function ResumeSummary() {
    return (
      <Section>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Typography>{summary.blurb}</Typography>
      </Section>
    );
  }
