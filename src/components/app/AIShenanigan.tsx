"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FadeInSection from "@/components/app/FadeInSection";
import TronPaper from "@/components/app/TronPaper";
import { withBasePath } from "@/utils/basePath";

type AIShenaniganProps = {
  rank: number;
  title: string;
  blurb: string;
  orientation?: "portrait" | "landscape";
  realisticImage: string;
  realisticSource?: string;
  stylizedRendering: string;
  stylizedSource?: string;
  movieRendering?: string | null;
  movieSource?: string;
};

type RevealStage = "realistic" | "stylized" | "movie";
type ArrowDirection = "right" | "down";
const ARROW_REVEAL_MS = 280;

export default function AIShenanigan({
  rank,
  title,
  blurb,
  orientation = "landscape",
  realisticImage,
  realisticSource,
  stylizedRendering,
  stylizedSource,
  movieRendering,
  movieSource,
}: AIShenaniganProps) {
  const [stage, setStage] = useState<RevealStage>("realistic");
  const [showStylizedArrow, setShowStylizedArrow] = useState(false);
  const [showMovieArrow, setShowMovieArrow] = useState(false);
  const [stylizedVisible, setStylizedVisible] = useState(false);
  const [movieVisible, setMovieVisible] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState<RevealStage | null>(null);
  const motionSectionRef = useRef<HTMLDivElement | null>(null);
  const motionVideoRef = useRef<HTMLVideoElement | null>(null);
  const stylizedTimeoutRef = useRef<number | null>(null);
  const movieTimeoutRef = useRef<number | null>(null);
  const hasMovie = Boolean(movieRendering);
  const isPortrait = orientation === "portrait";
  const mediaAspectRatio = isPortrait ? "9 / 16" : "16 / 9";
  const stillAspectRatio = isPortrait ? "3 / 4" : "4 / 3";
  const mediaMaxWidth = isPortrait ? 420 : "100%";
  const stillMaxWidth = isPortrait ? 520 : undefined;
  const formattedRank = `#${String(rank).padStart(2, "0")}`;

  const revealLabels = useMemo(
    () => [
      {
        key: "realistic" as const,
        label: "Realistic source",
        active: true,
      },
      {
        key: "stylized" as const,
        label: "Stylized rendering",
        active: stylizedVisible || showStylizedArrow,
      },
      ...(hasMovie
        ? [
            {
              key: "movie" as const,
              label: "Motion rendering",
              active: movieVisible || showMovieArrow,
            },
          ]
        : []),
    ],
    [hasMovie, movieVisible, showMovieArrow, showStylizedArrow, stylizedVisible],
  );

  const renderArrow = (direction: ArrowDirection, active: boolean) => (
    <Box
      aria-hidden="true"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: active ? 1 : 0,
        transform: active
          ? "translate3d(0, 0, 0) scale(1)"
          : direction === "right"
            ? "translate3d(-8px, 0, 0) scale(0.92)"
            : "translate3d(0, -8px, 0) scale(0.92)",
        transition: "opacity 260ms ease, transform 320ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          ...(direction === "right"
            ? {
                width: 88,
                height: 48,
              }
            : {
                width: 48,
                height: 72,
              }),
        }}
      >
        <Box
          sx={{
            position: "absolute",
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(34,211,238,0.2) 0%, rgba(59,130,246,0.95) 52%, rgba(14,165,233,0.9) 100%)",
            boxShadow: "0 0 22px rgba(56,189,248,0.35)",
            ...(direction === "right"
              ? {
                  top: "50%",
                  left: 8,
                  right: 18,
                  height: 4,
                  transform: "translateY(-50%)",
                }
              : {
                  top: 8,
                  bottom: 18,
                  left: "50%",
                  width: 4,
                  transform: "translateX(-50%)",
                }),
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 18,
            height: 18,
            borderTop: "4px solid",
            borderRight: "4px solid",
            borderColor: "rgb(59,130,246)",
            filter: "drop-shadow(0 0 12px rgba(59,130,246,0.6))",
            ...(direction === "right"
              ? {
                  top: "50%",
                  right: 6,
                  transform: "translateY(-50%) rotate(45deg)",
                }
              : {
                  bottom: 6,
                  left: "50%",
                  transform: "translateX(-50%) rotate(135deg)",
                }),
          }}
        />
      </Box>
    </Box>
  );

  useEffect(() => {
    if (stage !== "movie") {
      return;
    }

    motionSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });

    const video = motionVideoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = 0;
    void video.play().catch(() => {
      // Ignore autoplay failures; controls remain available.
    });
  }, [stage]);

  useEffect(() => {
    return () => {
      if (stylizedTimeoutRef.current) {
        window.clearTimeout(stylizedTimeoutRef.current);
      }
      if (movieTimeoutRef.current) {
        window.clearTimeout(movieTimeoutRef.current);
      }
    };
  }, []);

  const resetReveal = () => {
    if (stylizedTimeoutRef.current) {
      window.clearTimeout(stylizedTimeoutRef.current);
      stylizedTimeoutRef.current = null;
    }
    if (movieTimeoutRef.current) {
      window.clearTimeout(movieTimeoutRef.current);
      movieTimeoutRef.current = null;
    }
    setTransitioningTo(null);
    setStage("realistic");
    setShowStylizedArrow(false);
    setShowMovieArrow(false);
    setStylizedVisible(false);
    setMovieVisible(false);
    if (motionVideoRef.current) {
      motionVideoRef.current.pause();
      motionVideoRef.current.currentTime = 0;
    }
  };

  const handleRevealStylized = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("stylized");
    setShowStylizedArrow(true);
    stylizedTimeoutRef.current = window.setTimeout(() => {
      setStylizedVisible(true);
      setStage("stylized");
      setTransitioningTo(null);
      stylizedTimeoutRef.current = null;
    }, ARROW_REVEAL_MS);
  };

  const handleRevealMovie = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("movie");
    setShowMovieArrow(true);
    movieTimeoutRef.current = window.setTimeout(() => {
      setMovieVisible(true);
      setStage("movie");
      setTransitioningTo(null);
      movieTimeoutRef.current = null;
    }, ARROW_REVEAL_MS);
  };

  return (
    <FadeInSection>
      <TronPaper className="overflow-hidden">
        <Stack spacing={3}>
          <Stack
            spacing={2.5}
            direction={{ xs: "column", lg: "row" }}
            sx={{ alignItems: { xs: "stretch", lg: "flex-start" } }}
          >
            <Box
              sx={{
                width: { xs: "100%", lg: 340 },
                minWidth: { xs: 0, lg: 340 },
                flexShrink: 0,
              }}
            >
              <Box sx={{ position: { xs: "static", lg: "sticky" }, top: 104 }}>
                <Box className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-lg">
                  <Box
                    aria-hidden="true"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 18,
                      fontSize: { xs: "2.8rem", sm: "3.5rem" },
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: "-0.08em",
                      color: "transparent",
                      WebkitTextStroke: "1px rgba(96,165,250,0.5)",
                      textShadow: "0 12px 30px rgba(37,99,235,0.18)",
                      opacity: 0.95,
                      userSelect: "none",
                    }}
                  >
                    {formattedRank}
                  </Box>
                  <Typography variant="overline" color="primary">
                    AI Shenanigan
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>
                    {title}
                  </Typography>
                  <Typography color="text.secondary" className="leading-7">
                    {blurb}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mt: 2.5, alignItems: "center" }}
                  >
                    {revealLabels.map((item, index) => (
                      <Box
                        key={item.key}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Chip
                          label={item.label}
                          color={item.active ? "primary" : "default"}
                          variant={item.active ? "filled" : "outlined"}
                          size="small"
                        />
                        {index < revealLabels.length - 1 && (
                          <Typography
                            aria-hidden="true"
                            sx={{
                              fontSize: "1rem",
                              fontWeight: 800,
                              lineHeight: 1,
                              color: item.active
                                ? "primary.main"
                                : "text.disabled",
                              transform: "translateY(-1px)",
                              transition: "color 180ms ease",
                              userSelect: "none",
                            }}
                          >
                            →
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      {stage !== "realistic" && (
                        <Button variant="text" onClick={resetReveal}>
                          Reset
                        </Button>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
                      {stage === "realistic" && (
                        <Button
                          variant="contained"
                          onClick={handleRevealStylized}
                          disabled={transitioningTo !== null}
                        >
                          Reveal Stylized 🎨
                        </Button>
                      )}
                      {stage === "stylized" && hasMovie && (
                        <Button
                          variant="contained"
                          onClick={handleRevealMovie}
                          disabled={transitioningTo !== null}
                        >
                          Reveal Motion 🎬
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Stack spacing={2} sx={{ minWidth: 0, flex: "1 1 auto" }}>
              <Stack
                spacing={2}
                direction={{ xs: "column", xl: "row" }}
                sx={{ alignItems: { xs: "stretch", xl: "center" } }}
              >
                <Box
                  className="rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-lg"
                  sx={{
                    minWidth: 0,
                    flexBasis: { xl: stylizedVisible ? "50%" : "100%" },
                    maxWidth: { xl: stylizedVisible ? "50%" : "100%" },
                    transition:
                      "flex-basis 360ms cubic-bezier(.2,.8,.2,1), max-width 360ms cubic-bezier(.2,.8,.2,1), transform 360ms cubic-bezier(.2,.8,.2,1)",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Realistic source
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    The grounded starting point.
                  </Typography>
                  <Image
                    src={withBasePath(realisticImage)}
                    alt={`${title} realistic source`}
                    width={1200}
                    height={900}
                    className="h-auto w-full rounded-[22px] bg-black/10 object-contain"
                    style={{
                      aspectRatio: stillAspectRatio,
                      maxWidth: stillMaxWidth,
                      marginInline: "auto",
                    }}
                  />
                  {realisticSource && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1.5, display: "block" }}
                    >
                      Source: {realisticSource}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: { xs: "flex", xl: "none" }, justifyContent: "center" }}>
                  {renderArrow("down", showStylizedArrow)}
                </Box>
                <Box sx={{ display: { xs: "none", xl: "flex" }, justifyContent: "center" }}>
                  {renderArrow("right", showStylizedArrow)}
                </Box>
                {stylizedVisible && (
                  <Box
                    className="rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-lg"
                    sx={{
                      minWidth: 0,
                      flexBasis: { xl: "50%" },
                      maxWidth: { xl: "50%" },
                      opacity: 1,
                      transform: "translate3d(0, 0, 0)",
                      transition:
                        "opacity 320ms ease, transform 360ms cubic-bezier(.2,.8,.2,1), flex-basis 360ms cubic-bezier(.2,.8,.2,1), max-width 360ms cubic-bezier(.2,.8,.2,1)",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Stylized rendering
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Push the portrait into caricature.
                    </Typography>
                    <Image
                      src={withBasePath(stylizedRendering)}
                      alt={`${title} stylized rendering`}
                      width={1200}
                      height={900}
                      className="h-auto w-full rounded-[22px] bg-black/10 object-contain"
                      style={{
                        aspectRatio: stillAspectRatio,
                        maxWidth: stillMaxWidth,
                        marginInline: "auto",
                      }}
                    />
                    {stylizedSource && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1.5, display: "block" }}
                      >
                        Source: {stylizedSource}
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>
              {hasMovie && (showMovieArrow || movieVisible) && (
                <>
                  <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
                    {renderArrow("down", showMovieArrow)}
                  </Box>
                  {movieVisible && (
                    <Box
                      ref={motionSectionRef}
                      className="rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-lg"
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Motion rendering
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Let the caricature move.
                      </Typography>
                      <Box
                        component="video"
                        ref={motionVideoRef}
                        src={withBasePath(movieRendering!)}
                        controls
                        autoPlay
                        playsInline
                        muted
                        className="block w-full rounded-[22px] bg-black/10 object-contain"
                        sx={{
                          aspectRatio: mediaAspectRatio,
                          maxWidth: mediaMaxWidth,
                          mx: isPortrait ? "auto" : undefined,
                        }}
                      />
                      {movieSource && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1.5, display: "block" }}
                        >
                          Source: {movieSource}
                        </Typography>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </Stack>
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
