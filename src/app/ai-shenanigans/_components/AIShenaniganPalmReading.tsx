"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Loop from "@mui/icons-material/Loop";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import { EmojiGlyph, MarkdownContent, MediaCycler } from "@/components/shared";
import type { MediaCyclerItem } from "@/components/shared";
import AIShenaniganPanel from "./AIShenaniganPanel";
import AIShenaniganRevealNavigator from "./AIShenaniganRevealNavigator";
import { withBasePath } from "@/utils/basePath";
import type { RevealTimelineItem, RevealViewMode } from "../_types/revealStateEngine";

type RevealStage = "intro" | "raw" | "analyzed" | "lines" | "reading";
type PalmRevealStage = Exclude<RevealStage, "intro">;

type AIShenaniganPalmReadingProps = {
  rank: number;
  title: string;
  blurb: string;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  rawImage: string;
  rawSource?: string;
  rawSourceHref?: string;
  rawCaption?: string;
  analyzedImage: string;
  analyzedSource?: string;
  analyzedSourceHref?: string;
  analyzedCaption?: string;
  palmLineAnalysisImage: string;
  palmLineAnalysisSource?: string;
  palmLineAnalysisSourceHref?: string;
  palmLineAnalysisCaption?: string;
  palmReadingTitle?: string;
  palmReadingText?: string;
  palmReadingMarkdownPath?: string;
  palmReadingSource?: string;
  palmReadingSourceHref?: string;
};

const STAGE_LABELS: Record<PalmRevealStage, string> = {
  raw: "Raw",
  analyzed: "Analyzed",
  lines: "Palm Lines",
  reading: "Reading",
};

