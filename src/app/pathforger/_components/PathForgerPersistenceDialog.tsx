import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DeleteOutline } from "@mui/icons-material";
import type {
  PathForgerCreateSaveSlotOptions,
  PathForgerRecoveryReason,
  PathForgerRecoveryTimelineEntry,
  PathForgerResumeConflict,
  PathForgerSaveSlot,
} from "@/app/pathforger/_types/persistence";

type RecoveryTimelineSortMode = "newest" | "oldest" | "label";
type RecoveryTimelineFilterMode = "all" | PathForgerRecoveryReason;

const recoveryTimelineSortOptions: ReadonlyArray<{
  value: RecoveryTimelineSortMode;
  label: string;
}> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "label", label: "Label (A-Z)" },
];

const recoveryTimelineFilterOptions: ReadonlyArray<{
  value: RecoveryTimelineFilterMode;
  label: string;
}> = [
  { value: "all", label: "All events" },
  { value: "auto-checkpoint", label: "Auto checkpoints" },
  { value: "save-slot", label: "Save slot events" },
  { value: "restore-slot", label: "Slot restores" },
  { value: "restore-timeline", label: "Timeline restores" },
  { value: "resume-conflict", label: "Incoming session restores" },
];

const normalizeSlotName = (value: string): string => value.trim().toLowerCase();

type PathForgerPersistenceDialogProps = {
  open: boolean;
  onClose: () => void;
  isRunning: boolean;
  saveSlots: PathForgerSaveSlot[];
  recoveryTimeline: PathForgerRecoveryTimelineEntry[];
  resumeConflict: PathForgerResumeConflict | null;
  onCreateSaveSlot: (name: string, options?: PathForgerCreateSaveSlotOptions) => void;
  onRestoreSaveSlot: (slotId: string) => void;
  onDeleteSaveSlot: (slotId: string) => void;
  onRestoreTimelineEntry: (entryId: string) => void;
  onClearRecoveryTimeline: () => void;
  onAcceptIncomingResumeConflict: () => void;
  onKeepLocalResumeState: () => void;
};

