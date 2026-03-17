import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { competencies } from "@/consts/resumeData";
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
        <Stack spacing={2.5}>
          {competencies.categories.map((category) => (
            <Box key={category.title}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1, fontWeight: 700, letterSpacing: "0.04em" }}
              >
                {category.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {category.items.map((competency) => (
                  <Tooltip
                    key={`${category.title}-${competency.label}`}
                    title={competency.description}
                    arrow
                  >
                    <Chip
                      label={competency.label}
                      variant="outlined"
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
