import * as React from "react";
import { Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type EmojiGlyphProps = {
  glyph: string;
  size?: string;
  slot?: "inline" | "start" | "end";
  sx?: SxProps<Theme>;
};

export default function EmojiGlyph({
  glyph,
  size = "1.05rem",
  slot = "inline",
  sx,
}: EmojiGlyphProps) {
  const slotSx: SxProps<Theme> =
    slot === "start"
      ? {
          pl: "0.08em",
          pr: "0.12em",
        }
      : slot === "end"
        ? {
            pl: "0.12em",
            pr: "0.2em",
          }
        : {};
  const customSx = React.useMemo(() => {
    if (sx == null) {
      return [] as SxProps<Theme>[];
    }
    if (Array.isArray(sx)) {
      return sx.filter(
        (entry): entry is Exclude<typeof entry, undefined> =>
          entry !== undefined,
      );
    }
    return [sx];
  }, [sx]);

  return (
    <Typography
      component="span"
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size,
          lineHeight: 1,
          verticalAlign: "middle",
          transform: "translateY(0.02em)",
        },
        slotSx,
        ...customSx,
      ]}
    >
      {glyph}
    </Typography>
  );
}