export default function PathForgerPersistenceDialog(props: PathForgerPersistenceDialogProps) {
  const {
    open,
    onClose,
    isRunning,
    saveSlots,
    recoveryTimeline,
    resumeConflict,
    onCreateSaveSlot,
    onRestoreSaveSlot,
    onDeleteSaveSlot,
    onRestoreTimelineEntry,
    onClearRecoveryTimeline,
    onAcceptIncomingResumeConflict,
    onKeepLocalResumeState,
  } = props;
  const [slotName, setSlotName] = React.useState("");
  const [overwriteConfirmSlotId, setOverwriteConfirmSlotId] = React.useState<string | null>(null);
  const [timelineSortMode, setTimelineSortMode] =
    React.useState<RecoveryTimelineSortMode>("newest");
  const [timelineFilterMode, setTimelineFilterMode] =
    React.useState<RecoveryTimelineFilterMode>("all");

  const formatDateTime = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [],
  );

  const matchingSaveSlot = React.useMemo(() => {
    const normalizedSlotName = normalizeSlotName(slotName);
    if (normalizedSlotName.length === 0) {
      return null;
    }

    return saveSlots.find((slot) => normalizeSlotName(slot.name) === normalizedSlotName) ?? null;
  }, [saveSlots, slotName]);

  const filteredAndSortedRecoveryTimeline = React.useMemo(() => {
    const filteredTimeline =
      timelineFilterMode === "all"
        ? recoveryTimeline
        : recoveryTimeline.filter((entry) => entry.reason === timelineFilterMode);

    const sortedTimeline = [...filteredTimeline];
    if (timelineSortMode === "newest") {
      sortedTimeline.sort((left, right) => right.createdAt - left.createdAt);
      return sortedTimeline;
    }
    if (timelineSortMode === "oldest") {
      sortedTimeline.sort((left, right) => left.createdAt - right.createdAt);
      return sortedTimeline;
    }

    sortedTimeline.sort((left, right) => left.label.localeCompare(right.label));
    return sortedTimeline;
  }, [recoveryTimeline, timelineFilterMode, timelineSortMode]);

  const handleCreateSaveSlot = () => {
    if (matchingSaveSlot) {
      if (overwriteConfirmSlotId === matchingSaveSlot.id) {
        onCreateSaveSlot(slotName, { overwriteSlotId: matchingSaveSlot.id });
        setSlotName("");
        setOverwriteConfirmSlotId(null);
        return;
      }
      setOverwriteConfirmSlotId(matchingSaveSlot.id);
      return;
    }

    onCreateSaveSlot(slotName);
    setSlotName("");
    setOverwriteConfirmSlotId(null);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Saves & Recovery</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.25}>
          {resumeConflict ? (
            <Alert
              severity="warning"
              action={
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={onAcceptIncomingResumeConflict}>
                    Load Incoming
                  </Button>
                  <Button size="small" onClick={onKeepLocalResumeState}>
                    Keep Local
                  </Button>
                </Stack>
              }
            >
              Newer state detected from another session at{" "}
              {formatDateTime.format(resumeConflict.incomingUpdatedAt)}.
            </Alert>
          ) : null}

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Save Slots
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField
                fullWidth
                size="small"
                label="Save slot name"
                value={slotName}
                onChange={(event) => {
                  setSlotName(event.target.value);
                  setOverwriteConfirmSlotId(null);
                }}
                placeholder="Chapter 3 - risky branch"
              />
              <Button
                variant={overwriteConfirmSlotId ? "outlined" : "contained"}
                color={overwriteConfirmSlotId ? "warning" : "primary"}
                disabled={isRunning}
                onClick={handleCreateSaveSlot}
                sx={{ minWidth: 132 }}
              >
                {overwriteConfirmSlotId ? "Overwrite Slot" : "Save Slot"}
              </Button>
            </Stack>
            {matchingSaveSlot ? (
              <Alert
                severity={overwriteConfirmSlotId === matchingSaveSlot.id ? "warning" : "info"}
                sx={{ mt: 1 }}
                action={
                  overwriteConfirmSlotId === matchingSaveSlot.id ? (
                    <Button size="small" onClick={() => setOverwriteConfirmSlotId(null)}>
                      Cancel
                    </Button>
                  ) : undefined
                }
              >
                {overwriteConfirmSlotId === matchingSaveSlot.id
                  ? `Overwrite is armed for "${matchingSaveSlot.name}". Press "Overwrite Slot" to confirm.`
                  : `A save slot named "${matchingSaveSlot.name}" already exists. Press "Save Slot" again to confirm overwrite.`}
              </Alert>
            ) : null}

            <List dense disablePadding sx={{ mt: 1 }}>
              {saveSlots.length === 0 ? (
                <ListItem disableGutters>
                  <ListItemText primary="No save slots yet." />
                </ListItem>
              ) : (
                saveSlots.map((slot) => (
                  <ListItem
                    key={slot.id}
                    disableGutters
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          disabled={isRunning}
                          onClick={() => onRestoreSaveSlot(slot.id)}
                        >
                          Restore
                        </Button>
                        <IconButton
                          size="small"
                          aria-label={`Delete save slot ${slot.name}`}
                          onClick={() => onDeleteSaveSlot(slot.id)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={slot.name}
                      secondary={formatDateTime.format(slot.updatedAt)}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Box>

          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle1">Recovery Timeline</Typography>
              <Button
                size="small"
                onClick={onClearRecoveryTimeline}
                disabled={recoveryTimeline.length === 0}
              >
                Clear
              </Button>
            </Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ mb: 1 }}
            >
              <TextField
                select
                size="small"
                label="Sort"
                value={timelineSortMode}
                onChange={(event) =>
                  setTimelineSortMode(event.target.value as RecoveryTimelineSortMode)
                }
                sx={{ minWidth: { xs: "100%", sm: 170 } }}
              >
                {recoveryTimelineSortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Filter"
                value={timelineFilterMode}
                onChange={(event) =>
                  setTimelineFilterMode(event.target.value as RecoveryTimelineFilterMode)
                }
                sx={{ minWidth: { xs: "100%", sm: 220 } }}
              >
                {recoveryTimelineFilterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="caption" color="text.secondary">
                {filteredAndSortedRecoveryTimeline.length} of {recoveryTimeline.length} shown
              </Typography>
            </Stack>
            <List dense disablePadding>
              {filteredAndSortedRecoveryTimeline.length === 0 ? (
                <ListItem disableGutters>
                  <ListItemText
                    primary={
                      recoveryTimeline.length === 0
                        ? "No restore points yet."
                        : "No restore points match the current filter."
                    }
                  />
                </ListItem>
              ) : (
                filteredAndSortedRecoveryTimeline.map((entry) => (
                  <ListItem
                    key={entry.id}
                    disableGutters
                    secondaryAction={
                      <Button
                        size="small"
                        disabled={isRunning}
                        onClick={() => onRestoreTimelineEntry(entry.id)}
                      >
                        Restore
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={entry.label}
                      secondary={formatDateTime.format(entry.createdAt)}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
