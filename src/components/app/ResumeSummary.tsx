import Image from "next/image";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { summary } from "@/consts/resumeData";
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";
import { withBasePath } from "@/utils/basePath";

export default function ResumeSummary() {
  return (
    <FadeInSection>
      <TronPaper className="h-full">
        <Typography variant="h6" gutterBottom className="mb-4">
          Summary
        </Typography>
        <Stack spacing={2.5} sx={{ height: "100%" }}>
          <Stack
            spacing={2.5}
            direction={{ xs: "column", md: "row" }}
            sx={{
              alignItems: { xs: "stretch", md: "flex-start" },
              justifyContent: { xs: "flex-start", md: "space-between" },
            }}
          >
            <Stack spacing={2} sx={{ minWidth: 0, flex: "1 1 auto" }}>
              <Typography className="text-base leading-7">
                {summary.blurb}
              </Typography>
              <Typography color="text.secondary" className="leading-7">
                Focused on building production systems where product complexity,
                domain complexity, and technical complexity all intersect,
                especially in healthcare and AI-assisted workflows.
              </Typography>
            </Stack>
            <Box
              className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-2 shadow-lg md:mx-0"
              sx={{
                width: { xs: "100%", md: 220 },
                minWidth: { xs: 0, md: 220 },
                flexShrink: 0,
              }}
            >
              <Image
                src={withBasePath("/images/me-headshot.jpeg")}
                alt={`${summary.name} headshot`}
                width={480}
                height={640}
                className="h-auto w-full rounded-[22px] object-cover"
              />
            </Box>
          </Stack>
          <Stack spacing={2}>
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
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