export default function AIShenaniganPalmReading({
  rank,
  title,
  blurb,
  intentToCopyright = false,
  rightsNotice,
  rawImage,
  rawSource,
  rawSourceHref,
  rawCaption,
  analyzedImage,
  analyzedSource,
  analyzedSourceHref,
  analyzedCaption,
  palmLineAnalysisImage,
  palmLineAnalysisSource,
  palmLineAnalysisSourceHref,
  palmLineAnalysisCaption,
  palmReadingTitle,
  palmReadingText,
  palmReadingMarkdownPath,
  palmReadingSource,
  palmReadingSourceHref,
}: AIShenaniganPalmReadingProps) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [isInfoPanelMinimized, setIsInfoPanelMinimized] = useState(false);
  const [revealMode, setRevealMode] = useState<RevealViewMode>("chips");
  const [stage, setStage] = useState<RevealStage>("intro");
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [isMarkdownLoading, setIsMarkdownLoading] = useState(false);
  const [hasMarkdownLoadError, setHasMarkdownLoadError] = useState(false);

  const formattedRank = `#${String(rank).padStart(2, "0")}`;
  const rightsLabel = rightsNotice || "Intent to Copyright";
  const rightsStampAngle = ((rank * 7) % 17) - 8;
  const hasVisibleMedia = stage !== "intro";
  const hasAnalyzedImage = Boolean(analyzedImage);
  const hasLineImage = Boolean(palmLineAnalysisImage);

  const panelChromeSx = {
    borderRadius: "24px",
    border: "1px solid",
    borderColor: "var(--fabric-surface-border)",
    backgroundColor: "var(--fabric-surface-1)",
    backgroundImage: "linear-gradient(180deg, var(--fabric-inner-glow), transparent 34%)",
    boxShadow: "inset 0 1px 0 var(--fabric-inner-glow)",
    backdropFilter: "blur(var(--fabric-blur-sm))",
  } as const;

  const mediaControlSx = (currentTheme: typeof theme) => ({
    color: currentTheme.palette.common.black,
    borderColor: currentTheme.palette.common.black,
    bgcolor: currentTheme.palette.common.white,
    "&:hover": {
      bgcolor: currentTheme.palette.common.white,
    },
    "&.Mui-disabled": {
      color: alpha(currentTheme.palette.common.black, 0.36),
      borderColor: alpha(currentTheme.palette.common.black, 0.36),
      bgcolor: alpha(currentTheme.palette.common.white, 0.8),
    },
  });

  const restartActionSx = (currentTheme: typeof theme) => ({
    border: "1px solid",
    ...mediaControlSx(currentTheme),
  });

  useEffect(() => {
    if (!isSmallScreen) {
      setIsInfoPanelMinimized(false);
    }
  }, [isSmallScreen]);

  useEffect(() => {
    if (!palmReadingMarkdownPath) {
      setMarkdownContent(null);
      setIsMarkdownLoading(false);
      setHasMarkdownLoadError(false);
      return;
    }

    const controller = new AbortController();
    setIsMarkdownLoading(true);
    setHasMarkdownLoadError(false);

    const loadMarkdown = async () => {
      try {
        const response = await fetch(withBasePath(palmReadingMarkdownPath), {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Failed to load markdown: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        setMarkdownContent(text);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error(error);
        setMarkdownContent(null);
        setHasMarkdownLoadError(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsMarkdownLoading(false);
        }
      }
    };

    void loadMarkdown();

    return () => {
      controller.abort();
    };
  }, [palmReadingMarkdownPath]);

  const stageSequence = useMemo<PalmRevealStage[]>(() => {
    const sequence: PalmRevealStage[] = ["raw"];
    if (hasAnalyzedImage) {
      sequence.push("analyzed");
    }
    if (hasLineImage) {
      sequence.push("lines");
    }
    sequence.push("reading");
    return sequence;
  }, [hasAnalyzedImage, hasLineImage]);

  const stageIndex = stage === "intro" ? -1 : stageSequence.indexOf(stage);

  const revealTimelineItems = useMemo<RevealTimelineItem<PalmRevealStage>[]>(() => {
    return stageSequence.map((stageKey, index) => ({
      label: STAGE_LABELS[stageKey],
      key: stageKey,
      active: stage === stageKey,
      reached: index <= stageIndex,
    }));
  }, [stage, stageIndex, stageSequence]);

  const nextStage = useMemo<RevealStage | null>(() => {
    if (stage === "intro") {
      return stageSequence[0] ?? null;
    }
    if (stageIndex >= 0 && stageIndex < stageSequence.length - 1) {
      return stageSequence[stageIndex + 1];
    }
    return null;
  }, [stage, stageIndex, stageSequence]);

  const nextAction = useMemo<{ label: string; glyph: string } | null>(() => {
    switch (nextStage) {
      case "raw":
        return { label: "Reveal Raw Image", glyph: "🖐️" };
      case "analyzed":
        return { label: "Reveal Analyzed Image", glyph: "🔎" };
      case "lines":
        return { label: "Reveal Palm Line Analysis", glyph: "🧬" };
      case "reading":
        return { label: "Reveal Palm Reading", glyph: "🔮" };
      default:
        return null;
    }
  }, [nextStage]);

  const navigateToStage = (next: RevealStage) => {
    if (next === "intro") {
      setStage("intro");
      return;
    }
    if (stageSequence.includes(next)) {
      setStage(next);
    }
  };

  const effectiveReadingContent = markdownContent ?? palmReadingText ?? "";
  const isChatGptGptLink = (href?: string) => Boolean(href && href.includes("chatgpt.com/g/"));

  const renderProNote = useCallback(
    (href?: string) =>
      isChatGptGptLink(href) ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
          Requires ChatGPT Pro subscription.
        </Typography>
      ) : null,
    [],
  );

  const readingBody = useMemo(
    () => (
      <Box
        sx={{
          p: 2,
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "var(--fabric-surface-border)",
          backgroundColor: (currentTheme) => alpha(currentTheme.palette.background.paper, 0.4),
          overflowY: "auto",
        }}
      >
        {effectiveReadingContent ? (
          <MarkdownContent
            content={effectiveReadingContent}
            sx={{
              "& h1, & h2, & h3, & h4, & h5, & h6": {
                mt: 1.5,
                mb: 0.75,
                fontWeight: 700,
                lineHeight: 1.25,
                color: "text.primary",
              },
              "& h1": { fontSize: "1.22rem" },
              "& h2": { fontSize: "1.1rem" },
              "& h3": { fontSize: "1rem" },
              "& p": {
                mb: 1.2,
                lineHeight: 1.7,
              },
              "& ul, & ol": {
                mb: 1.2,
              },
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {isMarkdownLoading
              ? "Loading reading..."
              : hasMarkdownLoadError
                ? "Reading text is unavailable."
                : "No reading text provided."}
          </Typography>
        )}
      </Box>
    ),
    [effectiveReadingContent, hasMarkdownLoadError, isMarkdownLoading],
  );

  const mediaItems = useMemo<MediaCyclerItem[]>(() => {
    const commonImagePanelSx = {
      height: "100%",
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "transparent",
      backgroundImage: "none",
      boxShadow: "none",
      backdropFilter: "none",
    } as const;

    const commonImageFrameSx = {
      mt: 0.2,
      mb: 0.1,
      width: "100%",
      flex: "1 1 auto",
      minHeight: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    } as const;

    const items: MediaCyclerItem[] = [
      {
        key: "raw",
        title: "Raw image",
        mediaType: "image",
        mediaUrl: rawImage,
        mediaAlt: `${title} raw image`,
        mediaLightboxTitle: `${title} — Raw Image`,
        lightboxCaption: rawCaption || rawSource,
        mediaCaption: rawCaption,
        mediaSource: rawSource,
        mediaSourceHref: rawSourceHref,
        panelSx: commonImagePanelSx,
        assetFrameSx: commonImageFrameSx,
        imageWidth: 1200,
        imageHeight: 900,
        imageClassName: "h-auto w-full rounded-[22px] bg-black/10 object-contain",
        imageStyle: {
          aspectRatio: "4 / 3",
          marginInline: "auto",
        },
        extraContent: renderProNote(rawSourceHref),
      },
    ];

    if (hasAnalyzedImage) {
      items.push({
        key: "analyzed",
        title: "Analyzed image",
        mediaType: "image",
        mediaUrl: analyzedImage,
        mediaAlt: `${title} analyzed image`,
        mediaLightboxTitle: `${title} — Analyzed Image`,
        lightboxCaption: analyzedCaption || analyzedSource,
        mediaCaption: analyzedCaption,
        mediaSource: analyzedSource,
        mediaSourceHref: analyzedSourceHref,
        panelSx: commonImagePanelSx,
        assetFrameSx: commonImageFrameSx,
        imageWidth: 1200,
        imageHeight: 900,
        imageClassName: "h-auto w-full rounded-[22px] bg-black/10 object-contain",
        imageStyle: {
          aspectRatio: "4 / 3",
          marginInline: "auto",
        },
        extraContent: renderProNote(analyzedSourceHref),
      });
    }

    if (hasLineImage) {
      items.push({
        key: "lines",
        title: "Palm line analysis image",
        mediaType: "image",
        mediaUrl: palmLineAnalysisImage,
        mediaAlt: `${title} palm line analysis image`,
        mediaLightboxTitle: `${title} — Palm Line Analysis`,
        lightboxCaption: palmLineAnalysisCaption || palmLineAnalysisSource,
        mediaCaption: palmLineAnalysisCaption,
        mediaSource: palmLineAnalysisSource,
        mediaSourceHref: palmLineAnalysisSourceHref,
        panelSx: commonImagePanelSx,
        assetFrameSx: commonImageFrameSx,
        imageWidth: 1200,
        imageHeight: 900,
        imageClassName: "h-auto w-full rounded-[22px] bg-black/10 object-contain",
        imageStyle: {
          aspectRatio: "4 / 3",
          marginInline: "auto",
        },
        extraContent: renderProNote(palmLineAnalysisSourceHref),
      });
    }

    items.push({
      key: "reading",
      title: palmReadingTitle || "Palm reading text",
      mediaType: "custom",
      mediaUrl: "",
      mediaSource: palmReadingSource,
      mediaSourceHref: palmReadingSourceHref,
      panelSx: {
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      },
      assetFrameSx: {
        mt: 0.2,
        mb: 0.1,
        width: "100%",
        flex: "1 1 auto",
        minHeight: 0,
        display: "flex",
      },
      customContentSx: {
        width: "100%",
        height: "100%",
        minHeight: 0,
      },
      customContent: readingBody,
      extraContent: renderProNote(palmReadingSourceHref),
    });

    return items;
  }, [
    analyzedCaption,
    analyzedImage,
    analyzedSource,
    analyzedSourceHref,
    hasAnalyzedImage,
    hasLineImage,
    palmLineAnalysisCaption,
    palmLineAnalysisImage,
    palmLineAnalysisSource,
    palmLineAnalysisSourceHref,
    palmReadingSource,
    palmReadingSourceHref,
    palmReadingTitle,
    rawCaption,
    rawImage,
    rawSource,
    rawSourceHref,
    renderProNote,
    readingBody,
    title,
  ]);

  const revealedItems = useMemo<MediaCyclerItem[]>(() => {
    if (stageIndex < 0) {
      return [];
    }
    return mediaItems.filter((item) => {
      const itemIndex = stageSequence.indexOf(item.key as PalmRevealStage);
      return itemIndex >= 0 && itemIndex <= stageIndex;
    });
  }, [mediaItems, stageIndex, stageSequence]);

  const activeMediaKey = stage === "intro" ? undefined : stage;
  const activeMediaIndex =
    activeMediaKey == null ? -1 : revealedItems.findIndex((item) => item.key === activeMediaKey);
  const hasPreviousMedia = activeMediaIndex > 0;
  const hasNextRevealedMedia = activeMediaIndex >= 0 && activeMediaIndex < revealedItems.length - 1;
  const canRevealNextFromCurrent = Boolean(nextStage);
  const showLoopNavigation =
    activeMediaIndex >= 0 &&
    activeMediaIndex === revealedItems.length - 1 &&
    !canRevealNextFromCurrent;

  const handleChevronPrevious = () => {
    if (!hasPreviousMedia) {
      return;
    }
    const previousMedia = revealedItems[activeMediaIndex - 1];
    if (previousMedia && stageSequence.includes(previousMedia.key as PalmRevealStage)) {
      setStage(previousMedia.key as PalmRevealStage);
    }
  };

  const handleChevronNext = () => {
    if (hasNextRevealedMedia) {
      const nextRevealedMedia = revealedItems[activeMediaIndex + 1];
      if (nextRevealedMedia && stageSequence.includes(nextRevealedMedia.key as PalmRevealStage)) {
        setStage(nextRevealedMedia.key as PalmRevealStage);
      }
      return;
    }
    if (nextStage && nextStage !== "intro") {
      setStage(nextStage);
    }
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
          boxShadow: "0 0 0 2px rgba(255,255,255,0.22) inset, 0 10px 24px rgba(127,29,29,0.18)",
          textShadow: "0 1px 0 rgba(255,255,255,0.3)",
          opacity: 0.92,
        }}
      >
        {rightsLabel}
      </Box>
    );
  };

  return (
    <AIShenaniganPanel>
      <Stack spacing={3}>
        <Stack
          spacing={2.5}
          direction={{ xs: "column", md: "row" }}
          sx={{
            alignItems: { xs: "stretch", md: "flex-start" },
            overflow: { xs: "hidden", md: "visible" },
          }}
        >
          <Box
            sx={{
              width: "100%",
              minWidth: { xs: 0, md: hasVisibleMedia ? 340 : 0 },
              maxWidth: { xs: "100%", md: hasVisibleMedia ? 340 : "100%" },
              flexBasis: {
                xs: "100%",
                md: hasVisibleMedia ? "340px" : "100%",
              },
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                position: {
                  xs: "static",
                  md: hasVisibleMedia ? "sticky" : "static",
                },
                top: { md: 104 },
                maxHeight: {
                  xs: "none",
                  md: hasVisibleMedia ? "calc(100dvh - 120px)" : "none",
                },
                overflowY: {
                  xs: "visible",
                  md: hasVisibleMedia ? "auto" : "visible",
                },
                overscrollBehaviorY: { md: "contain" },
                pr: { md: hasVisibleMedia ? 0.5 : 0 },
              }}
            >
              <Box
                className="relative overflow-hidden"
                sx={{
                  ...panelChromeSx,
                  p: { xs: 3, md: 3.5 },
                  boxShadow: "none",
                }}
              >
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
                {renderRightsStamp()}
                <Typography variant="h4" sx={{ mt: 1, mb: 2 }}>
                  {title}
                </Typography>
                {!(isSmallScreen && isInfoPanelMinimized) && (
                  <>
                    <Typography color="text.secondary" className="leading-7">
                      {blurb}
                    </Typography>
                    <Box sx={{ mt: 2.5 }}>
                      <AIShenaniganRevealNavigator
                        items={revealTimelineItems}
                        mode={revealMode}
                        onModeChange={setRevealMode}
                        onSelect={navigateToStage}
                        scope="main"
                      />
                    </Box>
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
                          <IconButton
                            aria-label="Start over"
                            onClick={() => navigateToStage("intro")}
                            sx={restartActionSx}
                          >
                            <Loop fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Box>
                        {nextAction ? (
                          <Button
                            variant="contained"
                            onClick={() => navigateToStage(nextStage!)}
                            endIcon={<EmojiGlyph glyph={nextAction.glyph} slot="end" />}
                          >
                            {nextAction.label}
                          </Button>
                        ) : (
                          stage !== "intro" && (
                            <IconButton
                              aria-label="Sequence finished: start over"
                              onClick={() => navigateToStage("intro")}
                              sx={restartActionSx}
                            >
                              <Loop fontSize="small" />
                            </IconButton>
                          )
                        )}
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              minWidth: 0,
              flex: "1 1 auto",
              width: "100%",
              maxWidth: {
                xs: "100%",
                md: hasVisibleMedia ? "calc(100% - 340px)" : 0,
              },
              flexBasis: {
                xs: "100%",
                md: hasVisibleMedia ? "calc(100% - 340px)" : "0px",
              },
              opacity: hasVisibleMedia ? 1 : 0,
              transform: hasVisibleMedia ? "translate3d(0, 0, 0)" : "translate3d(28px, 0, 0)",
              overflow: "hidden",
              pointerEvents: hasVisibleMedia ? "auto" : "none",
              transition:
                "opacity 320ms ease, transform 560ms cubic-bezier(.2,.8,.2,1), flex-basis 560ms cubic-bezier(.2,.8,.2,1), max-width 560ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            {hasVisibleMedia && revealedItems.length > 0 ? (
              <Box
                sx={{
                  ...panelChromeSx,
                  p: 2.5,
                  height: "100%",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <MediaCycler
                  spacing={0}
                  singlePanel
                  singlePanelActiveKey={activeMediaKey}
                  transitionMs={260}
                  showChevronNavigation
                  showCompactInfoButton={false}
                  navigationControlSx={mediaControlSx(theme)}
                  expandControlSx={mediaControlSx(theme)}
                  disableChevronPrevious={!hasPreviousMedia}
                  disableChevronNext={!hasNextRevealedMedia && !canRevealNextFromCurrent}
                  onChevronPrevious={handleChevronPrevious}
                  onChevronNext={handleChevronNext}
                  loopNavigation={showLoopNavigation}
                  onLoopNavigation={() => navigateToStage("intro")}
                  loopNavigationLabel="Restart palm reveal"
                  stackSx={{
                    height: "100%",
                    minHeight: 0,
                    display: "flex",
                    overflow: "hidden",
                  }}
                  items={revealedItems}
                />
              </Box>
            ) : null}
          </Box>
        </Stack>
      </Stack>
    </AIShenaniganPanel>
  );
}
