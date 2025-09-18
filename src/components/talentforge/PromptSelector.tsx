"use client";

import React from "react";
import {
  MenuItem,
  Select,
  ListSubheader,
  SelectChangeEvent,
} from "@mui/material";

import {
  PROMPT_CONTEXT_LABELS,
  PROMPT_CONTEXT_ORDER,
  getPromptTiles,
  type PromptContext,
  type PromptTileWithMetadata,
} from "@/utils/talentforge/promptRegistry";

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

  const requestedContexts: PromptContext[] = contexts
    ? Array.isArray(contexts)
      ? contexts
      : [contexts]
    : PROMPT_CONTEXT_ORDER;

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

  return (
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
  );
}

