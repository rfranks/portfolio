import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { coreCompetencies } from "@/consts/resumeData";
import Section from "./Section";

export default function CoreCompetencies() {
    return (
      <Section>
        <Typography variant="h6" gutterBottom>
          Core Competencies
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {coreCompetencies.map((competency) => (
            <Chip key={competency} label={competency} sx={{ mb: 1 }} />
          ))}
        </Stack>
      </Section>
    );
  }
