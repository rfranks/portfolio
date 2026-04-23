import { alpha, type Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";

type PagerIconButtonStyleOptions = {
  selectedValueAsTitle?: boolean;
  includeRightMargin?: boolean;
  borderlessIconButtons?: boolean;
  flatIconButtons?: boolean;
};

const getTitleModeColor = (theme: Theme) =>
  theme.palette.mode === "dark"
    ? alpha(theme.palette.common.white, 0.82)
    : alpha(theme.palette.text.primary, 0.72);

type PagerStyleObject = SystemStyleObject<Theme>;
type PagerStyleResolver = (theme: Theme) => PagerStyleObject;

type PagerSelectedTextSxOptions = {
  selectedValueAsTitle?: boolean;
  fontSize?: string | number | Record<string, string | number>;
};

type PagerSelectedChipSxOptions = {
  selectedValueAsTitle?: boolean;
};

type PagerSelectedVisualSizingOptions = {
  selectedVisualSize: number;
  selectedEmojiFontSize?: string;
};

type PagerOptionVisualSizingOptions = {
  optionVisualSize: number;
  optionEmojiFontSize?: string;
};

export const PAGER_OVERFLOW_ACTION_DISPLAY_SX = {
  xs: "none",
  sm: "none",
  md: "inline-flex",
} as const;

export const getPagerIconButtonSx = ({
  selectedValueAsTitle = false,
  includeRightMargin = false,
  borderlessIconButtons = false,
  flatIconButtons = false,
}: PagerIconButtonStyleOptions = {}): PagerStyleResolver => {
  return (theme: Theme) => ({
    ...(includeRightMargin ? { mr: 1.25 } : undefined),
    color: selectedValueAsTitle ? getTitleModeColor(theme) : theme.palette.text.secondary,
    border: borderlessIconButtons || flatIconButtons ? "none" : "1px solid",
    borderColor:
      borderlessIconButtons || flatIconButtons
        ? "transparent"
        : selectedValueAsTitle
          ? alpha(theme.palette.common.white, 0.28)
          : alpha(theme.palette.divider, 0.95),
    bgcolor: flatIconButtons
      ? "transparent"
      : selectedValueAsTitle
        ? alpha(theme.palette.common.white, 0.03)
        : alpha(theme.palette.background.paper, 0.9),
    boxShadow: "none",
    backdropFilter: "none",
    transition: "background-color 180ms ease, border-color 180ms ease, transform 180ms ease",
    "&:hover": {
      bgcolor: flatIconButtons
        ? "transparent"
        : selectedValueAsTitle
          ? alpha(theme.palette.common.white, 0.12)
          : alpha(theme.palette.action.hover, 0.9),
      borderColor:
        borderlessIconButtons || flatIconButtons
          ? "transparent"
          : selectedValueAsTitle
            ? alpha(theme.palette.common.white, 0.52)
            : alpha(theme.palette.text.secondary, 0.55),
      transform: flatIconButtons ? "none" : "translateY(-1px)",
    },
    "&.Mui-focusVisible": {
      bgcolor: flatIconButtons
        ? "transparent"
        : selectedValueAsTitle
          ? alpha(theme.palette.common.white, 0.16)
          : alpha(theme.palette.action.focus, 0.95),
      borderColor:
        borderlessIconButtons || flatIconButtons
          ? "transparent"
          : selectedValueAsTitle
            ? alpha(theme.palette.common.white, 0.56)
            : alpha(theme.palette.text.secondary, 0.6),
    },
  });
};

export const getPagerIconButtonFrameSx = ({
  selectedValueAsTitle = false,
}: {
  selectedValueAsTitle?: boolean;
} = {}): PagerStyleResolver => {
  return (theme: Theme) => ({
    p: 0.45,
    mt: { xs: 0.15, sm: 0.15, md: 0 },
    borderRadius: "999px",
    "&.Mui-disabled": {
      borderColor: selectedValueAsTitle
        ? alpha(theme.palette.common.white, 0.16)
        : alpha(theme.palette.text.secondary, 0.24),
      color: selectedValueAsTitle
        ? alpha(theme.palette.common.white, 0.42)
        : alpha(theme.palette.text.secondary, 0.45),
    },
  });
};

export const getPagerSelectedTextSx = ({
  selectedValueAsTitle = false,
  fontSize,
}: PagerSelectedTextSxOptions = {}): PagerStyleObject => ({
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: fontSize ?? {
    xs: selectedValueAsTitle ? "0.86rem" : "0.8rem",
    sm: selectedValueAsTitle ? "0.98rem" : "0.92rem",
    md: selectedValueAsTitle ? "1.38rem" : "1.24rem",
  },
  lineHeight: selectedValueAsTitle ? 1.12 : 1.2,
  fontWeight: 800,
  color: selectedValueAsTitle
    ? (theme: Theme) =>
        theme.palette.mode === "dark"
          ? alpha(theme.palette.common.white, 0.82)
          : alpha(theme.palette.text.primary, 0.72)
    : "inherit",
  textAlign: "left",
});

export const getPagerSelectedChipSx = ({
  selectedValueAsTitle = false,
}: PagerSelectedChipSxOptions = {}): PagerStyleObject => ({
  minWidth: 0,
  maxWidth: "100%",
  justifySelf: "stretch",
  ...(selectedValueAsTitle
    ? {
        border: "0 !important",
        borderColor: "transparent !important",
        color: "text.secondary",
        bgcolor: "transparent !important",
        backgroundColor: "transparent !important",
        backgroundImage: "none !important",
        boxShadow: "none !important",
        backdropFilter: "none !important",
        filter: "none !important",
        borderRadius: 1.5,
        minHeight: { xs: 30, sm: 34, md: 44 },
        transition: "background-color 180ms ease, transform 180ms ease",
        "&.MuiChip-outlined": {
          border: "0 !important",
        },
        "&:hover": {
          bgcolor: "rgba(255,255,255,0.08) !important",
          backgroundColor: "rgba(255,255,255,0.08) !important",
          transform: "translateY(-1px)",
        },
        "&.Mui-focusVisible": {
          bgcolor: "rgba(255,255,255,0.12) !important",
          backgroundColor: "rgba(255,255,255,0.12) !important",
        },
      }
    : undefined),
  "& .MuiChip-label": {
    width: "100%",
    overflow: "hidden",
    display: "block",
    py: selectedValueAsTitle ? { xs: 0.22, sm: 0.32, md: 0.5 } : 0,
    textAlign: "left",
  },
});

export const getPagerSelectedVisualSizing = ({
  selectedVisualSize,
  selectedEmojiFontSize,
}: PagerSelectedVisualSizingOptions) => {
  const selectedEmojiFontSizeResolved =
    selectedEmojiFontSize ?? `${Math.max(16, Math.round(selectedVisualSize * 0.78))}px`;
  const selectedVisualSizeResponsive = {
    xs: Math.max(24, Math.round(selectedVisualSize * 0.52)),
    sm: Math.max(30, Math.round(selectedVisualSize * 0.66)),
    md: selectedVisualSize,
  };
  const selectedEmojiMaxFontSizeResponsive = {
    xs: `${Math.max(16, Math.round(selectedVisualSizeResponsive.xs * 0.9))}px`,
    sm: `${Math.max(18, Math.round(selectedVisualSizeResponsive.sm * 0.9))}px`,
    md: `${Math.max(20, Math.round(selectedVisualSizeResponsive.md * 0.9))}px`,
  };

  return {
    selectedEmojiFontSizeResolved,
    selectedVisualSizeResponsive,
    selectedEmojiMaxFontSizeResponsive,
  };
};

export const getPagerOptionEmojiFontSize = ({
  optionVisualSize,
  optionEmojiFontSize,
}: PagerOptionVisualSizingOptions): string =>
  optionEmojiFontSize ?? `${Math.max(24, Math.round(optionVisualSize * 0.74))}px`;
