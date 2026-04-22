import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

export interface EmojiListAvatarProps {
  emoji: string;
  size?: number;
  fontSize?: string | number;
  borderAlpha?: number;
  backgroundAlpha?: number;
  sx?: SxProps<Theme>;
}

export default function EmojiListAvatar({
  emoji,
  size = 20,
  fontSize,
  borderAlpha = 0.22,
  backgroundAlpha = 0.08,
  sx,
}: EmojiListAvatarProps) {
  const resolvedFontSize =
    typeof fontSize !== "undefined" ? fontSize : `${Math.max(14, Math.round(size * 0.82))}px`;

  return (
    <Box
      component="span"
      aria-hidden
      sx={[
        {
          width: size,
          height: size,
          borderRadius: "999px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: resolvedFontSize,
          lineHeight: 1,
          flexShrink: 0,
          border: (theme) => {
            const tone =
              theme.palette.mode === "dark"
                ? theme.palette.common.white
                : theme.palette.common.black;
            return `1px solid ${alpha(tone, borderAlpha)}`;
          },
          bgcolor: (theme) => {
            const tone =
              theme.palette.mode === "dark"
                ? theme.palette.common.white
                : theme.palette.common.black;
            return alpha(tone, backgroundAlpha);
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {emoji}
    </Box>
  );
}
