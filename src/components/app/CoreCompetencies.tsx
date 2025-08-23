import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { coreCompetencies } from "@/consts/resumeData";

export default function CoreCompetencies() {
  return (
    <Paper sx={{ p: 2, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Core Competencies
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {coreCompetencies.map((competency) => (
          <Chip key={competency} label={competency} sx={{ mb: 1 }} />
        ))}
      </Stack>
    </Paper>
  );
}
