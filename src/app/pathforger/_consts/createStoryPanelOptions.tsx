import * as React from "react";
import { Box, Typography } from "@mui/material";
import type { AdventureLength } from "@/app/pathforger/_types/createStoryPanel";

type DecoratedOption = {
  label: string;
  emoji: string;
};

export type AgeRatingOption = {
  value: string;
  emoji: string;
  label: string;
};

export const genreOptionVisuals: DecoratedOption[] = [
  { label: "Mystery", emoji: "🕵️" },
  { label: "Sci-fi", emoji: "🛸" },
  { label: "Children's", emoji: "🧸" },
  { label: "True Crime", emoji: "🕵️‍♂️" },
  { label: "Historical Fiction", emoji: "📜" },
  { label: "Medical Drama", emoji: "🩺" },
  { label: "Horror", emoji: "👻" },
  { label: "Thriller", emoji: "🎯" },
  { label: "Comic / Adventure", emoji: "🦸" },
  { label: "Gothic", emoji: "🕯️" },
  { label: "Noir", emoji: "🎬" },
  { label: "Supernatural", emoji: "🔮" },
];

export const genreOptions = genreOptionVisuals.map((option) => option.label);

export const chapterLengthOptionVisuals: Array<DecoratedOption & { label: AdventureLength }> = [
  { label: "Very short (1-2 lines)", emoji: "⚡" },
  { label: "Short", emoji: "⏱️" },
  { label: "Medium", emoji: "📖" },
  { label: "Long", emoji: "🧭" },
  { label: "Very long", emoji: "🏔️" },
];

export const ageRatingOptions: AgeRatingOption[] = [
  { value: "G", emoji: "🧒", label: "G" },
  { value: "PG", emoji: "👨‍👩‍👧", label: "PG" },
  { value: "PG-13", emoji: "🎬", label: "PG-13" },
  { value: "R", emoji: "⚠️", label: "R" },
  { value: "NC-17", emoji: "⛔", label: "NC-17" },
];

export function renderDecoratedOption(
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
