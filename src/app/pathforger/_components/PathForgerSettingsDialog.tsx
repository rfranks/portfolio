import * as React from "react";
import { AutoStories } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { PathForgerBranchChoice } from "@/app/pathforger/_types/pipeline";
import type { PitchSelectionState } from "@/app/pathforger/_types/pitch";

type PathForgerSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
  dangerLevel: "Forgiving" | "Risky" | "Deadly";
  onDangerLevelChange: (value: "Forgiving" | "Risky" | "Deadly") => void;
  allowPermanentDeath: boolean;
  onAllowPermanentDeathChange: (checked: boolean) => void;
  selectedPitch: PitchSelectionState;
  onSelectedPitchChange: (value: PitchSelectionState) => void;
  selectedBranch: "" | PathForgerBranchChoice;
  onSelectedBranchChange: (value: "" | PathForgerBranchChoice) => void;
  isRunning: boolean;
  activeRunAction:
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
  onRunPipeline: () => void | Promise<void>;
};

export default function PathForgerSettingsDialog(props: PathForgerSettingsDialogProps) {
  const {
    open,
    onClose,
    dangerLevel,
    onDangerLevelChange,
    allowPermanentDeath,
    onAllowPermanentDeathChange,
    selectedPitch,
    onSelectedPitchChange,
    selectedBranch,
    onSelectedBranchChange,
    isRunning,
    activeRunAction,
    onRunPipeline,
  } = props;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Settings</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Paper
            variant="outlined"
            sx={(theme) => ({
              p: 1.5,
              borderColor: theme.palette.error.main,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(244, 67, 54, 0.1)"
                  : "rgba(244, 67, 54, 0.06)",
            })}
          >
            <Typography variant="subtitle1" gutterBottom color="error.main">
              Be Careful Here
            </Typography>
            <TextField
              select
              fullWidth
              label="Danger Level"
              value={dangerLevel}
              onChange={(event) =>
                onDangerLevelChange(event.target.value as "Forgiving" | "Risky" | "Deadly")
              }
            >
              <MenuItem value="Forgiving">Forgiving</MenuItem>
              <MenuItem value="Risky">Risky</MenuItem>
              <MenuItem value="Deadly">Deadly</MenuItem>
            </TextField>
            <FormControlLabel
              sx={{ mt: 0.5 }}
              control={
                <Checkbox
                  checked={allowPermanentDeath}
                  onChange={(event) => onAllowPermanentDeathChange(event.target.checked)}
                />
              }
              label="Allow permanent death"
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle1" gutterBottom>
              Pipeline
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Runs split calls: text/md generation first, then separate image-generation calls from
              the returned image prompts.
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Selected Pitch"
                  value={selectedPitch}
                  onChange={(event) =>
                    onSelectedPitchChange(event.target.value as PitchSelectionState)
                  }
                >
                  <MenuItem value="auto">Auto (use model recommendation)</MenuItem>
                  <MenuItem value="A">A</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Outcome Branch (optional)"
                  value={selectedBranch}
                  onChange={(event) =>
                    onSelectedBranchChange(event.target.value as "" | PathForgerBranchChoice)
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="A">Option A</MenuItem>
                  <MenuItem value="B">Option B</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
              <Button
                variant="contained"
                size="large"
                disabled={isRunning}
                onClick={onRunPipeline}
                startIcon={<AutoStories />}
              >
                {activeRunAction === "pipeline" ? "Forging..." : "Forge!"}
              </Button>
            </Box>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
