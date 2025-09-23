"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { NegotiationLibraryEntry } from "@/types";

interface NegotiationLibraryControlsProps {
  disabled?: boolean;
  entries: NegotiationLibraryEntry[];
  defaultLabel?: string;
  onSaveNew: (label: string) => void;
  onOverwrite: (id: string) => void;
  onInsert: (id: string) => void;
  onManage: () => void;
}

function formatTimestamp(value: string): string | undefined {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toLocaleString();
}

export default function NegotiationLibraryControls({
  disabled,
  entries,
  defaultLabel = "Offer negotiation",
  onSaveNew,
  onOverwrite,
  onInsert,
  onManage,
}: NegotiationLibraryControlsProps) {
  const [saveAnchorEl, setSaveAnchorEl] = useState<null | HTMLElement>(null);
  const [insertAnchorEl, setInsertAnchorEl] = useState<null | HTMLElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [error, setError] = useState("");

  const hasEntries = entries.length > 0;
  const insertDisabled = useMemo(() => entries.length === 0, [entries.length]);

  const handleOpenSaveMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSaveAnchorEl(event.currentTarget);
  };

  const handleCloseSaveMenu = () => {
    setSaveAnchorEl(null);
  };

  const handleOpenInsertMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setInsertAnchorEl(event.currentTarget);
  };

  const handleCloseInsertMenu = () => {
    setInsertAnchorEl(null);
  };

  const handleSaveAsNew = () => {
    handleCloseSaveMenu();
    setLabel(defaultLabel);
    setError("");
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setError("");
  };

  const handleDialogSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (trimmed.length === 0) {
      setError("Enter a name for this draft");
      return;
    }
    onSaveNew(trimmed);
    setDialogOpen(false);
  };

  const handleOverwrite = (id: string) => {
    handleCloseSaveMenu();
    onOverwrite(id);
  };

  const handleInsert = (id: string) => {
    handleCloseInsertMenu();
    onInsert(id);
  };

  const handleManage = () => {
    handleCloseInsertMenu();
    onManage();
  };

  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <>
      <Stack spacing={1}>
        <Button
          variant="outlined"
          onClick={handleOpenSaveMenu}
          disabled={disabled}
          fullWidth
          aria-haspopup="true"
          aria-expanded={Boolean(saveAnchorEl) ? "true" : undefined}
        >
          Save to library
        </Button>
        <Button
          variant="outlined"
          onClick={handleOpenInsertMenu}
          disabled={insertDisabled}
          fullWidth
          aria-haspopup="true"
          aria-expanded={Boolean(insertAnchorEl) ? "true" : undefined}
        >
          Insert from library
        </Button>
      </Stack>
      <Menu
        anchorEl={saveAnchorEl}
        open={Boolean(saveAnchorEl)}
        onClose={handleCloseSaveMenu}
        MenuListProps={{ "aria-label": "Save negotiation draft" }}
      >
        <MenuItem onClick={handleSaveAsNew}>Save as new draft…</MenuItem>
        {hasEntries && <Divider />}
        {entries.map((entry) => (
          <MenuItem key={entry.id} onClick={() => handleOverwrite(entry.id)}>
            <ListItemText primary={`Update "${entry.label}"`} />
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={insertAnchorEl}
        open={Boolean(insertAnchorEl)}
        onClose={handleCloseInsertMenu}
        MenuListProps={{ "aria-label": "Insert negotiation draft" }}
      >
        {entries.map((entry) => {
          const secondary = formatTimestamp(entry.updatedAt);
          return (
            <MenuItem key={entry.id} onClick={() => handleInsert(entry.id)}>
              <ListItemText
                primary={entry.label}
                secondary={secondary ? `Last updated ${secondary}` : undefined}
              />
            </MenuItem>
          );
        })}
        <Divider />
        <MenuItem onClick={handleManage}>
          <ListItemText primary="Manage library" />
        </MenuItem>
      </Menu>
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>Save negotiation draft</DialogTitle>
        <Box component="form" onSubmit={handleDialogSubmit} noValidate>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Typography variant="body2">
                Choose a descriptive name so you can reuse this draft later.
              </Typography>
              <TextField
                label="Draft name"
                value={label}
                onChange={handleLabelChange}
                autoFocus
                fullWidth
                error={Boolean(error)}
                helperText={error || undefined}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
