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
import { Settings, Tune } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PathForgerGeneratedImage } from "@/app/pathforger/_types/pipeline";
import PathForgerGeneratedImageLightbox from "@/app/pathforger/_components/PathForgerGeneratedImageLightbox";

type ActiveRunAction =
  | "name"
  | "premise"
  | "style"
  | "pitch"
  | "chapter"
  | "nextChapter"
  | "pipeline"
  | "forgePath"
  | null;

type AdventureLength =
  | "Very short (1-2 lines)"
  | "Short"
  | "Medium"
  | "Long"
  | "Very long";

type PathForgerCreateStoryPanelProps = {
  hidden: boolean;
  showMainCreateSpinner: boolean;
  coverImage?: PathForgerGeneratedImage;
  showPitchSelectionAnimation: boolean;
  pitchLoadingGifSrc: string;
  chapterLoadingGifSrc: string;
  statusText: string;
  kenBurnsImageSx: SxProps<Theme>;
  controlsModalOpen: boolean;
  settingsModalOpen: boolean;
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

const chapterLengthOptionVisuals: Array<
  DecoratedOption & { label: AdventureLength }
> = [
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

export default function PathForgerCreateStoryPanel(
  props: PathForgerCreateStoryPanelProps,
) {
  const {
    hidden,
    showMainCreateSpinner,
    coverImage,
    showPitchSelectionAnimation,
    pitchLoadingGifSrc,
    chapterLoadingGifSrc,
    statusText,
    kenBurnsImageSx,
    controlsModalOpen,
    settingsModalOpen,
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
      chapterLengthOptionVisuals.find(
        (option) => option.label === adventureLength,
      ) ?? { label: adventureLength, emoji: "📏" },
    [adventureLength],
  );
  const createStoryPanelRef = React.useRef<HTMLDivElement | null>(null);
  const [dynamicCoverHeightPx, setDynamicCoverHeightPx] =
    React.useState<number | null>(null);
  const ageRatingPanelContainerRef = React.useRef<HTMLDivElement | null>(null);
  const ageRatingPanelRefs = React.useRef<
    Partial<Record<AgeRatingOption["value"], HTMLDivElement | null>>
  >({});
  const [ageRatingSelectionOutline, setAgeRatingSelectionOutline] =
    React.useState({
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
      setAgeRatingSelectionOutline((prev) =>
        prev.opacity === 0 ? prev : { ...prev, opacity: 0 },
      );
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
        setDynamicCoverHeightPx((prev) =>
          prev === nextHeight ? prev : nextHeight,
        );
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

  if (showMainCreateSpinner) {
    const normalizedStatusText = statusText.trim().toLowerCase();
    const showChapterLoadingAnimation =
      activeRunAction === "chapter" ||
      activeRunAction === "nextChapter" ||
      normalizedStatusText.includes("building chapter") ||
      normalizedStatusText.includes("forging chapter") ||
      normalizedStatusText.includes("generating chapter");
    const showLoadingAnimation =
      showPitchSelectionAnimation || showChapterLoadingAnimation;
    const loadingGifSrc = showChapterLoadingAnimation
      ? chapterLoadingGifSrc
      : pitchLoadingGifSrc;
    const loadingGifAlt = showChapterLoadingAnimation
      ? "Generating chapter package"
      : "Generating story options";

    return (
      <Paper
        ref={createStoryPanelRef}
        variant="outlined"
        sx={{
          p: { xs: 4, md: 6 },
          minHeight: { xs: 260, md: 320 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {coverImage ? (
          <Paper
            variant="outlined"
            sx={{
              width: "100%",
              maxWidth: 560,
              overflow: "hidden",
            }}
          >
            <PathForgerGeneratedImageLightbox
              src={coverImage.imageDataUrl}
              alt="Cover preview"
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
        {showLoadingAnimation ? (
          <Box
            component="img"
            src={loadingGifSrc}
            alt={loadingGifAlt}
            sx={{
              width: { xs: 220, md: 320 },
              maxWidth: "100%",
              height: "auto",
              display: "block",
            }}
          />
        ) : null}
        {!showLoadingAnimation && (
          <CircularProgress size={88} thickness={4} />
        )}
        <Typography variant="h6" color="text.secondary">
          {statusText || "Working..."}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper ref={createStoryPanelRef} variant="outlined" sx={{ p: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mb: 1,
        }}
      >
        <Typography variant="h5">Create your story!</Typography>
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
        </Stack>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Start forging your path...
      </Typography>
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
            <PathForgerGeneratedImageLightbox
              src={coverImage.imageDataUrl}
              alt="Cover preview"
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
            <CircularProgress size={30} thickness={4} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              {statusText || "Working..."}
            </Typography>
          </Stack>
        </Paper>
      ) : null}
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
                    <Typography
                      component="span"
                      sx={{ fontSize: "1.1rem", lineHeight: 1 }}
                    >
                      ⚡
                    </Typography>
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Genre"
            value={genre}
            onChange={(event) => onGenreChange(event.target.value)}
            SelectProps={{
              renderValue: () =>
                renderDecoratedOption(selectedGenreOption, "selected"),
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
              const option = genreOptionVisuals.find(
                (entry) => entry.label === item,
              ) ?? { label: item, emoji: "📚" };

              return (
                <MenuItem key={item} value={item} sx={{ py: 1.4, minHeight: 68 }}>
                  {renderDecoratedOption(option, "menu")}
                </MenuItem>
              );
            })}
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Chapter Length"
            value={adventureLength}
            onChange={(event) =>
              onAdventureLengthChange(event.target.value as AdventureLength)
            }
            SelectProps={{
              renderValue: () =>
                renderDecoratedOption(selectedChapterLengthOption, "selected"),
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

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={5}
            label="Premise"
            value={premise}
            onChange={(event) => onPremiseChange(event.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{ alignSelf: "flex-start", mt: 1 }}
                >
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
                        color={
                          activeRunAction === "premise" ? "primary" : "default"
                        }
                        size="small"
                      >
                        <Typography
                          component="span"
                          sx={{ fontSize: "1.1rem", lineHeight: 1 }}
                        >
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

        <Grid item xs={12}>
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
                        color={
                          activeRunAction === "style" ? "primary" : "default"
                        }
                        size="small"
                      >
                        <Typography
                          component="span"
                          sx={{ fontSize: "1.1rem", lineHeight: 1 }}
                        >
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

        <Grid item xs={12}>
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
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(5, minmax(0, 1fr))",
                },
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
                      <Typography
                        component="span"
                        sx={{ fontSize: "1.3rem", lineHeight: 1 }}
                      >
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
              ⚠️ Rated R selected: mature content may include stronger violence,
              language, and intense themes.
            </Alert>
          ) : null}
          {ageRating === "NC-17" ? (
            <Alert severity="error" sx={{ mt: 1.1, fontWeight: 700 }}>
              ⛔ Rated NC-17 selected: explicit adult content and extreme themes
              enabled.
            </Alert>
          ) : null}
        </Grid>
      </Grid>
      <Box
        sx={{
          mt: 2,
          pt: 2,
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
                <Typography
                  component="span"
                  sx={{ fontSize: "1.1rem", lineHeight: 1 }}
                >
                  🚀
                </Typography>
              }
              aria-label="Create your story"
            >
              Create it!
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Paper>
  );
}
