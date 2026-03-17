import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { coreCompetencies } from "@/consts/resumeData";
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";
import Chip from "@/components/fabric/Chip";

export default function CoreCompetencies() {
  return (
    <FadeInSection>
      <TronPaper>
        <Typography variant="h6" gutterBottom>
          Core Competencies
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {coreCompetencies.map((competency) => (
            <Chip
              key={competency}
              label={competency}
              variant="outlined"
              color="primary"
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
