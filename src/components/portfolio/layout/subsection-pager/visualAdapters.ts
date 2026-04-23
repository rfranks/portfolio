import { alpha, type Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import { getPagerSelectedVisualSizing } from "@/components/portfolio/layout/pagerFoundation";
import type { SubsectionPagerIconFrameStyle } from "./types";

type SelectedVisualSizing = {
  selectedEmojiFontSizeResolved: string;
  selectedVisualSizeResponsive: {
    xs: number;
    sm: number;
    md: number;
  };
  selectedEmojiMaxFontSizeResponsive: {
    xs: string;
    sm: string;
    md: string;
  };
};

type SelectedVisualFrameSxOptions = {
  frameStyle: SubsectionPagerIconFrameStyle;
  selectedValueAsTitle: boolean;
};

type OptionVisualFrameSxOptions = {
  frameStyle: SubsectionPagerIconFrameStyle;
};

export function getSelectedVisualDisplay(
  showSelectedVisualOnSmallScreens: boolean,
  mode: "inline-flex" | "block" = "inline-flex",
) {
  return showSelectedVisualOnSmallScreens
    ? { xs: mode, sm: mode, md: mode }
    : { xs: "none", sm: "none", md: mode };
}

export function getSelectedVisualSizing(options: {
  selectedVisualSize: number;
  selectedEmojiFontSize?: string;
}): SelectedVisualSizing {
  return getPagerSelectedVisualSizing(options);
}

export function resolveSelectedIconFrameStyle(
  selectedIconFrameStyle: SubsectionPagerIconFrameStyle | undefined,
  iconFrameStyle: SubsectionPagerIconFrameStyle,
): SubsectionPagerIconFrameStyle {
  return selectedIconFrameStyle ?? iconFrameStyle;
}

export function getSelectedVisualFrameSx(
  options: SelectedVisualFrameSxOptions,
): SystemStyleObject<Theme> {
  const { frameStyle, selectedValueAsTitle } = options;
  return {
    borderRadius: frameStyle === "none" ? 0 : 1.5,
    border: frameStyle === "none" ? "none" : "1px solid",
    borderColor:
      frameStyle === "none"
        ? "transparent"
        : (theme: Theme) =>
            selectedValueAsTitle ? alpha(theme.palette.common.white, 0.3) : theme.palette.divider,
    bgcolor: (theme: Theme) =>
      frameStyle === "none"
        ? "transparent"
        : selectedValueAsTitle
          ? alpha(theme.palette.common.white, 0.06)
          : theme.palette.background.paper,
    p: frameStyle === "none" ? 0 : 0.2,
  };
}

export function getOptionVisualFrameSx(
  options: OptionVisualFrameSxOptions,
): SystemStyleObject<Theme> {
  const { frameStyle } = options;
  return {
    borderRadius: frameStyle === "none" ? 0 : 1.5,
    border: frameStyle === "none" ? "none" : "1px solid",
    borderColor: frameStyle === "none" ? "transparent" : "divider",
    bgcolor: frameStyle === "none" ? "transparent" : "background.paper",
    p: frameStyle === "none" ? 0 : 0.5,
  };
}
