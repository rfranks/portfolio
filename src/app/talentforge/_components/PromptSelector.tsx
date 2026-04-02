"use client";

import React, { useMemo, useState } from "react";
import {
  MenuItem,
  Select,
  ListSubheader,
  SelectChangeEvent,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  PROMPT_CONTEXT_LABELS,
  PROMPT_CONTEXT_ORDER,
  getPromptTiles,
  type PromptContext,
  type PromptTileWithMetadata,
} from "@/app/talentforge/_utils/promptRegistry";
import {
  addCustomPromptTile,
  deleteCustomPromptTile,
  getCustomPromptTiles,
  updateCustomPromptTile,
  type CustomPromptTile,
  type CustomPromptTileInput,
} from "@/app/talentforge/_utils/dataStore";
import AddPromptDrawer from "./customPrompts/AddPromptDrawer";

interface PromptSelectorProps {
  value: string;
  onChange: (value: string) => void;
  contexts?: PromptContext | PromptContext[];
}

export default function PromptSelector({
  value,
  onChange,
  contexts,
}: PromptSelectorProps) {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  const requestedContexts = useMemo<PromptContext[]>(
    () =>
      contexts
        ? Array.isArray(contexts)
          ? contexts
          : [contexts]
        : PROMPT_CONTEXT_ORDER,
    [contexts],
  );

  const [customPrompts, setCustomPrompts] = useState<CustomPromptTile[]>(() =>
    getCustomPromptTiles(),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingTile, setEditingTile] = useState<CustomPromptTile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomPromptTile | null>(
    null,
  );

  const customPromptMap = useMemo(
    () => new Map(customPrompts.map((tile) => [tile.id, tile])),
    [customPrompts],
  );

  const tiles = getPromptTiles({ contexts: requestedContexts });

  const seen = new Set<string>();
  const groups = requestedContexts
    .map((context) => {
      const contextTiles = tiles.filter((tile) => {
        if (!tile.contexts.includes(context) || seen.has(tile.id)) {
          return false;
        }
        seen.add(tile.id);
        return true;
      });
      return { context, tiles: contextTiles };
    })
    .filter((group) => group.tiles.length > 0);

  const fallbackTiles: PromptTileWithMetadata[] =
    groups.length === 0 ? tiles : [];

  const selectedTile = useMemo(
    () => tiles.find((tile) => tile.id === value),
    [tiles, value],
  );
  const selectedCustomTile = selectedTile
    ? customPromptMap.get(selectedTile.id)
    : undefined;

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditingTile(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (tile: CustomPromptTile) => {
    setDrawerMode("edit");
    setEditingTile(tile);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingTile(null);
  };

  const handleCreatePrompt = (tile: CustomPromptTileInput) => {
    const previousIds = new Set(customPrompts.map((prompt) => prompt.id));
    const updated = addCustomPromptTile(tile);
    setCustomPrompts(updated);
    const created = updated.find((prompt) => !previousIds.has(prompt.id));
    const newId = created?.id || tile.id || "";
    if (newId) {
      onChange(newId);
    }
  };

  const handleUpdatePrompt = (tile: CustomPromptTileInput) => {
    if (!tile.id) return;
    const updated = updateCustomPromptTile(tile);
    setCustomPrompts(updated);
    onChange(tile.id);
  };

  const handleDeletePrompt = (tile: CustomPromptTile) => {
    const updated = deleteCustomPromptTile(tile.id);
    setCustomPrompts(updated);
    if (value === tile.id) {
      onChange("");
    }
  };

  const handleDrawerSave = (tile: CustomPromptTileInput) => {
    if (drawerMode === "create") {
      handleCreatePrompt(tile);
    } else {
      handleUpdatePrompt(tile);
    }
  };

  return (
    <>
      <Select value={value} onChange={handleChange} displayEmpty fullWidth>
        <MenuItem value="" disabled>
          Select a prompt
        </MenuItem>
        {groups.length > 0
          ? groups.map(({ context, tiles: contextTiles }) => (
              <React.Fragment key={context}>
                <ListSubheader>{PROMPT_CONTEXT_LABELS[context]}</ListSubheader>
                {contextTiles.map((tile) => (
                  <MenuItem key={tile.id} value={tile.id}>
                    {tile.display}
                  </MenuItem>
                ))}
              </React.Fragment>
            ))
          : fallbackTiles.map((tile) => (
              <MenuItem key={tile.id} value={tile.id}>
                {tile.display}
              </MenuItem>
            ))}
      </Select>
      <Stack
        direction="row"
        spacing={1}
        sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon fontSize="small" />}
          onClick={openCreateDrawer}
        >
          Add prompt
        </Button>
        {selectedCustomTile && (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => openEditDrawer(selectedCustomTile)}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={() => setConfirmDelete(selectedCustomTile)}
            >
              Delete
            </Button>
          </>
        )}
      </Stack>
      <AddPromptDrawer
        open={drawerOpen}
        mode={drawerMode}
        onClose={closeDrawer}
        onSave={handleDrawerSave}
        initialValue={drawerMode === "edit" ? editingTile ?? undefined : undefined}
      />
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete prompt</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDelete
              ? `Are you sure you want to delete ${confirmDelete.displayName}?`
              : "Are you sure you want to delete this prompt?"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (confirmDelete) {
                handleDeletePrompt(confirmDelete);
              }
              setConfirmDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
