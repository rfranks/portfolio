import * as React from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import {
  Home as HomeIcon,
  Science,
  MenuBook,
  Build,
  AutoFixHigh,
  AutoStories,
  AltRoute,
  Casino,
  Flight,
  SportsEsports,
  School,
  Work,
  EmojiEvents,
  Interests,
  AlternateEmail,
} from "@mui/icons-material";
import { EmojiGlyph } from "@/components/shared";

export type NavigationIconType = "material" | "emoji";

export type NavigationIconConfig = {
  icon?: string;
  iconType?: NavigationIconType;
};

type RenderNavigationIconOptions = {
  fallbackIconKey?: string;
  fontSize?: SvgIconProps["fontSize"];
  emojiSize?: string;
};

const materialIconMap = {
  home: HomeIcon,
  science: Science,
  menuBook: MenuBook,
  build: Build,
  autoFixHigh: AutoFixHigh,
  autoStories: AutoStories,
  altRoute: AltRoute,
  casino: Casino,
  flight: Flight,
  sportsEsports: SportsEsports,
  school: School,
  work: Work,
  emojiEvents: EmojiEvents,
  interests: Interests,
  alternateEmail: AlternateEmail,
} as const;

type MaterialIconKey = keyof typeof materialIconMap;

const isMaterialIconKey = (value: string): value is MaterialIconKey => value in materialIconMap;

export function renderNavigationIcon(
  iconConfig: NavigationIconConfig | undefined,
  options?: RenderNavigationIconOptions,
) {
  const iconValue = iconConfig?.icon?.trim() ?? "";
  const iconType = iconConfig?.iconType ?? "material";

  if (iconType === "emoji" && iconValue) {
    return <EmojiGlyph glyph={iconValue} size={options?.emojiSize ?? "1rem"} />;
  }

  const fallbackKeyCandidate = (options?.fallbackIconKey ?? "home").trim();
  const fallbackKey: MaterialIconKey = isMaterialIconKey(fallbackKeyCandidate)
    ? fallbackKeyCandidate
    : "home";
  const materialKey: MaterialIconKey = isMaterialIconKey(iconValue) ? iconValue : fallbackKey;
  const IconComponent = materialIconMap[materialKey];

  return <IconComponent fontSize={options?.fontSize ?? "small"} />;
}
