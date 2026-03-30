"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FadeInSection from "@/components/app/FadeInSection";
import TronPaper from "@/components/app/TronPaper";
import { useAudio } from "@/hooks/audio/useAudio";
import { rewindAndPlayAudio } from "@/utils/lightgun-web/audio";
import { withBasePath } from "@/utils/basePath";

type RevealStage = "intro" | "book" | "manuscript" | "episodes";
type ArrowDirection = "right" | "down";

const ARROW_REVEAL_MS = 280;

type AIShenaniganAdaptationProps = {
  rank: number;
  title: string;
  blurb: string;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  bookCoverImage: string;
  bookSource?: string;
  bookSourceHref?: string;
  bookCaption?: string;
  manuscriptPdf: string;
  manuscriptSource?: string;
  manuscriptSourceHref?: string;
  manuscriptCaption?: string;
  episodesPdf: string;
  episodesSource?: string;
  episodesSourceHref?: string;
  episodesCaption?: string;
  episodeMedia?: Array<{
    title: string;
    src: string;
    source?: string;
    sourceHref?: string;
    caption?: string;
  }>;
};

export default function AIShenaniganAdaptation({
  rank,
  title,
  blurb,
  intentToCopyright = false,
  rightsNotice,
  bookCoverImage,
  bookSource,
  bookSourceHref,
  bookCaption,
  manuscriptPdf,
  manuscriptSource,
  manuscriptSourceHref,
  manuscriptCaption,
  episodesPdf,
  episodesSource,
  episodesSourceHref,
  episodesCaption,
  episodeMedia = [],
}: AIShenaniganAdaptationProps) {
  const [stage, setStage] = useState<RevealStage>("intro");
  const [bookVisible, setBookVisible] = useState(false);
  const [bookCoverLoaded, setBookCoverLoaded] = useState(false);
  const [manuscriptVisible, setManuscriptVisible] = useState(false);
  const [episodesVisible, setEpisodesVisible] = useState(false);
  const [revealedEpisodeCount, setRevealedEpisodeCount] = useState(0);
  const [showManuscriptArrow, setShowManuscriptArrow] = useState(false);
  const [showEpisodesArrow, setShowEpisodesArrow] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState<RevealStage | null>(
    null,
  );
  const manuscriptTimeoutRef = useRef<number | null>(null);
  const episodesTimeoutRef = useRef<number | null>(null);
  const bookSectionRef = useRef<HTMLDivElement | null>(null);
  const bookCoverRef = useRef<HTMLDivElement | null>(null);
  const manuscriptSectionRef = useRef<HTMLDivElement | null>(null);
  const episodesSectionRef = useRef<HTMLDivElement | null>(null);
  const episodeCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const episodeVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const bookSfx = useAudio("/audio/highUp.ogg");
  const manuscriptSfx = useAudio("/audio/open_003.ogg");
  const episodesSfx = useAudio("/audio/select_004.ogg");
  const nextEpisodeSfx = useAudio("/audio/whoosh.ogg");
  const formattedRank = `#${String(rank).padStart(2, "0")}`;
  const rightsLabel = rightsNotice || "Intent to Copyright";
  const rightsStampAngle = ((rank * 7) % 17) - 8;
  const hasVisibleMedia = bookVisible;
  const panelChromeSx = {
    borderRadius: "24px",
    border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  } as const;
  const mediaPanelSx = {
    ...panelChromeSx,
    p: 2.5,
  } as const;
  const hasEpisodesPdf = Boolean(episodesPdf);
  const hasEpisodeMedia = episodeMedia.length > 0;

  const scrollPanelIntoView = (
    panel: HTMLDivElement | null,
    block: ScrollLogicalPosition = "nearest",
  ) => {
    if (!panel) {
      return;
    }

    panel.scrollIntoView({
      behavior: "smooth",
      block,
    });
  };

  const revealLabels = useMemo(
    () => [
      { key: "book" as const, label: "Book cover", active: bookVisible },
      {
        key: "manuscript" as const,
        label: "Manuscript",
        active: manuscriptVisible || showManuscriptArrow,
      },
      {
        key: "episodes" as const,
        label: "Episodes Draft",
        active: episodesVisible || showEpisodesArrow,
      },
      ...episodeMedia.map((episode, index) => ({
        key: `episode-${index}` as const,
        label: episode.title,
        active: revealedEpisodeCount > index,
      })),
    ],
    [
      bookVisible,
      episodeMedia,
      episodesVisible,
      manuscriptVisible,
      revealedEpisodeCount,
      showEpisodesArrow,
      showManuscriptArrow,
    ],
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
        transition:
          "opacity 260ms ease, transform 320ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          ...(direction === "right"
            ? { width: 88, height: 48 }
            : { width: 48, height: 72 }),
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

  const renderSource = (label?: string, href?: string) => {
    if (!label) {
      return null;
    }

    return (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1.5, display: "block" }}
      >
        Source:{" "}
        {href ? (
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="primary.main"
          >
            {label}
          </Link>
        ) : (
          label
        )}
      </Typography>
    );
  };

  const renderRightsStamp = () => {
    if (!intentToCopyright) {
      return null;
    }

    return (
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: { xs: 52, md: 60 },
          right: { xs: 14, md: 22 },
          zIndex: 2,
          pointerEvents: "none",
          px: 1.4,
          py: 0.7,
          borderRadius: "10px",
          border: "3px solid rgba(185,28,28,0.85)",
          color: "rgba(127,29,29,0.96)",
          bgcolor: "rgba(255,244,244,0.82)",
          fontSize: { xs: "0.7rem", md: "0.82rem" },
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transform: `rotate(${rightsStampAngle}deg)`,
          boxShadow:
            "0 0 0 2px rgba(255,255,255,0.22) inset, 0 10px 24px rgba(127,29,29,0.18)",
          textShadow: "0 1px 0 rgba(255,255,255,0.3)",
          opacity: 0.92,
        }}
      >
        {rightsLabel}
      </Box>
    );
  };

  const renderPdfFrame = (src: string, titleText: string) => {
    const pdfSrc = `${withBasePath(src)}#view=FitH`;

    return (
      <Box sx={{ mt: 2 }}>
        <Box
          sx={{
            overflow: "hidden",
            borderRadius: "18px",
            border: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "rgba(15,23,42,0.48)",
          }}
        >
          <Box
            component="object"
            data={pdfSrc}
            type="application/pdf"
            aria-label={titleText}
            sx={{
              display: "block",
              width: "100%",
              height: { xs: 520, md: 680, lg: 760 },
            }}
          >
            <Box
              component="iframe"
              src={pdfSrc}
              title={titleText}
              sx={{
                width: "100%",
                height: { xs: 520, md: 680, lg: 760 },
                border: 0,
                bgcolor: "rgba(15,23,42,0.48)",
              }}
            />
          </Box>
        </Box>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 1.25 }}
        >
          <Link
            href={withBasePath(src)}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            color="primary.main"
            sx={{ display: "inline-flex" }}
          >
            Open document
          </Link>
          <Typography variant="caption" color="text.secondary">
            Read inline or open the PDF in a separate tab.
          </Typography>
        </Stack>
      </Box>
    );
  };

  const renderNextAction = () => {
    if (stage === "intro") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealBook}
          disabled={transitioningTo !== null}
        >
          Reveal Book Cover 📚
        </Button>
      );
    }

    if (stage === "book") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealManuscript}
          disabled={transitioningTo !== null}
        >
          Reveal Manuscript ✍️
        </Button>
      );
    }

    if (stage === "manuscript") {
      return (
        <Button
          variant="contained"
          onClick={handleRevealEpisodes}
          disabled={transitioningTo !== null}
        >
          Reveal Episodes Draft 📺
        </Button>
      );
    }

    if (stage === "episodes" && revealedEpisodeCount < episodeMedia.length) {
      return (
        <Button
          variant="contained"
          onClick={handleRevealNextEpisode}
          disabled={transitioningTo !== null}
        >
          Reveal Next Episode 🎞️
        </Button>
      );
    }

    return null;
  };

  const renderMobilePanelFooter = () => {
    const nextAction = renderNextAction();

    return (
      <Box
        sx={{
          display: { xs: "block", lg: "none" },
          mt: 2,
          pt: 2,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ alignItems: "center" }}
        >
          {revealLabels.map((item, index) => (
            <Box
              key={`panel-${item.key}`}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
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
                    color: item.active ? "primary.main" : "text.disabled",
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
            mt: 1.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box>
            {stage !== "intro" && (
              <Button variant="text" onClick={resetReveal}>
                Reset
              </Button>
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            {nextAction ?? (
              <Chip
                label="Sequence complete"
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  useEffect(() => {
    if (!bookVisible || !bookCoverLoaded) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      scrollPanelIntoView(bookCoverRef.current || bookSectionRef.current, "center");
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [bookCoverLoaded, bookVisible]);

  useEffect(() => {
    return () => {
      if (manuscriptTimeoutRef.current) {
        window.clearTimeout(manuscriptTimeoutRef.current);
      }
      if (episodesTimeoutRef.current) {
        window.clearTimeout(episodesTimeoutRef.current);
      }
    };
  }, []);

  const resetReveal = () => {
    if (manuscriptTimeoutRef.current) {
      window.clearTimeout(manuscriptTimeoutRef.current);
      manuscriptTimeoutRef.current = null;
    }
    if (episodesTimeoutRef.current) {
      window.clearTimeout(episodesTimeoutRef.current);
      episodesTimeoutRef.current = null;
    }
    setTransitioningTo(null);
    setStage("intro");
    setBookVisible(false);
    setBookCoverLoaded(false);
    setManuscriptVisible(false);
    setEpisodesVisible(false);
    setRevealedEpisodeCount(0);
    setShowManuscriptArrow(false);
    setShowEpisodesArrow(false);
    episodeCardRefs.current = [];
    episodeVideoRefs.current = [];
  };

  const handleRevealBook = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("book");
    rewindAndPlayAudio(bookSfx, { volume: 0.32 });
    window.requestAnimationFrame(() => {
      setBookCoverLoaded(false);
      setBookVisible(true);
      setStage("book");
      setTransitioningTo(null);
    });
  };

  const handleRevealManuscript = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("manuscript");
    rewindAndPlayAudio(manuscriptSfx, { volume: 0.34 });
    setShowManuscriptArrow(true);
    manuscriptTimeoutRef.current = window.setTimeout(() => {
      setManuscriptVisible(true);
      setStage("manuscript");
      setTransitioningTo(null);
      manuscriptTimeoutRef.current = null;
      window.requestAnimationFrame(() => {
        scrollPanelIntoView(manuscriptSectionRef.current);
      });
    }, ARROW_REVEAL_MS);
  };

  const handleRevealEpisodes = () => {
    if (transitioningTo) {
      return;
    }
    setTransitioningTo("episodes");
    rewindAndPlayAudio(episodesSfx, { volume: 0.32 });
    setShowEpisodesArrow(true);
    episodesTimeoutRef.current = window.setTimeout(() => {
      setEpisodesVisible(true);
      setStage("episodes");
      setRevealedEpisodeCount(0);
      setTransitioningTo(null);
      episodesTimeoutRef.current = null;
      window.requestAnimationFrame(() => {
        scrollPanelIntoView(episodesSectionRef.current);
      });
    }, ARROW_REVEAL_MS);
  };

  const handleRevealNextEpisode = () => {
    if (transitioningTo || revealedEpisodeCount >= episodeMedia.length) {
      return;
    }

    setTransitioningTo("episodes");
    rewindAndPlayAudio(nextEpisodeSfx, { volume: 0.3 });
    const nextIndex = revealedEpisodeCount;
    window.setTimeout(() => {
      setRevealedEpisodeCount((current) => current + 1);
      setTransitioningTo(null);
      window.requestAnimationFrame(() => {
        scrollPanelIntoView(episodeCardRefs.current[nextIndex], "center");
        window.setTimeout(() => {
          const video = episodeVideoRefs.current[nextIndex];
          if (!video) {
            return;
          }

          video.muted = false;
          video.currentTime = 0;
          void video.play().catch(() => {
            // Controls remain available if autoplay with sound is blocked.
          });
        }, 260);
      });
    }, 120);
  };

  return (
    <FadeInSection>
      <TronPaper className="overflow-hidden">
        <Stack spacing={3}>
          <Stack
            spacing={2.5}
            direction={{ xs: "column", lg: "row" }}
            sx={{ alignItems: { xs: "stretch", lg: "flex-start" }, overflow: "hidden" }}
          >
            <Box
              sx={{
                width: "100%",
                minWidth: { xs: 0, lg: hasVisibleMedia ? 340 : 0 },
                maxWidth: { xs: "100%", lg: hasVisibleMedia ? 340 : "100%" },
                flexBasis: { xs: "100%", lg: hasVisibleMedia ? "340px" : "100%" },
                flexShrink: 0,
                transition:
                  "flex-basis 560ms cubic-bezier(.2,.8,.2,1), max-width 560ms cubic-bezier(.2,.8,.2,1), min-width 560ms cubic-bezier(.2,.8,.2,1), transform 560ms cubic-bezier(.2,.8,.2,1)",
              }}
            >
              <Box
                sx={{
                  position: { xs: "static", lg: hasVisibleMedia ? "sticky" : "static" },
                  top: 104,
                  transition: "transform 560ms cubic-bezier(.2,.8,.2,1)",
                }}
              >
                <Box className="relative overflow-hidden" sx={{ ...panelChromeSx, p: { xs: 3, md: 3.5 }, boxShadow: "none" }}>
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
                  {renderRightsStamp()}
                  <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>
                    {title}
                  </Typography>
                  <Typography color="text.secondary" className="leading-7">
                    {blurb}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2.5, alignItems: "center" }}>
                    {revealLabels.map((item, index) => (
                      <Box key={item.key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                              color: item.active ? "primary.main" : "text.disabled",
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
                      {stage !== "intro" && (
                        <Button variant="text" onClick={resetReveal}>
                          Reset
                        </Button>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
                      {renderNextAction()}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Stack
              spacing={2}
              sx={{
                minWidth: 0,
                flex: "1 1 auto",
                width: "100%",
                maxWidth: { xs: "100%", lg: hasVisibleMedia ? "calc(100% - 340px)" : 0 },
                flexBasis: { xs: "100%", lg: hasVisibleMedia ? "calc(100% - 340px)" : "0px" },
                opacity: hasVisibleMedia ? 1 : 0,
                transform: hasVisibleMedia ? "translate3d(0, 0, 0)" : "translate3d(28px, 0, 0)",
                overflow: "hidden",
                pointerEvents: hasVisibleMedia ? "auto" : "none",
                transition:
                  "opacity 320ms ease, transform 560ms cubic-bezier(.2,.8,.2,1), flex-basis 560ms cubic-bezier(.2,.8,.2,1), max-width 560ms cubic-bezier(.2,.8,.2,1)",
              }}
            >
              {bookVisible && (
                <Box ref={bookSectionRef} sx={mediaPanelSx}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Book cover
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Start with the originating book-side artifact.
                  </Typography>
                  <Box
                    ref={bookCoverRef}
                    sx={{ display: "flex", justifyContent: "center" }}
                  >
                    <Image
                      src={withBasePath(bookCoverImage)}
                      alt={`${title} book cover`}
                      width={1400}
                      height={900}
                      onLoad={() => {
                        setBookCoverLoaded(true);
                      }}
                      className="h-auto w-full rounded-[22px] bg-black/10 object-contain"
                      style={{ maxWidth: 440, marginInline: "auto" }}
                    />
                  </Box>
                  {renderSource(bookSource, bookSourceHref)}
                  {bookCaption && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: bookSource ? 0.75 : 1.5 }}>
                      {bookCaption}
                    </Typography>
                  )}
                  {renderMobilePanelFooter()}
                </Box>
              )}

              {bookVisible && (
                <>
                  <Box sx={{ display: { xs: "flex", xl: "none" }, justifyContent: "center" }}>
                    {renderArrow("down", showManuscriptArrow)}
                  </Box>
                  <Box sx={{ display: { xs: "none", xl: "flex" }, justifyContent: "center" }}>
                    {renderArrow("right", showManuscriptArrow)}
                  </Box>
                </>
              )}

              {manuscriptVisible && (
                <Box ref={manuscriptSectionRef} sx={mediaPanelSx}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Manuscript
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    The book-side narrative source before adaptation.
                  </Typography>
                  {renderPdfFrame(manuscriptPdf, `${title} manuscript`)}
                  {renderSource(manuscriptSource, manuscriptSourceHref)}
                  {manuscriptCaption && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: manuscriptSource ? 0.75 : 1.5 }}>
                      {manuscriptCaption}
                    </Typography>
                  )}
                  {renderMobilePanelFooter()}
                </Box>
              )}

              {manuscriptVisible && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 0.5 }}>
                  {renderArrow("down", showEpisodesArrow)}
                </Box>
              )}

              {episodesVisible && (
                <Box ref={episodesSectionRef} sx={mediaPanelSx}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Episodes Draft
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Reveal the episodic adaptation plan first, then step
                    through each episode concept one at a time.
                  </Typography>
                  {hasEpisodesPdf &&
                    renderPdfFrame(episodesPdf, `${title} episodes`)}
                  {renderSource(episodesSource, episodesSourceHref)}
                  {episodesCaption && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: episodesSource ? 0.75 : 1.5 }}>
                      {episodesCaption}
                    </Typography>
                  )}
                  {hasEpisodeMedia && (
                    <Stack spacing={2} sx={{ mt: hasEpisodesPdf || episodesCaption || episodesSource ? 2.5 : 0 }}>
                      {episodeMedia.slice(0, revealedEpisodeCount).map((episode, index) => (
                        <Box
                          key={`${episode.title}-${index}`}
                          ref={(node: HTMLDivElement | null) => {
                            episodeCardRefs.current[index] = node;
                          }}
                          sx={{
                            borderRadius: "20px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backgroundColor: "rgba(15,23,42,0.24)",
                            p: 2,
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            {episode.title}
                          </Typography>
                          <Box
                            component="video"
                            ref={(node: HTMLVideoElement | null) => {
                              episodeVideoRefs.current[index] = node;
                            }}
                            src={withBasePath(episode.src)}
                            controls
                            playsInline
                            className="block w-full rounded-[18px] bg-black/10 object-contain"
                            sx={{ aspectRatio: "16 / 9" }}
                          />
                          {renderSource(episode.source, episode.sourceHref)}
                          {episode.caption && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: episode.source ? 0.75 : 1.5 }}
                            >
                              {episode.caption}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}
                  {renderMobilePanelFooter()}
                </Box>
              )}
            </Stack>
          </Stack>
        </Stack>
      </TronPaper>
    </FadeInSection>
  );
}
