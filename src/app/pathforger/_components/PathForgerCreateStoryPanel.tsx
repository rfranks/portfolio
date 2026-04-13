import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Settings, Tune } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { PathForgerGeneratedImage } from "@/app/pathforger/_types/pipeline";

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

const genreOptions = [
  "Mystery",
  "Sci-fi",
  "Children's",
  "True Crime",
  "Horror",
  "Thriller",
  "Comic / Adventure",
  "Gothic",
  "Noir",
  "Supernatural",
];

const chapterLengthOptions: AdventureLength[] = [
  "Very short (1-2 lines)",
  "Short",
  "Medium",
  "Long",
  "Very long",
];

const mpaaRatings = ["G", "PG", "PG-13", "R", "NC-17"];

export default function PathForgerCreateStoryPanel(
  props: PathForgerCreateStoryPanelProps,
) {
  const {
    hidden,
    showMainCreateSpinner,
    coverImage,
    showPitchSelectionAnimation,
    pitchLoadingGifSrc,
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

  if (hidden) {
    return null;
  }

  if (showMainCreateSpinner) {
    return (
      <Paper
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
            <Box
              component="img"
              src={coverImage.imageDataUrl}
              alt="Cover preview"
              sx={{
                width: "auto",
                height: "60vh",
                objectFit: "cover",
                display: "block",
                ...kenBurnsImageSx,
              }}
            />
          </Paper>
        ) : null}
        {showPitchSelectionAnimation ? (
          <Box
            component="img"
            src={pitchLoadingGifSrc}
            alt="Generating story options"
            sx={{
              width: { xs: 220, md: 320 },
              maxWidth: "100%",
              height: "auto",
              display: "block",
            }}
          />
        ) : null}
        {!showPitchSelectionAnimation && (
          <CircularProgress size={88} thickness={4} />
        )}
        <Typography variant="h6" color="text.secondary">
          {statusText || "Working..."}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
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
        <Paper variant="outlined" sx={{ mb: 2, p: 1.25 }}>
          <Stack spacing={1.1} alignItems="center">
            <Box
              component="img"
              src={coverImage.imageDataUrl}
              alt="Cover preview"
              sx={{
                width: "100%",
                maxHeight: { xs: 220, md: 280 },
                objectFit: "cover",
                display: "block",
                borderRadius: 1,
                ...kenBurnsImageSx,
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
                      🪄
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
          >
            {genreOptions.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
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
          >
            {chapterLengthOptions.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
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
                          🪄
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
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Age Rating</FormLabel>
            <RadioGroup
              row
              value={ageRating}
              onChange={(event) => onAgeRatingChange(event.target.value)}
            >
              {mpaaRatings.map((rating) => (
                <FormControlLabel
                  key={rating}
                  value={rating}
                  control={<Radio size="small" />}
                  label={rating}
                />
              ))}
            </RadioGroup>
          </FormControl>
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
                          🪄
                        </Typography>
                      </IconButton>
                    </span>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
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
