import * as React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ChevronRight, Close, Settings, Tune } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PathForgerGeneratedImage } from "@/app/pathforger/_types/pipeline";
import type { JourneyLedgerPlaybackViewModel } from "@/app/pathforger/_types/journeyLedger";
import { ImageLightbox } from "@/components/shared";
import PathForgerJourneyLedgerCarousel from "@/app/pathforger/_components/PathForgerJourneyLedgerCarousel";

type ActiveRunAction =
  | "name"
  | "premise"
  | "style"
  | "tone"
  | "pitch"
  | "chapter"
  | "nextChapter"
  | "pipeline"
  | "forgePath"
  | null;

type AdventureLength = "Very short (1-2 lines)" | "Short" | "Medium" | "Long" | "Very long";

type PathForgerCreateStoryPanelProps = {
  hidden: boolean;
  showMainCreateSpinner: boolean;
  coverImage?: PathForgerGeneratedImage;
  coverImageTitle?: string;
  coverImageCaption?: string;
  showPitchSelectionAnimation: boolean;
  pitchLoadingGifSrc: string;
  chapterLoadingGifSrc: string;
  pathForgingGifSrc: string;
  nextChapterLedgerPlayback: JourneyLedgerPlaybackViewModel;
  onLedgerPlaybackPrevious?: () => void;
  onLedgerPlaybackNext?: () => void;
  onLedgerPlaybackContinue?: () => void;
  statusText: string;
  kenBurnsImageSx: SxProps<Theme>;
  controlsModalOpen: boolean;
  settingsModalOpen: boolean;
  showToolbarCloseButton?: boolean;
  onCloseFromToolbar?: () => void;
  onOpenControls: () => void;
  onOpenSettings: () => void;
  statusIsRunning: boolean;
  protagonistPreference: string;
  onProtagonistPreferenceChange: (value: string) => void;
  onGenerateProtagonistName: () => void | Promise<void>;
  genre: string;
  onGenreChange: (value: string) => void;
  adventureLength: AdventureLength;
  onAdventureLengthChange: (value: AdventureLength) => void;
  visualStyle: string;
  onVisualStyleChange: (value: string) => void;
  onGenerateVisualStyle: () => void | Promise<void>;
  tone: string;
  onToneChange: (value: string) => void;
  onGenerateTone: () => void | Promise<void>;
  ageRating: string;
  onAgeRatingChange: (value: string) => void;
  premise: string;
  onPremiseChange: (value: string) => void;
  onGeneratePremise: () => void | Promise<void>;
  activeRunAction: ActiveRunAction;
  isRunning: boolean;
  onCreateIt: () => void | Promise<void>;
};

type DecoratedOption = {
  label: string;
  emoji: string;
};
type AgeRatingOption = {
  value: string;
  emoji: string;
  label: string;
};

const genreOptionVisuals: DecoratedOption[] = [
  {
    label: "Mystery",
    emoji: "🕵️",
  },
  {
    label: "Sci-fi",
    emoji: "🛸",
  },
  {
    label: "Children's",
    emoji: "🧸",
  },
  {
    label: "True Crime",
    emoji: "🕵️‍♂️",
  },
  {
    label: "Historical Fiction",
    emoji: "📜",
  },
  {
    label: "Medical Drama",
    emoji: "🩺",
  },
  {
    label: "Horror",
    emoji: "👻",
  },
  {
    label: "Thriller",
    emoji: "🎯",
  },
  {
    label: "Comic / Adventure",
    emoji: "🦸",
  },
  {
    label: "Gothic",
    emoji: "🕯️",
  },
  {
    label: "Noir",
    emoji: "🎬",
  },
  {
    label: "Supernatural",
    emoji: "🔮",
  },
];

const genreOptions = genreOptionVisuals.map((option) => option.label);

const chapterLengthOptionVisuals: Array<DecoratedOption & { label: AdventureLength }> = [
  {
    label: "Very short (1-2 lines)",
    emoji: "⚡",
  },
  {
    label: "Short",
    emoji: "⏱️",
  },
  {
    label: "Medium",
    emoji: "📖",
  },
  {
    label: "Long",
    emoji: "🧭",
  },
  {
    label: "Very long",
    emoji: "🏔️",
  },
];

