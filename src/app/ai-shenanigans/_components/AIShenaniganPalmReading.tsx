"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Loop from "@mui/icons-material/Loop";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import { EmojiGlyph } from "@/components/shared";
import { MarkdownContent } from "@/components/shared";
import { ImageLightbox } from "@/components/shared";
import AIShenaniganPanel from "./AIShenaniganPanel";
import { withBasePath } from "@/utils/basePath";

type RevealStage = "intro" | "raw" | "analyzed" | "lines" | "reading";

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

const STAGE_ORDER: RevealStage[] = ["intro", "raw", "analyzed", "lines", "reading"];

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
  const [stage, setStage] = useState<RevealStage>("intro");
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const [isMarkdownLoading, setIsMarkdownLoading] = useState(false);
  const [hasMarkdownLoadError, setHasMarkdownLoadError] = useState(false);
  const [rawMediaLoaded, setRawMediaLoaded] = useState(false);
  const [analyzedMediaLoaded, setAnalyzedMediaLoaded] = useState(false);
  const [linesMediaLoaded, setLinesMediaLoaded] = useState(false);
  const [pendingScrollStage, setPendingScrollStage] = useState<Exclude<
    RevealStage,
    "intro"
  > | null>(null);
  const rawPanelRef = useRef<HTMLDivElement | null>(null);
  const analyzedPanelRef = useRef<HTMLDivElement | null>(null);
  const linesPanelRef = useRef<HTMLDivElement | null>(null);
  const readingPanelRef = useRef<HTMLDivElement | null>(null);
  const formattedRank = `#${String(rank).padStart(2, "0")}`;
  const rightsLabel = rightsNotice || "Intent to Copyright";
  const rightsStampAngle = ((rank * 7) % 17) - 8;
  const hasVisibleMedia = stage !== "intro";
  const panelChromeSx = {
    borderRadius: "24px",
    border: "1px solid",
    borderColor: "var(--fabric-surface-border)",
    backgroundColor: "var(--fabric-surface-1)",
    backgroundImage: "linear-gradient(180deg, var(--fabric-inner-glow), transparent 34%)",
    boxShadow: "inset 0 1px 0 var(--fabric-inner-glow)",
    backdropFilter: "blur(var(--fabric-blur-sm))",
  } as const;
  const mediaPanelSx = {
    ...panelChromeSx,
    p: 2.5,
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

  const stageIndex = STAGE_ORDER.indexOf(stage);
  const isStageVisible = (candidate: Exclude<RevealStage, "intro">) =>
    STAGE_ORDER.indexOf(candidate) <= stageIndex;

  const nextStage = useMemo<RevealStage | null>(() => {
    switch (stage) {
      case "intro":
        return "raw";
      case "raw":
        return "analyzed";
      case "analyzed":
        return "lines";
      case "lines":
        return "reading";
      default:
        return null;
    }
  }, [stage]);

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

  const effectiveReadingContent = markdownContent ?? palmReadingText ?? "";
  const isChatGptGptLink = (href?: string) => Boolean(href && href.includes("chatgpt.com/g/"));
  const isStageReadyForScroll = useCallback(
    (candidate: Exclude<RevealStage, "intro">): boolean => {
      if (candidate === "raw") {
        return rawMediaLoaded;
      }
      if (candidate === "analyzed") {
        return !analyzedImage || analyzedMediaLoaded;
      }
      if (candidate === "lines") {
        return !palmLineAnalysisImage || linesMediaLoaded;
      }
      return !isMarkdownLoading;
    },
    [
      rawMediaLoaded,
      analyzedImage,
      analyzedMediaLoaded,
      palmLineAnalysisImage,
      linesMediaLoaded,
      isMarkdownLoading,
    ],
  );
  const getStageRef = useCallback((candidate: Exclude<RevealStage, "intro">) => {
    if (candidate === "raw") {
      return rawPanelRef;
    }
    if (candidate === "analyzed") {
      return analyzedPanelRef;
    }
    if (candidate === "lines") {
      return linesPanelRef;
    }
    return readingPanelRef;
  }, []);
  const navigateToStage = (nextStage: RevealStage) => {
    if (nextStage === "intro") {
      setPendingScrollStage(null);
      setStage(nextStage);
      return;
    }
    setPendingScrollStage(nextStage);
    setStage(nextStage);
  };

  useEffect(() => {
    if (!pendingScrollStage || stage !== pendingScrollStage) {
      return;
    }
    if (!isStageReadyForScroll(pendingScrollStage)) {
      return;
    }

    const targetRef = getStageRef(pendingScrollStage);
    if (!targetRef.current) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setPendingScrollStage(null);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [
    stage,
    pendingScrollStage,
    rawMediaLoaded,
    analyzedMediaLoaded,
    linesMediaLoaded,
    isMarkdownLoading,
    isStageReadyForScroll,
    getStageRef,
  ]);

  const renderSource = (label?: string, href?: string) => {
    if (!label) {
      return null;
    }

    return (
      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
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
        {isChatGptGptLink(href) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            Requires ChatGPT Pro subscription.
          </Typography>
        )}
      </Box>
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
                {/* <Button
                  size="small"
                  variant="text"
                  onClick={() =>
                    setIsInfoPanelMinimized((currentValue) => !currentValue)
                  }
                  endIcon={
                    <EmojiGlyph
                      glyph={isInfoPanelMinimized ? "🔽" : "🔼"}
                      slot="end"
                      size="0.95rem"
                    />
                  }
                  sx={{
                    mt: 0.25,
                    mb: 1,
                    display: { xs: "inline-flex", md: "none" },
                    alignSelf: "flex-start",
                  }}
                >
                  {isInfoPanelMinimized ? "Expand Panel" : "Minimize Panel"}
                </Button> */}
                {!(isSmallScreen && isInfoPanelMinimized) && (
                  <>
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
                      {[
                        { label: "Raw", key: "raw" as const },
                        { label: "Analyzed", key: "analyzed" as const },
                        { label: "Palm Lines", key: "lines" as const },
                        { label: "Reading", key: "reading" as const },
                      ].map((item) => {
                        const reached = isStageVisible(item.key);
                        const active = stage === item.key;
                        return (
                          <Chip
                            key={item.key}
                            label={item.label}
                            color={active ? "primary" : "default"}
                            variant={active ? "filled" : "outlined"}
                            size="small"
                            clickable={reached}
                            onClick={
                              reached
                                ? () => {
                                    navigateToStage(item.key);
                                  }
                                : undefined
                            }
                          />
                        );
                      })}
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

          <Stack
            spacing={2}
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
            {isStageVisible("raw") && (
              <Box sx={mediaPanelSx} ref={rawPanelRef}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Raw image
                </Typography>
                <ImageLightbox
                  src={withBasePath(rawImage)}
                  alt={`${title} raw image`}
                  title={`${title} — Raw Image`}
                  caption={rawCaption || rawSource}
                >
                  <Image
                    src={withBasePath(rawImage)}
                    alt={`${title} raw image`}
                    width={1200}
                    height={900}
                    className="h-auto w-full rounded-[22px] bg-black/10 object-contain"
                    style={{ aspectRatio: "4 / 3", marginInline: "auto" }}
                    onLoad={() => setRawMediaLoaded(true)}
                    onError={() => setRawMediaLoaded(true)}
                  />
                </ImageLightbox>
                {renderSource(rawSource, rawSourceHref)}
                {rawCaption && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: rawSource ? 0.75 : 1.5 }}
                  >
                    {rawCaption}
                  </Typography>
                )}
              </Box>
            )}

            {isStageVisible("analyzed") && analyzedImage && (
              <Box sx={mediaPanelSx} ref={analyzedPanelRef}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Analyzed image
                </Typography>
                <ImageLightbox
                  src={withBasePath(analyzedImage)}
                  alt={`${title} analyzed image`}
                  title={`${title} — Analyzed Image`}
                  caption={analyzedCaption || analyzedSource}
                >
                  <Image
                    src={withBasePath(analyzedImage)}
                    alt={`${title} analyzed image`}
                    width={1200}
                    height={900}
                    className="h-auto w-full rounded-[22px] bg-black/10 object-contain"
                    style={{ aspectRatio: "4 / 3", marginInline: "auto" }}
                    onLoad={() => setAnalyzedMediaLoaded(true)}
                    onError={() => setAnalyzedMediaLoaded(true)}
                  />
                </ImageLightbox>
                {renderSource(analyzedSource, analyzedSourceHref)}
                {analyzedCaption && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: analyzedSource ? 0.75 : 1.5 }}
                  >
                    {analyzedCaption}
                  </Typography>
                )}
              </Box>
            )}

            {isStageVisible("lines") && palmLineAnalysisImage && (
              <Box sx={mediaPanelSx} ref={linesPanelRef}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Palm line analysis image
                </Typography>
                <ImageLightbox
                  src={withBasePath(palmLineAnalysisImage)}
                  alt={`${title} palm line analysis image`}
                  title={`${title} — Palm Line Analysis`}
                  caption={palmLineAnalysisCaption || palmLineAnalysisSource}
                >
                  <Image
                    src={withBasePath(palmLineAnalysisImage)}
                    alt={`${title} palm line analysis image`}
                    width={1200}
                    height={900}
                    className="h-auto w-full rounded-[22px] bg-black/10 object-contain"
                    style={{ aspectRatio: "4 / 3", marginInline: "auto" }}
                    onLoad={() => setLinesMediaLoaded(true)}
                    onError={() => setLinesMediaLoaded(true)}
                  />
                </ImageLightbox>
                {renderSource(palmLineAnalysisSource, palmLineAnalysisSourceHref)}
                {palmLineAnalysisCaption && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: palmLineAnalysisSource ? 0.75 : 1.5 }}
                  >
                    {palmLineAnalysisCaption}
                  </Typography>
                )}
              </Box>
            )}

            {isStageVisible("reading") && (
              <Box sx={mediaPanelSx} ref={readingPanelRef}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {palmReadingTitle || "Palm reading text"}
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "16px",
                    border: "1px solid",
                    borderColor: "var(--fabric-surface-border)",
                    backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.4),
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
                {renderSource(palmReadingSource, palmReadingSourceHref)}
              </Box>
            )}
          </Stack>
        </Stack>
      </Stack>
    </AIShenaniganPanel>
  );
}
