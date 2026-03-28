import Image from "next/image";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Chip from "@/components/fabric/Chip";
import TronPaper from "@/components/app/TronPaper";
import FadeInSection from "@/components/app/FadeInSection";
import { hobbies } from "@/personal/data/resumeData";
import { withBasePath } from "@/utils/basePath";

export default function HobbiesCard() {
  const hasHeroMedia = Boolean(hobbies.heroVideoUrl || hobbies.heroImageUrl);

  return (
    <FadeInSection>
      <TronPaper className="h-full">
        <Typography variant="h6" gutterBottom className="mb-4">
          {hobbies.title}
        </Typography>
        <Stack spacing={2}>
          <Stack
            spacing={2}
            direction={{ xs: "column", md: "row" }}
            sx={{
              alignItems: { xs: "stretch", md: "flex-start" },
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={2} sx={{ minWidth: 0, flex: "1 1 auto" }}>
              <Typography color="text.secondary" className="leading-7">
                {hobbies.introText}
              </Typography>
              <Box className="flex flex-wrap gap-2">
                {hobbies.items.map((hobby) => (
                  <Chip
                    key={hobby}
                    label={hobby}
                    variant="outlined"
                    color="secondary"
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Stack>
            {hasHeroMedia && (
              <Box
                className="mx-auto overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-2 shadow-lg md:mx-0"
                sx={{
                  width: { xs: "100%", md: 220 },
                  minWidth: { xs: 0, md: 220 },
                  flexShrink: 0,
                }}
              >
                {hobbies.heroVideoUrl && (
                  <Box
                    component="video"
                    src={withBasePath(hobbies.heroVideoUrl)}
                    controls
                    playsInline
                    muted
                    className="block h-auto w-full rounded-[18px]"
                  />
                )}
                {!hobbies.heroVideoUrl && hobbies.heroImageUrl && (
                  <Image
                    src={withBasePath(hobbies.heroImageUrl)}
                    alt={`${hobbies.title} hero`}
                    width={960}
                    height={540}
                    className="h-auto w-full rounded-[18px] object-cover"
                  />
                )}
              </Box>
            )}
          </Stack>
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
