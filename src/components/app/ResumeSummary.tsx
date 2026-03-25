import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { summary } from "@/consts/resumeData";
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";

export default function ResumeSummary() {
  return (
    <FadeInSection>
      <TronPaper className="h-full">
        <Typography variant="h6" gutterBottom className="mb-4">
          Summary
        </Typography>
        <Stack spacing={2} className="h-full">
          <Typography className="text-base leading-7">
            {summary.blurb}
          </Typography>
          <Typography color="text.secondary" className="leading-7">
            Focused on building production systems where product complexity,
            domain complexity, and technical complexity all intersect,
            especially in healthcare and AI-assisted workflows.
          </Typography>
          <Typography color="text.secondary" className="leading-7">
            Strong across the full stack: modern React and Next.js frontends,
            TypeScript and Python service layers, Java enterprise systems, and
            cloud-native delivery on Azure and AWS.
          </Typography>
          <Typography color="text.secondary" className="leading-7">
            Operates comfortably at both architecture and execution depth,
            turning ambiguous requirements into shipped software while improving
            reliability, developer velocity, and long-term maintainability.
          </Typography>
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
