import * as React from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Chip from "@/components/fabric/Chip";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import { MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { withBasePath } from "@/utils/basePath";

type HobbiesCardProps = {
  topRail?: React.ReactNode;
};

export default function HobbiesCard({ topRail }: HobbiesCardProps) {
  const { hobbies } = useResumeData();
  const heroFrameSx = React.useMemo(
    () => ({
      mt: 0,
      mb: 0,
      width: "100%",
      aspectRatio: { xs: "2 / 3", md: "3 / 4" },
      maxHeight: { xs: "none", md: "clamp(300px, 42dvh, 500px)" },
      overflow: "hidden",
      borderRadius: "18px",
      backgroundColor: "rgba(2,6,23,0.1)",
    }),
    [],
  );

  const resolvedHeroVideoUrl = React.useMemo(() => {
    if (typeof hobbies.heroVideoUrl === "string") {
      if ((hobbies.heroVideoUrl as string).trim()) {
        return (hobbies.heroVideoUrl as string).trim();
      }
    }

    if (
      typeof hobbies.heroImageUrl === "string" &&
      hobbies.heroImageUrl.trim()
    ) {
      return hobbies.heroImageUrl.trim().replace(/\.png$/i, ".mp4");
    }

    return "";
  }, [hobbies.heroImageUrl, hobbies.heroVideoUrl]);
  const [isHeroVideoActive, setIsHeroVideoActive] = React.useState(false);
  const [heroVideoUnavailable, setHeroVideoUnavailable] = React.useState(false);
  const heroVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const canPlayHeroVideo =
    Boolean(resolvedHeroVideoUrl) && !heroVideoUnavailable;
  const hasHeroMedia = Boolean(hobbies.heroImageUrl || canPlayHeroVideo);

  const handleHeroClick = React.useCallback(() => {
    if (!canPlayHeroVideo) {
      return;
    }

    setIsHeroVideoActive(true);
  }, [canPlayHeroVideo]);

  const handleHeroVideoEnded = React.useCallback(() => {
    const video = heroVideoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    setIsHeroVideoActive(false);
  }, []);

  const handleHeroVideoError = React.useCallback(() => {
    setHeroVideoUnavailable(true);
    setIsHeroVideoActive(false);
  }, []);
  const heroMediaItems = React.useMemo<MediaCyclerItem[]>(() => {
    const items: MediaCyclerItem[] = [];
    const hasHeroImage = Boolean(hobbies.heroImageUrl);

    if (hasHeroImage && hobbies.heroImageUrl) {
      items.push({
        key: "hero-image",
        title: "",
        mediaType: "image",
        mediaUrl: withBasePath(hobbies.heroImageUrl),
        mediaAlt: `${hobbies.title} hero`,
        mediaLightboxTitle: `${hobbies.title} hero`,
        onMediaActivate: canPlayHeroVideo ? handleHeroClick : undefined,
        assetFrameSx: heroFrameSx,
        imageWidth: 960,
        imageHeight: 540,
        imageClassName: "h-full w-full rounded-[18px] bg-black/10 object-contain",
      });
    }

    if (canPlayHeroVideo) {
      items.push({
        key: "hero-video",
        title: "",
        mediaType: "video",
        mediaUrl: withBasePath(resolvedHeroVideoUrl),
        mediaLightboxTitle: `${hobbies.title} hero video`,
        videoRef: heroVideoRef,
        controls: !hasHeroImage,
        autoPlay: hasHeroImage,
        muted: true,
        playsInline: true,
        videoProps: {
          preload: "auto",
          onEnded: hasHeroImage ? handleHeroVideoEnded : undefined,
          onError: handleHeroVideoError,
        },
        assetFrameSx: heroFrameSx,
        previewVideoClassName:
          "block h-full w-full rounded-[18px] bg-black/10 object-contain",
        previewVideoSx: {
          width: "100%",
          height: "100%",
        },
      });
    }

    return items;
  }, [
    canPlayHeroVideo,
    handleHeroClick,
    handleHeroVideoEnded,
    handleHeroVideoError,
    heroFrameSx,
    hobbies.heroImageUrl,
    hobbies.title,
    resolvedHeroVideoUrl,
  ]);

  const activeHeroMediaKey =
    canPlayHeroVideo && isHeroVideoActive ? "hero-video" : "hero-image";

  return (
    <PortfolioPanel className="h-full">
      {topRail ? (
        <Box
          sx={{
            flexShrink: 0,
            mx: -2,
            mt: -2,
            mb: 0,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(8px)",
            borderTopLeftRadius: "var(--fabric-radius-xl)",
            borderTopRightRadius: "var(--fabric-radius-xl)",
          }}
        >
          {topRail}
        </Box>
      ) : null}
      <Box sx={{ pt: 0.5 }}>
      <Stack spacing={2}>
        <Stack
          spacing={2}
          direction={{ xs: "column", md: "row" }}
          sx={{
            alignItems: { xs: "stretch", md: "flex-start" },
            justifyContent: "flex-start",
            minWidth: 0,
          }}
        >
          <Stack
            spacing={2}
            sx={{
              minWidth: 0,
              flex: { xs: "1 1 auto", md: "1 1 calc(50% - 8px)" },
            }}
          >
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
                width: { xs: "100%", md: "calc(50% - 8px)" },
                minWidth: 0,
                maxWidth: { xs: "100%", md: "calc(50% - 8px)" },
                flex: { xs: "0 1 auto", md: "0 1 calc(50% - 8px)" },
                flexShrink: 1,
              }}
            >
              <MediaCycler
                items={heroMediaItems}
                singlePanel
                singlePanelActiveKey={activeHeroMediaKey}
                transitionMs={220}
                disableTransition
                showExpandIcon={false}
                showChevronNavigation={false}
                stackSx={{
                  position: "relative",
                  borderRadius: "18px",
                  overflow: "hidden",
                }}
              />
            </Box>
          )}
        </Stack>
      </Stack>
      </Box>
    </PortfolioPanel>
  );
}
