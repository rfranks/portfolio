import * as React from "react";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Chip from "@/components/fabric/Chip";
import PortfolioPanel from "@/components/portfolio/PortfolioPanel";
import { hobbies } from "@/consts/resumeData";
import { withBasePath } from "@/utils/basePath";

export default function HobbiesCard() {
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
  }, []);
  const hasHeroMedia = Boolean(resolvedHeroVideoUrl || hobbies.heroImageUrl);
  const [isHeroVideoActive, setIsHeroVideoActive] = React.useState(false);
  const [isHeroVideoLoaded, setIsHeroVideoLoaded] = React.useState(false);
  const [heroVideoUnavailable, setHeroVideoUnavailable] = React.useState(false);
  const heroVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const canPlayHeroVideo =
    Boolean(resolvedHeroVideoUrl) && !heroVideoUnavailable;

  const handleHeroClick = React.useCallback(() => {
    if (!canPlayHeroVideo) {
      return;
    }

    setIsHeroVideoLoaded(false);
    setIsHeroVideoActive(true);
  }, [canPlayHeroVideo]);

  const handleHeroVideoLoadedData = React.useCallback(() => {
    setIsHeroVideoLoaded(true);
  }, []);

  const handleHeroVideoEnded = React.useCallback(() => {
    const video = heroVideoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    setIsHeroVideoActive(false);
    setIsHeroVideoLoaded(false);
  }, []);

  const handleHeroVideoError = React.useCallback(() => {
    setHeroVideoUnavailable(true);
    setIsHeroVideoActive(false);
    setIsHeroVideoLoaded(false);
  }, []);

  React.useEffect(() => {
    if (!isHeroVideoActive || !isHeroVideoLoaded) {
      return;
    }

    const video = heroVideoRef.current;
    if (!video) {
      return;
    }

    video.currentTime = 0;
    void video.play().catch(() => {
      // Ignore autoplay failures; user can click again.
    });
  }, [isHeroVideoActive, isHeroVideoLoaded]);

  return (
    <PortfolioPanel className="h-full">
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
              {hobbies.heroImageUrl && (
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: "18px",
                    overflow: "hidden",
                    cursor: canPlayHeroVideo ? "pointer" : "default",
                  }}
                  onClick={handleHeroClick}
                  role={canPlayHeroVideo ? "button" : undefined}
                  tabIndex={canPlayHeroVideo ? 0 : -1}
                  aria-label={
                    canPlayHeroVideo
                      ? `Play ${hobbies.title} hero video`
                      : undefined
                  }
                  onKeyDown={(event) => {
                    if (!canPlayHeroVideo) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleHeroClick();
                    }
                  }}
                >
                  <Image
                    src={withBasePath(hobbies.heroImageUrl)}
                    alt={`${hobbies.title} hero`}
                    width={960}
                    height={540}
                    className={`h-auto w-full rounded-[18px] object-cover transition-opacity duration-200 ${
                      isHeroVideoActive && isHeroVideoLoaded
                        ? "opacity-0"
                        : "opacity-100"
                    }`}
                  />
                  {canPlayHeroVideo && isHeroVideoActive ? (
                    <Box
                      component="video"
                      ref={heroVideoRef}
                      src={withBasePath(resolvedHeroVideoUrl)}
                      playsInline
                      muted
                      preload="auto"
                      onLoadedData={handleHeroVideoLoadedData}
                      onEnded={handleHeroVideoEnded}
                      onError={handleHeroVideoError}
                      sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "18px",
                        opacity: isHeroVideoLoaded ? 1 : 0,
                        transition: "opacity 200ms ease",
                        pointerEvents: "none",
                      }}
                    />
                  ) : null}
                </Box>
              )}
              {!hobbies.heroImageUrl && canPlayHeroVideo && (
                <Box
                  component="video"
                  src={withBasePath(resolvedHeroVideoUrl)}
                  controls
                  playsInline
                  muted
                  className="block h-auto w-full rounded-[18px]"
                />
              )}
            </Box>
          )}
        </Stack>
      </Stack>
    </PortfolioPanel>
  );
}
