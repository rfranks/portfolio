import * as React from "react";
import { Typography } from "@mui/material";

type EmojiGlyphProps = {
  glyph: string;
  size?: string;
};

export default function EmojiGlyph({
  glyph,
  size = "1.05rem",
}: EmojiGlyphProps) {
  return (
    <Typography component="span" sx={{ fontSize: size, lineHeight: 1 }}>
      {glyph}
    </Typography>
  );
}
