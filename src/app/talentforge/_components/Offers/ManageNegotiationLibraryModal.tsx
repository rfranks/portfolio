"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import type { NegotiationLibraryEntry } from "@/types";

interface ManageNegotiationLibraryModalProps {
  open: boolean;
  entries: NegotiationLibraryEntry[];
  onClose: () => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function ManageNegotiationLibraryModal({
  open,
  entries,
  onClose,
  onRename,
  onDelete,
}: ManageNegotiationLibraryModalProps) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setLabels({});
      return;
    }
    const initial = entries.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.id] = entry.label;
      return acc;
    }, {});
    setLabels(initial);
  }, [open, entries]);

  const hasEntries = entries.length > 0;

  const handleLabelChange = (id: string, value: string) => {
    setLabels((prev) => ({ ...prev, [id]: value }));
  };

  const handleRename = (id: string) => {
    const nextLabel = labels[id] ?? "";
    onRename(id, nextLabel);
  };

  const items = useMemo(() => entries, [entries]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage negotiation library</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            Rename or delete saved negotiation drafts that you no longer need.
          </Typography>
          {!hasEntries && <Alert severity="info">No saved drafts yet.</Alert>}
          {hasEntries && (
            <List disablePadding>
              {items.map((entry) => {
                const value = labels[entry.id] ?? entry.label;
                const trimmed = value.trim();
                const disableSave = trimmed.length === 0 || trimmed === entry.label;
                const timestamp = formatTimestamp(entry.updatedAt);
                return (
                  <ListItem
                    key={entry.id}
                    disableGutters
                    sx={{
                      mb: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 2,
                      py: 2,
                      display: "block",
                    }}
                  >
                    <Stack spacing={1.5}>
                      <TextField
                        label="Draft name"
                        value={value}
                        onChange={(event) => handleLabelChange(entry.id, event.target.value)}
                        fullWidth
                        error={value.trim().length === 0}
                        helperText={
                          value.trim().length === 0 ? "Enter a name to keep this draft" : undefined
                        }
                      />
                      <Typography variant="caption" color="text.secondary">
                        Last updated {timestamp}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={disableSave}
                          onClick={() => handleRename(entry.id)}
                        >
                          Save name
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => onDelete(entry.id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Stack>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
