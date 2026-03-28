import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { competencies } from "@/personal/data/resumeData";
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";
import Chip from "@/components/fabric/Chip";

export default function CoreCompetencies() {
  return (
    <FadeInSection>
      <TronPaper className="h-full">
        <Typography variant="h6" gutterBottom className="mb-4">
          Core Competencies
        </Typography>
        <Stack spacing={3}>
          {competencies.categories.map((category) => (
            <Box
              key={category.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors duration-200 dark:bg-white/[0.03] hover:bg-white/10 dark:hover:bg-white/[0.06]"
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                className="mb-2 font-bold uppercase tracking-[0.14em]"
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
                      className="mb-1"
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