const ageRatingOptions: AgeRatingOption[] = [
  { value: "G", emoji: "🧒", label: "G" },
  { value: "PG", emoji: "👨‍👩‍👧", label: "PG" },
  { value: "PG-13", emoji: "🎬", label: "PG-13" },
  { value: "R", emoji: "⚠️", label: "R" },
  { value: "NC-17", emoji: "⛔", label: "NC-17" },
];
function renderDecoratedOption(
  option: { label: string; emoji: string },
  variant: "selected" | "menu" = "selected",
) {
  const emojiFontSize = variant === "menu" ? "2.2rem" : "2.3rem";
  const labelFontSize = variant === "menu" ? "1.58rem" : "1.68rem";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
      <Typography component="span" sx={{ lineHeight: 1, fontSize: emojiFontSize }}>
        {option.emoji}
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize: labelFontSize, fontWeight: 700, lineHeight: 1.1 }}
      >
        {option.label}
      </Typography>
    </Box>
  );
}

export default function PathForgerCreateStoryPanel(props: PathForgerCreateStoryPanelProps) {
  const {
    hidden,
    showMainCreateSpinner,
    coverImage,
    coverImageTitle,
    coverImageCaption,
    showPitchSelectionAnimation,
    pitchLoadingGifSrc,
    chapterLoadingGifSrc,
    pathForgingGifSrc,
    nextChapterLedgerPlayback,
    onLedgerPlaybackPrevious,
    onLedgerPlaybackNext,
    onLedgerPlaybackContinue,
    statusText,
    kenBurnsImageSx,
    controlsModalOpen,
    settingsModalOpen,
    showToolbarCloseButton = false,
    onCloseFromToolbar,
    onOpenControls,
    onOpenSettings,
    statusIsRunning,
    protagonistPreference,
    onProtagonistPreferenceChange,
    onGenerateProtagonistName,
    genre,
    onGenreChange,
    adventureLength,
    onAdventureLengthChange,
    visualStyle,
    onVisualStyleChange,
    onGenerateVisualStyle,
    tone,
    onToneChange,
    onGenerateTone,
    ageRating,
    onAgeRatingChange,
    premise,
    onPremiseChange,
    onGeneratePremise,
    activeRunAction,
    isRunning,
    onCreateIt,
  } = props;
  const selectedGenreOption = React.useMemo(
    () =>
      genreOptionVisuals.find((option) => option.label === genre) ?? {
        label: genre,
        emoji: "📚",
      },
    [genre],
  );
  const selectedChapterLengthOption = React.useMemo(
    () =>
      chapterLengthOptionVisuals.find((option) => option.label === adventureLength) ?? {
        label: adventureLength,
        emoji: "📏",
      },
    [adventureLength],
  );
  const createStoryPanelRef = React.useRef<HTMLDivElement | null>(null);
  const [dynamicCoverHeightPx, setDynamicCoverHeightPx] = React.useState<number | null>(null);
  const ageRatingPanelContainerRef = React.useRef<HTMLDivElement | null>(null);
  const ageRatingPanelRefs = React.useRef<
    Partial<Record<AgeRatingOption["value"], HTMLDivElement | null>>
  >({});
  const [ageRatingSelectionOutline, setAgeRatingSelectionOutline] = React.useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const updateAgeRatingSelectionOutline = React.useCallback(() => {
    const container = ageRatingPanelContainerRef.current;
    const activePanel = ageRatingPanelRefs.current[ageRating];

    if (!container || !activePanel) {
      setAgeRatingSelectionOutline((prev) => (prev.opacity === 0 ? prev : { ...prev, opacity: 0 }));
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const panelRect = activePanel.getBoundingClientRect();
    setAgeRatingSelectionOutline({
      top: panelRect.top - containerRect.top,
      left: panelRect.left - containerRect.left,
      width: panelRect.width,
      height: panelRect.height,
      opacity: 1,
    });
  }, [ageRating]);

  React.useLayoutEffect(() => {
    updateAgeRatingSelectionOutline();
  }, [updateAgeRatingSelectionOutline]);

  React.useEffect(() => {
    const handleResize = () => {
      updateAgeRatingSelectionOutline();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateAgeRatingSelectionOutline]);

  React.useEffect(() => {
    if (!statusIsRunning || !coverImage) {
      setDynamicCoverHeightPx(null);
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    const panelNode = createStoryPanelRef.current;
    if (!panelNode) {
      return;
    }

    let rafId = 0;
    const scheduleMeasure = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        const panelRect = panelNode.getBoundingClientRect();
        const overflowPx = Math.max(0, panelRect.bottom + 8 - window.innerHeight);
        const baseHeight = window.innerWidth >= 900 ? 280 : 220;
        const minHeight = 56;
        const nextHeight = Math.round(
          Math.max(minHeight, Math.min(baseHeight, baseHeight - overflowPx)),
        );
        setDynamicCoverHeightPx((prev) => (prev === nextHeight ? prev : nextHeight));
      });
    };

    scheduleMeasure();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            scheduleMeasure();
          })
        : null;
    observer?.observe(panelNode);
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      observer?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [coverImage, statusIsRunning]);

  if (hidden) {
    return null;
  }

  const panelHeader = (
    <Box
      sx={{
        px: { xs: 1.5, md: 2.5 },
        py: 1.25,
        borderBottom: "1px solid",
        borderColor: "divider",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5">Create your story!</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          Start forging your path...
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Tooltip title="Controls">
          <span>
            <IconButton
              aria-label="Open story and image controls"
              onClick={onOpenControls}
              color={controlsModalOpen ? "primary" : "default"}
              sx={{
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Tune />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Settings">
          <span>
            <IconButton
              aria-label="Open settings"
              onClick={onOpenSettings}
              color={settingsModalOpen ? "primary" : "default"}
              sx={{
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Settings />
            </IconButton>
          </span>
        </Tooltip>
        {showToolbarCloseButton ? (
          <Tooltip title="Close">
            <span>
              <IconButton
                aria-label="Close create story panel"
                onClick={onCloseFromToolbar}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Close />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
      </Stack>
    </Box>
  );

  if (showMainCreateSpinner) {
    const normalizedStatusText = statusText.trim().toLowerCase();
    const showPathForgingAnimation =
      activeRunAction === "forgePath" ||
      normalizedStatusText.includes("forging option") ||
      normalizedStatusText.includes("forging path");
    const showChapterLoadingAnimation =
      !showPathForgingAnimation &&
      (activeRunAction === "chapter" ||
        activeRunAction === "nextChapter" ||
        normalizedStatusText.includes("building chapter") ||
        normalizedStatusText.includes("forging chapter") ||
        normalizedStatusText.includes("generating chapter"));
    const showLoadingAnimation =
      showPathForgingAnimation || showPitchSelectionAnimation || showChapterLoadingAnimation;
    const loadingGifSrc = showPathForgingAnimation
      ? pathForgingGifSrc
      : showChapterLoadingAnimation
        ? chapterLoadingGifSrc
        : pitchLoadingGifSrc;
    const loadingGifAlt = showPathForgingAnimation
      ? "Forging selected path"
      : showChapterLoadingAnimation
        ? "Generating chapter package"
        : "Generating story options";
    const showLedgerPlayback =
      nextChapterLedgerPlayback.active &&
      (activeRunAction === "nextChapter" || !showPathForgingAnimation);

    return (
      <Box
        sx={(theme) => ({
          position: "fixed",
          inset: 0,
          zIndex: theme.zIndex.modal,
          display: "flex",
        })}
      >
        <Paper
          ref={createStoryPanelRef}
          variant="outlined"
          sx={{
            border: "none",
            width: "100%",
            mx: "auto",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: { xs: 1.5, md: 2.5 },
              py: { xs: 2, md: 2.5 },
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <Stack spacing={2} alignItems="center">
              {coverImage ? (
                <Paper
                  variant="outlined"
                  sx={{
                    width: "100%",
                    maxWidth: 560,
                    overflow: "hidden",
                  }}
                >
                  <ImageLightbox
                    src={coverImage.imageDataUrl}
                    alt="Cover preview"
                    title={coverImageTitle || "Story Cover"}
                    caption={coverImageCaption || "Book cover concept art"}
                    kenBurnsImageSx={kenBurnsImageSx}
                    previewImageSx={{
                      height:
                        dynamicCoverHeightPx !== null
                          ? `${Math.max(dynamicCoverHeightPx + 120, 140)}px`
                          : { xs: "42vh", md: "54vh" },
                    }}
                  />
                </Paper>
              ) : null}
              {showLedgerPlayback ? (
                <PathForgerJourneyLedgerCarousel
                  currentEntry={nextChapterLedgerPlayback.currentEntry}
                  currentIndex={nextChapterLedgerPlayback.currentIndex}
                  total={nextChapterLedgerPlayback.total}
                  chapterNumber={nextChapterLedgerPlayback.chapterNumber}
                  waitingForChapter={nextChapterLedgerPlayback.waitingForChapter}
                  canGoPrevious={nextChapterLedgerPlayback.canGoPrevious}
                  canGoNext={nextChapterLedgerPlayback.canGoNext}
                  isLastEntry={nextChapterLedgerPlayback.isLastEntry}
                  onPrevious={onLedgerPlaybackPrevious ?? (() => {})}
                  onNext={onLedgerPlaybackNext ?? (() => {})}
                  onLastAction={onLedgerPlaybackContinue ?? (() => {})}
                  rightActionMode="continue-button"
                  lastActionLabel="Continue"
                  disableLastAction={nextChapterLedgerPlayback.waitingForChapter}
                  maxWidth={760}
                />
              ) : null}
              {showLoadingAnimation && !showLedgerPlayback ? (
                <Box
                  component="img"
                  src={loadingGifSrc}
                  alt={loadingGifAlt}
                  sx={{
                    width: "100%",
                    maxWidth: 760,
                    height: "auto",
                    display: "block",
                  }}
                />
              ) : null}
              {!showLoadingAnimation && !showLedgerPlayback && (
                <CircularProgress size={88} thickness={4} />
              )}
              <Typography variant="h6" color="text.secondary">
                {statusText || "Working..."}
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        position: "fixed",
        inset: 0,
        zIndex: theme.zIndex.modal,
        display: "flex",
      })}
    >
      <Paper
        ref={createStoryPanelRef}
        variant="outlined"
        sx={{
          border: "none",
          width: "100%",
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {panelHeader}
        <Box
          sx={{
            px: { xs: 1.5, md: 2.5 },
            py: 1.5,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {statusIsRunning && coverImage ? (
            <Paper
              variant="outlined"
              sx={{
                mb: 2,
                p: 1.25,
                flexShrink: 1,
                overflow: "hidden",
              }}
            >
              <Stack spacing={1.1} alignItems="center">
                <ImageLightbox
                  src={coverImage.imageDataUrl}
                  alt="Cover preview"
                  title={coverImageTitle || "Story Cover"}
                  caption={coverImageCaption || "Book cover concept art"}
                  kenBurnsImageSx={kenBurnsImageSx}
                  previewImageSx={{
                    height:
                      dynamicCoverHeightPx !== null
                        ? `${dynamicCoverHeightPx}px`
                        : { xs: 220, md: 280 },
                    maxHeight:
                      dynamicCoverHeightPx !== null
                        ? `${dynamicCoverHeightPx}px`
                        : { xs: 220, md: 280 },
                    borderRadius: 1,
                  }}
                />
                {activeRunAction === "forgePath" ? (
                  <Box
                    component="img"
                    src={pathForgingGifSrc}
                    alt="Forging selected path"
                    sx={{
                      width: { xs: 132, md: 164 },
                      maxWidth: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                ) : (
                  <CircularProgress size={30} thickness={4} />
                )}
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                  {statusText || "Working..."}
                </Typography>
              </Stack>
            </Paper>
          ) : null}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} sx={{ order: 1 }}>
              <TextField
                select
                fullWidth
                label="Genre"
                value={genre}
                onChange={(event) => onGenreChange(event.target.value)}
                SelectProps={{
                  renderValue: () => renderDecoratedOption(selectedGenreOption, "selected"),
                }}
                sx={{
                  "& .MuiSelect-select": {
                    display: "flex",
                    alignItems: "center",
                    minHeight: "3.6rem !important",
                    py: 0.75,
                  },
                }}
              >
                {genreOptions.map((item) => {
                  const option = genreOptionVisuals.find((entry) => entry.label === item) ?? {
                    label: item,
                    emoji: "📚",
                  };

                  return (
                    <MenuItem key={item} value={item} sx={{ py: 1.4, minHeight: 68 }}>
                      {renderDecoratedOption(option, "menu")}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6} sx={{ order: 4 }}>
              <TextField
                fullWidth
                label="Protagonist Name Preference"
                placeholder="Auto-generate a name"
                value={protagonistPreference}
                onChange={(event) => onProtagonistPreferenceChange(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title={
                          activeRunAction === "name"
                            ? "Forging protagonist name..."
                            : "Generate protagonist name"
                        }
                      >
                        <span>
                          <IconButton
                            edge="end"
                            aria-label="Generate protagonist name"
                            onClick={onGenerateProtagonistName}
                            disabled={isRunning}
                            color={activeRunAction === "name" ? "primary" : "default"}
                            size="small"
                          >
                            <Typography component="span" sx={{ fontSize: "1.1rem", lineHeight: 1 }}>
                              ⚡
                            </Typography>
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sx={{ order: 5 }}>
              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Premise"
                value={premise}
                onChange={(event) => onPremiseChange(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ alignSelf: "flex-start", mt: 1 }}>
                      <Tooltip
                        title={
                          activeRunAction === "premise"
                            ? "Forging premise..."
                            : "Generate premise from genre"
                        }
                      >
                        <span>
                          <IconButton
                            edge="end"
                            aria-label="Generate premise"
                            onClick={onGeneratePremise}
                            disabled={isRunning}
                            color={activeRunAction === "premise" ? "primary" : "default"}
                            size="small"
                          >
                            <Typography component="span" sx={{ fontSize: "1.1rem", lineHeight: 1 }}>
                              ⚡
                            </Typography>
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sx={{ order: 6 }}>
              <TextField
                fullWidth
                label="Tone"
                value={tone}
                onChange={(event) => onToneChange(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title={
                          activeRunAction === "tone" ? "Forging tone..." : "Generate story tone"
                        }
                      >
                        <span>
                          <IconButton
                            edge="end"
                            aria-label="Generate story tone"
                            onClick={onGenerateTone}
                            disabled={isRunning}
                            color={activeRunAction === "tone" ? "primary" : "default"}
                            size="small"
                          >
                            <Typography component="span" sx={{ fontSize: "1.1rem", lineHeight: 1 }}>
                              ⚡
                            </Typography>
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sx={{ order: 7 }}>
              <TextField
                fullWidth
                label="Style"
                value={visualStyle}
                onChange={(event) => onVisualStyleChange(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title={
                          activeRunAction === "style"
                            ? "Forging visual style..."
                            : "Generate visual style"
                        }
                      >
                        <span>
                          <IconButton
                            edge="end"
                            aria-label="Generate visual style"
                            onClick={onGenerateVisualStyle}
                            disabled={isRunning}
                            color={activeRunAction === "style" ? "primary" : "default"}
                            size="small"
                          >
                            <Typography component="span" sx={{ fontSize: "1.1rem", lineHeight: 1 }}>
                              ⚡
                            </Typography>
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sx={{ order: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.85 }}>
                Age Rating
              </Typography>
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={(theme) => ({
                    position: "absolute",
                    top: ageRatingSelectionOutline.top,
                    left: ageRatingSelectionOutline.left,
                    width: ageRatingSelectionOutline.width,
                    height: ageRatingSelectionOutline.height,
                    border: "2px solid",
                    borderColor: theme.palette.primary.main,
                    borderRadius: 1.5,
                    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                    opacity: ageRatingSelectionOutline.opacity,
                    transition:
                      "top 320ms cubic-bezier(0.22, 1, 0.36, 1), " +
                      "left 320ms cubic-bezier(0.22, 1, 0.36, 1), " +
                      "width 320ms cubic-bezier(0.22, 1, 0.36, 1), " +
                      "height 320ms cubic-bezier(0.22, 1, 0.36, 1), " +
                      "opacity 180ms ease-out",
                    pointerEvents: "none",
                    zIndex: 2,
                  })}
                />
                <Box
                  ref={ageRatingPanelContainerRef}
                  role="radiogroup"
                  aria-label="Age Rating"
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gap: 1,
                  }}
                >
                  {ageRatingOptions.map((rating) => {
                    const isSelected = ageRating === rating.value;
                    const isWarning = rating.value === "R";
                    const isError = rating.value === "NC-17";

                    return (
                      <Paper
                        key={rating.value}
                        ref={(node) => {
                          ageRatingPanelRefs.current[rating.value] = node;
                        }}
                        variant="outlined"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => onAgeRatingChange(rating.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onAgeRatingChange(rating.value);
                          }
                        }}
                        sx={(theme) => ({
                          px: 1.1,
                          py: 1,
                          minHeight: 84,
                          cursor: "pointer",
                          borderRadius: 1.5,
                          borderColor: "divider",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          transition:
                            "background-color 240ms cubic-bezier(0.22, 1, 0.36, 1), transform 200ms ease",
                          backgroundColor: isSelected
                            ? isError
                              ? theme.palette.mode === "dark"
                                ? "rgba(244, 67, 54, 0.18)"
                                : "rgba(244, 67, 54, 0.12)"
                              : isWarning
                                ? theme.palette.mode === "dark"
                                  ? "rgba(255, 152, 0, 0.2)"
                                  : "rgba(255, 152, 0, 0.12)"
                                : theme.palette.mode === "dark"
                                  ? "rgba(79, 180, 255, 0.12)"
                                  : "rgba(79, 180, 255, 0.08)"
                            : "transparent",
                          "&:hover": {
                            transform: "translateY(-1px)",
                          },
                        })}
                      >
                        <Stack spacing={0.25} alignItems="center">
                          <Typography component="span" sx={{ fontSize: "1.3rem", lineHeight: 1 }}>
                            {rating.emoji}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              fontSize: "1.14rem",
                              fontWeight: 700,
                              lineHeight: 1.1,
                            }}
                          >
                            {rating.label}
                          </Typography>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
              {ageRating === "R" ? (
                <Alert severity="warning" sx={{ mt: 1.1 }}>
                  ⚠️ Rated R selected: mature content may include stronger violence, language, and
                  intense themes.
                </Alert>
              ) : null}
              {ageRating === "NC-17" ? (
                <Alert severity="error" sx={{ mt: 1.1, fontWeight: 700 }}>
                  ⛔ Rated NC-17 selected: explicit adult content and extreme themes enabled.
                </Alert>
              ) : null}
            </Grid>

            <Grid item xs={12} sx={{ order: 3 }}>
              <TextField
                select
                fullWidth
                label="Chapter Length"
                value={adventureLength}
                onChange={(event) => onAdventureLengthChange(event.target.value as AdventureLength)}
                SelectProps={{
                  renderValue: () => renderDecoratedOption(selectedChapterLengthOption, "selected"),
                }}
                sx={{
                  "& .MuiSelect-select": {
                    display: "flex",
                    alignItems: "center",
                    minHeight: "3.6rem !important",
                    py: 0.75,
                  },
                }}
              >
                {chapterLengthOptionVisuals.map((item) => (
                  <MenuItem key={item.label} value={item.label} sx={{ py: 1.4, minHeight: 68 }}>
                    {renderDecoratedOption(item, "menu")}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            px: { xs: 1.5, md: 2.5 },
            py: 1.25,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Tooltip title="Create your story!">
            <span>
              <Button
                variant="contained"
                onClick={onCreateIt}
                disabled={isRunning}
                startIcon={
                  <Typography component="span" sx={{ fontSize: "1.1rem", lineHeight: 1 }}>
                    🚀
                  </Typography>
                }
                endIcon={<ChevronRight />}
                aria-label="Create your story"
              >
                Create it!
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Paper>
    </Box>
  );
}
