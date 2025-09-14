"use client";

import { Grid } from "@mui/material";

import Tile from "./Tile";
import { PROMPT_TILES } from "@/consts/promptTiles";

export default function PromptTileGrid() {
  return (
    <Grid container spacing={2}>
      {Object.values(PROMPT_TILES).map((tile) => (
        <Grid item xs={12} sm={6} md={4} key={tile.id}>
          <Tile {...tile} />
        </Grid>
      ))}
    </Grid>
  );
}

