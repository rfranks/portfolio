import * as React from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Image as ImageIcon } from "@mui/icons-material";
import PathForgerModelAutocomplete from "@/app/pathforger/_components/PathForgerModelAutocomplete";

type RomanceMode = "No romance" | "Optional romance" | "Romance-forward";

type PathForgerControlsDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultModel: string;
  textModel: string;
  imageModel: string;
  modelOptions: string[];
  loadingModelOptions: boolean;
  defaultModelFallback: string;
  textModelFallback: string;
  imageModelFallback: string;
  onDefaultModelChange: (value: string) => void;
  onTextModelChange: (value: string) => void;
  onImageModelChange: (value: string) => void;
  tone: string;
  onToneChange: (value: string) => void;
  romanceMode: RomanceMode;
  onRomanceModeChange: (value: RomanceMode) => void;
  onOpenRenderImageCalls: () => void;
  personalizedImages: boolean;
  onPersonalizedImagesChange: (checked: boolean) => void;
  onSelfieChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void | Promise<void>;
  selfieName: string;
};

export default function PathForgerControlsDialog(
  props: PathForgerControlsDialogProps,
) {
  const {
    open,
    onClose,
    defaultModel,
    textModel,
    imageModel,
    modelOptions,
    loadingModelOptions,
    defaultModelFallback,
    textModelFallback,
    imageModelFallback,
    onDefaultModelChange,
    onTextModelChange,
    onImageModelChange,
    tone,
    onToneChange,
    romanceMode,
    onRomanceModeChange,
    onOpenRenderImageCalls,
    personalizedImages,
    onPersonalizedImagesChange,
    onSelfieChange,
    selfieName,
  } = props;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Controls</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle1" gutterBottom>
              Story Controls
            </Typography>
            <PathForgerModelAutocomplete
              label="Default Model"
              value={defaultModel}
              options={modelOptions}
              loading={loadingModelOptions}
              fallbackValue={defaultModelFallback}
              onChange={onDefaultModelChange}
              helperText={
                loadingModelOptions
                  ? "Loading exhaustive model list..."
                  : "Used for wand/one-off LLM calls and unspecified model fallbacks."
              }
              sx={{ mb: 1.5 }}
            />
            <PathForgerModelAutocomplete
              label="Text Model"
              value={textModel}
              options={modelOptions}
              loading={loadingModelOptions}
              fallbackValue={textModelFallback}
              onChange={onTextModelChange}
              helperText={
                loadingModelOptions ? "Loading exhaustive model list..." : undefined
              }
              sx={{ mb: 1.5 }}
            />
            <TextField
              fullWidth
              label="Tone"
              value={tone}
              onChange={(event) => onToneChange(event.target.value)}
              sx={{ mb: 1.5 }}
            />
            <TextField
              select
              fullWidth
              label="Romance"
              value={romanceMode}
              onChange={(event) =>
                onRomanceModeChange(event.target.value as RomanceMode)
              }
            >
              <MenuItem value="No romance">No romance</MenuItem>
              <MenuItem value="Optional romance">Optional romance</MenuItem>
              <MenuItem value="Romance-forward">Romance-forward</MenuItem>
            </TextField>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle1" gutterBottom>
              Image Controls
            </Typography>
            <PathForgerModelAutocomplete
              label="Image Model"
              value={imageModel}
              options={modelOptions}
              loading={loadingModelOptions}
              fallbackValue={imageModelFallback}
              onChange={onImageModelChange}
              helperText={
                loadingModelOptions ? "Loading exhaustive model list..." : undefined
              }
              sx={{ mb: 0.75 }}
            />
            <Link
              component="button"
              type="button"
              underline="hover"
              variant="body2"
              onClick={onOpenRenderImageCalls}
              sx={{ display: "block", mb: 0.75, width: "fit-content" }}
            >
              Configure Render image calls
            </Link>

            <FormControlLabel
              sx={{ mt: 1.5 }}
              control={
                <Checkbox
                  checked={personalizedImages}
                  onChange={(event) =>
                    onPersonalizedImagesChange(event.target.checked)
                  }
                />
              }
              label="Use personalized images (requires selfie/headshot)"
            />

            <Stack sx={{ mt: 1.5 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                disabled={!personalizedImages}
              >
                Upload Selfie/Headshot
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={onSelfieChange}
                />
              </Button>
              {selfieName ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Loaded: {selfieName}
                </Typography>
              ) : null}
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
