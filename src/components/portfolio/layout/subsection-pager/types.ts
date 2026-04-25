import type { ReactNode } from "react";
import type { ChipProps } from "@mui/material/Chip";
import type { SxProps, Theme } from "@mui/material/styles";

export type SubsectionPagerItem = {
  key: string;
  title: string;
  selectedTitle?: string;
  selectedImageSrc?: string;
  selectedImageAlt?: string;
  selectedIcon?: ReactNode;
  optionTitle?: string;
  optionSubtitle?: string | string[];
  optionLabel?: string;
  optionTypeChipLabel?: string;
  optionTypeChipColor?: ChipProps["color"];
  optionImageSrc?: string;
  optionImageAlt?: string;
  optionIcon?: ReactNode;
};

export type SubsectionPagerEmojiAnimation =
  | "none"
  | "tornado"
  | "flip"
  | "bounce"
  | "pulse"
  | "fadeSwap"
  | "fadeInOut"
  | "fadeOutIn"
  | "shrinkGrow"
  | "bounceSwap"
  | "wobblePop"
  | "slideSnap"
  | "slideUpDown"
  | "slideDownUp"
  | "slideLeftRight"
  | "slideRightLeft"
  | "materialize"
  | "beamMeUp"
  | "beamMeDown"
  | "jelloTilt"
  | "cometTrail"
  | "warpIn"
  | "glitchPop"
  | "heartbeat"
  | "orbitIn"
  | "peekInOut"
  | "tada"
  | "explodeImplode"
  | "random";

export type SubsectionPagerResolvedEmojiAnimation = Exclude<
  SubsectionPagerEmojiAnimation,
  "random"
>;

export type SubsectionPagerIconFrameStyle = "default" | "none";

export type SubsectionPagerProps = {
  items: SubsectionPagerItem[];
  currentKey?: string;
  showOrdinal?: boolean;
  showSelectedVisualOnSmallScreens?: boolean;
  selectedValueAsTitle?: boolean;
  selectedVisualSize?: number;
  selectedIconFontSize?: string;
  selectedEmojiFontSize?: string;
  optionVisualSize?: number;
  optionEmojiFontSize?: string;
  selectedEmojiAnimation?: SubsectionPagerEmojiAnimation;
  iconFrameStyle?: SubsectionPagerIconFrameStyle;
  selectedIconFrameStyle?: SubsectionPagerIconFrameStyle;
  borderlessIconButtons?: boolean;
  flatIconButtons?: boolean;
  menuId: string;
  previousAriaLabel: string;
  nextAriaLabel: string;
  selectorAriaLabel: string;
  previousButtonSx?: SxProps<Theme>;
  disablePrevious?: boolean;
  disableNext?: boolean;
  disableSelector?: boolean;
  onSelect: (key: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};
