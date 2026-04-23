"use client";

import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Chip, { type ChipProps } from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import MoreVert from "@mui/icons-material/MoreVert";

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

type SubsectionPagerResolvedEmojiAnimation = Exclude<SubsectionPagerEmojiAnimation, "random">;

const RANDOM_EMOJI_ANIMATION_POOL: SubsectionPagerResolvedEmojiAnimation[] = [
  "flip",
  "tornado",
  "bounce",
  "pulse",
  "fadeSwap",
  "fadeInOut",
  "fadeOutIn",
  "shrinkGrow",
  "bounceSwap",
  "wobblePop",
  "slideSnap",
  "slideUpDown",
  "slideDownUp",
  "slideLeftRight",
  "slideRightLeft",
  "materialize",
  "beamMeUp",
  "beamMeDown",
  "jelloTilt",
  "cometTrail",
  "warpIn",
  "glitchPop",
  "heartbeat",
  "orbitIn",
  "peekInOut",
  "tada",
  "explodeImplode",
];

const EMOJI_ANIMATION_FAMILY: Record<SubsectionPagerResolvedEmojiAnimation, string> = {
  none: "none",
  flip: "flip",
  tornado: "spin",
  bounce: "bounce",
  pulse: "pulse",
  fadeSwap: "fade",
  fadeInOut: "fade",
  fadeOutIn: "fade",
  shrinkGrow: "scale",
  bounceSwap: "bounce",
  wobblePop: "wobble",
  slideSnap: "slide",
  slideUpDown: "slide",
  slideDownUp: "slide",
  slideLeftRight: "slide",
  slideRightLeft: "slide",
  materialize: "materialize",
  beamMeUp: "beam",
  beamMeDown: "beam",
  jelloTilt: "jello",
  cometTrail: "trail",
  warpIn: "warp",
  glitchPop: "glitch",
  heartbeat: "pulse",
  orbitIn: "orbit",
  peekInOut: "peek",
  tada: "celebrate",
  explodeImplode: "explode",
};

type RandomAnimationState = {
  bag: SubsectionPagerResolvedEmojiAnimation[];
  lastAnimation?: SubsectionPagerResolvedEmojiAnimation;
};

const randomAnimationStateByMenuId = new Map<string, RandomAnimationState>();

const randomizeAnimationPool = () => {
  const randomized = [...RANDOM_EMOJI_ANIMATION_POOL];

  for (let index = randomized.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = randomized[index];
    randomized[index] = randomized[randomIndex] ?? current;
    randomized[randomIndex] = current;
  }

  return randomized;
};

const rebalanceAnimationBag = (
  randomizedBag: SubsectionPagerResolvedEmojiAnimation[],
  lastAnimation?: SubsectionPagerResolvedEmojiAnimation,
) => {
  const nextBag = [...randomizedBag];
  if (nextBag.length <= 1) {
    return nextBag;
  }

  const lastFamily = lastAnimation ? EMOJI_ANIMATION_FAMILY[lastAnimation] : undefined;
  if (lastAnimation) {
    const preferredFirstIndex = nextBag.findIndex(
      (animation) =>
        animation !== lastAnimation && EMOJI_ANIMATION_FAMILY[animation] !== lastFamily,
    );
    const fallbackFirstIndex =
      preferredFirstIndex >= 0
        ? preferredFirstIndex
        : nextBag.findIndex((animation) => animation !== lastAnimation);

    if (fallbackFirstIndex > 0) {
      const first = nextBag[0];
      nextBag[0] = nextBag[fallbackFirstIndex] ?? first;
      nextBag[fallbackFirstIndex] = first;
    }
  }

  for (let index = 1; index < nextBag.length; index += 1) {
    const previousFamily = EMOJI_ANIMATION_FAMILY[nextBag[index - 1] ?? "flip"];
    const current = nextBag[index];
    if (!current || EMOJI_ANIMATION_FAMILY[current] !== previousFamily) {
      continue;
    }

    const swapIndex = nextBag.findIndex(
      (candidate, candidateIndex) =>
        candidateIndex > index && EMOJI_ANIMATION_FAMILY[candidate] !== previousFamily,
    );
    if (swapIndex > index) {
      nextBag[index] = nextBag[swapIndex] ?? current;
      nextBag[swapIndex] = current;
    }
  }

  return nextBag;
};

const buildRandomAnimationBag = (lastAnimation?: SubsectionPagerResolvedEmojiAnimation) =>
  rebalanceAnimationBag(randomizeAnimationPool(), lastAnimation);

const pickRandomEmojiAnimation = (menuId: string): SubsectionPagerResolvedEmojiAnimation => {
  const existingState = randomAnimationStateByMenuId.get(menuId);
  const state: RandomAnimationState = existingState
    ? { ...existingState, bag: [...existingState.bag] }
    : { bag: [] };

  if (state.bag.length === 0) {
    state.bag = buildRandomAnimationBag(state.lastAnimation);
  }

  let nextAnimation = state.bag.shift() ?? "flip";
  if (state.lastAnimation && state.bag.length > 0) {
    const lastFamily = EMOJI_ANIMATION_FAMILY[state.lastAnimation];
    const nextFamily = EMOJI_ANIMATION_FAMILY[nextAnimation];
    if (nextAnimation === state.lastAnimation || nextFamily === lastFamily) {
      const betterIndex = state.bag.findIndex(
        (candidate) =>
          candidate !== state.lastAnimation && EMOJI_ANIMATION_FAMILY[candidate] !== lastFamily,
      );
      if (betterIndex >= 0) {
        const fallbackAnimation = nextAnimation;
        nextAnimation = state.bag[betterIndex] ?? fallbackAnimation;
        state.bag[betterIndex] = fallbackAnimation;
      }
    }
  }

  state.lastAnimation = nextAnimation;
  randomAnimationStateByMenuId.set(menuId, state);
  return nextAnimation;
};

type SubsectionPagerProps = {
  items: SubsectionPagerItem[];
  currentKey?: string;
  showOrdinal?: boolean;
  selectedValueAsTitle?: boolean;
  selectedVisualSize?: number;
  selectedIconFontSize?: string;
  selectedEmojiFontSize?: string;
  optionVisualSize?: number;
  optionEmojiFontSize?: string;
  selectedEmojiAnimation?: SubsectionPagerEmojiAnimation;
  iconFrameStyle?: "default" | "none";
  selectedIconFrameStyle?: "default" | "none";
  borderlessIconButtons?: boolean;
  flatIconButtons?: boolean;
  menuId: string;
  previousAriaLabel: string;
  nextAriaLabel: string;
  selectorAriaLabel: string;
  previousButtonSx?: SxProps<Theme>;
  onSelect: (key: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

const formatLabel = (index: number, title: string, showOrdinal: boolean) =>
  showOrdinal ? `${index + 1}. ${title}` : title;
const getTitleModeColor = (theme: Theme) =>
  theme.palette.mode === "dark"
    ? alpha(theme.palette.common.white, 0.82)
    : alpha(theme.palette.text.primary, 0.72);
const getPagerIconButtonSx =
  (
    selectedValueAsTitle: boolean,
    includeRightMargin = false,
    borderlessIconButtons = false,
    flatIconButtons = false,
  ) =>
  (theme: Theme) => ({
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

const getSelectedEmojiAnimationTypographySx = (
  animation: SubsectionPagerResolvedEmojiAnimation,
) => {
  switch (animation) {
    case "tornado":
      return {
        animation: "subsectionPagerTornadoSpin 2200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "flip":
      return {
        animation: "subsectionPagerFlipInY 2400ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        transformOrigin: "50% 50%",
        transformStyle: "preserve-3d",
        backfaceVisibility: "visible",
        display: "inline-block",
      };
    case "bounce":
      return {
        animation: "subsectionPagerBounceIn 1200ms cubic-bezier(0.22, 1, 0.36, 1)",
        transformOrigin: "50% 100%",
        display: "inline-block",
      };
    case "pulse":
      return {
        animation: "subsectionPagerPulseIn 1100ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "fadeSwap":
      return {
        animation: "subsectionPagerFadeSwap 1350ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "fadeInOut":
      return {
        animation: "subsectionPagerFadeInOut 1450ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "fadeOutIn":
      return {
        animation: "subsectionPagerFadeOutIn 1450ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "shrinkGrow":
      return {
        animation: "subsectionPagerShrinkGrow 1300ms cubic-bezier(0.22, 1, 0.36, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "bounceSwap":
      return {
        animation: "subsectionPagerBounceSwap 1450ms cubic-bezier(0.22, 1, 0.36, 1)",
        transformOrigin: "50% 100%",
        display: "inline-block",
      };
    case "wobblePop":
      return {
        animation: "subsectionPagerWobblePop 1650ms cubic-bezier(0.2, 0.9, 0.2, 1)",
        transformOrigin: "50% 100%",
        display: "inline-block",
      };
    case "slideSnap":
      return {
        animation: "subsectionPagerSlideSnap 1250ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "slideUpDown":
      return {
        animation: "subsectionPagerSlideUpDown 1500ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "slideDownUp":
      return {
        animation: "subsectionPagerSlideDownUp 1500ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "slideLeftRight":
      return {
        animation: "subsectionPagerSlideLeftRight 1500ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "slideRightLeft":
      return {
        animation: "subsectionPagerSlideRightLeft 1500ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "materialize":
      return {
        animation: "subsectionPagerMaterialize 1850ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "beamMeUp":
      return {
        animation: "subsectionPagerBeamMeUp 1650ms cubic-bezier(0.2, 0.9, 0.2, 1)",
        transformOrigin: "50% 100%",
        display: "inline-block",
      };
    case "beamMeDown":
      return {
        animation: "subsectionPagerBeamMeDown 1650ms cubic-bezier(0.2, 0.9, 0.2, 1)",
        transformOrigin: "50% 0%",
        display: "inline-block",
      };
    case "jelloTilt":
      return {
        animation: "subsectionPagerJelloTilt 1750ms cubic-bezier(0.22, 1, 0.36, 1)",
        transformOrigin: "50% 100%",
        display: "inline-block",
      };
    case "cometTrail":
      return {
        animation: "subsectionPagerCometTrail 1650ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "warpIn":
      return {
        animation: "subsectionPagerWarpIn 1850ms cubic-bezier(0.2, 0.86, 0.25, 1)",
        transformOrigin: "50% 50%",
        transformStyle: "preserve-3d",
        backfaceVisibility: "visible",
        display: "inline-block",
      };
    case "glitchPop":
      return {
        animation: "subsectionPagerGlitchPop 1450ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "heartbeat":
      return {
        animation: "subsectionPagerHeartbeat 1650ms cubic-bezier(0.22, 1, 0.36, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "orbitIn":
      return {
        animation: "subsectionPagerOrbitIn 1950ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "peekInOut":
      return {
        animation: "subsectionPagerPeekInOut 1650ms cubic-bezier(0.22, 1, 0.36, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "tada":
      return {
        animation: "subsectionPagerTada 1700ms cubic-bezier(0.2, 0.86, 0.25, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    case "explodeImplode":
      return {
        animation: "subsectionPagerExplodeImplode 1900ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "50% 50%",
        display: "inline-block",
      };
    default:
      return {};
  }
};

const getSelectedEmojiAnimationKeyframesSx = (animation: SubsectionPagerResolvedEmojiAnimation) => {
  switch (animation) {
    case "tornado":
      return {
        "@keyframes subsectionPagerTornadoSpin": {
          "0%": {
            transform: "rotate(0deg) scale(0.76)",
            opacity: 0.18,
            filter: "blur(0.4px)",
          },
          "24%": {
            transform: "rotate(400deg) scale(1.18)",
            opacity: 1,
            filter: "blur(0px)",
          },
          "58%": {
            transform: "rotate(980deg) scale(0.92)",
            opacity: 1,
          },
          "100%": {
            transform: "rotate(1440deg) scale(1)",
            opacity: 1,
          },
        },
      };
    case "flip":
      return {
        "@keyframes subsectionPagerFlipInY": {
          "0%": {
            transform: "perspective(760px) rotateY(-900deg) scale(0.84)",
            opacity: 0.2,
          },
          "44%": {
            transform: "perspective(760px) rotateY(-240deg) scale(1.08)",
            opacity: 1,
          },
          "72%": {
            transform: "perspective(760px) rotateY(36deg) scale(0.96)",
            opacity: 1,
          },
          "100%": {
            transform: "perspective(760px) rotateY(0deg) scale(1)",
            opacity: 1,
          },
        },
      };
    case "bounce":
      return {
        "@keyframes subsectionPagerBounceIn": {
          "0%": {
            transform: "translateY(-12px) scale(0.84)",
            opacity: 0,
          },
          "42%": {
            transform: "translateY(2px) scale(1.1)",
            opacity: 1,
          },
          "72%": {
            transform: "translateY(-1px) scale(0.97)",
            opacity: 1,
          },
          "100%": {
            transform: "translateY(0px) scale(1)",
            opacity: 1,
          },
        },
      };
    case "pulse":
      return {
        "@keyframes subsectionPagerPulseIn": {
          "0%": {
            transform: "scale(0.84)",
            opacity: 0.45,
          },
          "45%": {
            transform: "scale(1.22)",
            opacity: 1,
          },
          "75%": {
            transform: "scale(0.96)",
            opacity: 1,
          },
          "100%": {
            transform: "scale(1)",
            opacity: 1,
          },
        },
      };
    case "fadeSwap":
      return {
        "@keyframes subsectionPagerFadeSwap": {
          "0%": {
            opacity: 0,
            transform: "scale(1.18)",
            filter: "blur(0.8px)",
          },
          "38%": {
            opacity: 0.9,
            transform: "scale(0.88)",
            filter: "blur(0px)",
          },
          "72%": {
            opacity: 1,
            transform: "scale(1.06)",
          },
          "100%": {
            opacity: 1,
            transform: "scale(1)",
          },
        },
      };
    case "fadeInOut":
      return {
        "@keyframes subsectionPagerFadeInOut": {
          "0%": {
            opacity: 0,
            transform: "scale(0.92)",
            filter: "blur(0.6px)",
          },
          "38%": {
            opacity: 1,
            transform: "scale(1.04)",
            filter: "blur(0px)",
          },
          "68%": {
            opacity: 0.26,
            transform: "scale(0.98)",
          },
          "100%": {
            opacity: 1,
            transform: "scale(1)",
            filter: "blur(0px)",
          },
        },
      };
    case "fadeOutIn":
      return {
        "@keyframes subsectionPagerFadeOutIn": {
          "0%": {
            opacity: 1,
            transform: "scale(1)",
            filter: "blur(0px)",
          },
          "34%": {
            opacity: 0.2,
            transform: "scale(0.96)",
            filter: "blur(0.8px)",
          },
          "72%": {
            opacity: 1,
            transform: "scale(1.06)",
            filter: "blur(0px)",
          },
          "100%": {
            opacity: 1,
            transform: "scale(1)",
          },
        },
      };
    case "shrinkGrow":
      return {
        "@keyframes subsectionPagerShrinkGrow": {
          "0%": {
            opacity: 0.2,
            transform: "scale(1.42)",
            filter: "blur(0.4px)",
          },
          "45%": {
            opacity: 1,
            transform: "scale(0.72)",
            filter: "blur(0px)",
          },
          "74%": {
            opacity: 1,
            transform: "scale(1.11)",
          },
          "100%": {
            opacity: 1,
            transform: "scale(1)",
          },
        },
      };
    case "bounceSwap":
      return {
        "@keyframes subsectionPagerBounceSwap": {
          "0%": {
            opacity: 0,
            transform: "translateY(-26px) scale(0.68)",
          },
          "42%": {
            opacity: 1,
            transform: "translateY(8px) scale(1.18)",
          },
          "68%": {
            opacity: 1,
            transform: "translateY(-3px) scale(0.94)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0px) scale(1)",
          },
        },
      };
    case "wobblePop":
      return {
        "@keyframes subsectionPagerWobblePop": {
          "0%": {
            opacity: 0,
            transform: "translateY(10px) scale(0.72) rotate(-12deg)",
          },
          "36%": {
            opacity: 1,
            transform: "translateY(-3px) scale(1.16) rotate(10deg)",
          },
          "58%": {
            opacity: 1,
            transform: "translateY(2px) scale(0.97) rotate(-7deg)",
          },
          "78%": {
            opacity: 1,
            transform: "translateY(-1px) scale(1.04) rotate(4deg)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0px) scale(1) rotate(0deg)",
          },
        },
      };
    case "slideSnap":
      return {
        "@keyframes subsectionPagerSlideSnap": {
          "0%": {
            opacity: 0,
            transform: "translateX(-22px) scale(0.82)",
          },
          "48%": {
            opacity: 1,
            transform: "translateX(7px) scale(1.12)",
          },
          "76%": {
            opacity: 1,
            transform: "translateX(-2px) scale(0.98)",
          },
          "100%": {
            opacity: 1,
            transform: "translateX(0px) scale(1)",
          },
        },
      };
    case "slideUpDown":
      return {
        "@keyframes subsectionPagerSlideUpDown": {
          "0%": {
            opacity: 0,
            transform: "translateY(-28px) scale(0.84)",
          },
          "42%": {
            opacity: 1,
            transform: "translateY(9px) scale(1.1)",
          },
          "72%": {
            opacity: 1,
            transform: "translateY(-3px) scale(0.98)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0px) scale(1)",
          },
        },
      };
    case "slideDownUp":
      return {
        "@keyframes subsectionPagerSlideDownUp": {
          "0%": {
            opacity: 0,
            transform: "translateY(28px) scale(0.84)",
          },
          "42%": {
            opacity: 1,
            transform: "translateY(-9px) scale(1.1)",
          },
          "72%": {
            opacity: 1,
            transform: "translateY(3px) scale(0.98)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0px) scale(1)",
          },
        },
      };
    case "slideLeftRight":
      return {
        "@keyframes subsectionPagerSlideLeftRight": {
          "0%": {
            opacity: 0,
            transform: "translateX(-30px) scale(0.84)",
          },
          "42%": {
            opacity: 1,
            transform: "translateX(10px) scale(1.1)",
          },
          "72%": {
            opacity: 1,
            transform: "translateX(-3px) scale(0.98)",
          },
          "100%": {
            opacity: 1,
            transform: "translateX(0px) scale(1)",
          },
        },
      };
    case "slideRightLeft":
      return {
        "@keyframes subsectionPagerSlideRightLeft": {
          "0%": {
            opacity: 0,
            transform: "translateX(30px) scale(0.84)",
          },
          "42%": {
            opacity: 1,
            transform: "translateX(-10px) scale(1.1)",
          },
          "72%": {
            opacity: 1,
            transform: "translateX(3px) scale(0.98)",
          },
          "100%": {
            opacity: 1,
            transform: "translateX(0px) scale(1)",
          },
        },
      };
    case "materialize":
      return {
        "@keyframes subsectionPagerMaterialize": {
          "0%": {
            opacity: 0,
            transform: "scale(1.24)",
            filter: "blur(2.4px) saturate(0.7)",
          },
          "34%": {
            opacity: 0.96,
            transform: "scale(0.86)",
            filter: "blur(0.8px) saturate(1.15)",
          },
          "68%": {
            opacity: 1,
            transform: "scale(1.06)",
            filter: "blur(0px) saturate(1.02)",
          },
          "100%": {
            opacity: 1,
            transform: "scale(1)",
            filter: "blur(0px) saturate(1)",
          },
        },
      };
    case "beamMeUp":
      return {
        "@keyframes subsectionPagerBeamMeUp": {
          "0%": {
            opacity: 0,
            transform: "translateY(22px) scaleY(0.62) scaleX(1.12)",
            filter: "blur(1.5px) brightness(1.15)",
          },
          "36%": {
            opacity: 1,
            transform: "translateY(-8px) scaleY(1.18) scaleX(0.92)",
            filter: "blur(0.3px) brightness(1.05)",
          },
          "70%": {
            opacity: 1,
            transform: "translateY(2px) scaleY(0.95) scaleX(1.02)",
            filter: "blur(0px) brightness(1)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0px) scaleY(1) scaleX(1)",
            filter: "blur(0px) brightness(1)",
          },
        },
      };
    case "beamMeDown":
      return {
        "@keyframes subsectionPagerBeamMeDown": {
          "0%": {
            opacity: 0,
            transform: "translateY(-22px) scaleY(0.62) scaleX(1.12)",
            filter: "blur(1.5px) brightness(1.15)",
          },
          "36%": {
            opacity: 1,
            transform: "translateY(8px) scaleY(1.18) scaleX(0.92)",
            filter: "blur(0.3px) brightness(1.05)",
          },
          "70%": {
            opacity: 1,
            transform: "translateY(-2px) scaleY(0.95) scaleX(1.02)",
            filter: "blur(0px) brightness(1)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0px) scaleY(1) scaleX(1)",
            filter: "blur(0px) brightness(1)",
          },
        },
      };
    case "jelloTilt":
      return {
        "@keyframes subsectionPagerJelloTilt": {
          "0%": {
            opacity: 0,
            transform: "scale(0.78) skewX(-15deg) skewY(6deg)",
            filter: "blur(0.8px)",
          },
          "30%": {
            opacity: 1,
            transform: "scale(1.14) skewX(9deg) skewY(-3deg)",
            filter: "blur(0.2px)",
          },
          "52%": {
            transform: "scale(0.95) skewX(-7deg) skewY(3deg)",
            filter: "blur(0px)",
          },
          "74%": {
            transform: "scale(1.03) skewX(3deg) skewY(-1deg)",
          },
          "100%": {
            opacity: 1,
            transform: "scale(1) skewX(0deg) skewY(0deg)",
            filter: "blur(0px)",
          },
        },
      };
    case "cometTrail":
      return {
        "@keyframes subsectionPagerCometTrail": {
          "0%": {
            opacity: 0,
            transform: "translateX(-42px) scale(0.76) rotate(-16deg)",
            filter: "blur(1.6px) brightness(1.2)",
          },
          "38%": {
            opacity: 1,
            transform: "translateX(10px) scale(1.12) rotate(5deg)",
            filter: "blur(0.3px) brightness(1.05)",
          },
          "70%": {
            transform: "translateX(-3px) scale(0.98) rotate(-2deg)",
            filter: "blur(0px) brightness(1)",
          },
          "100%": {
            opacity: 1,
            transform: "translateX(0px) scale(1) rotate(0deg)",
            filter: "blur(0px) brightness(1)",
          },
        },
      };
    case "warpIn":
      return {
        "@keyframes subsectionPagerWarpIn": {
          "0%": {
            opacity: 0,
            transform: "perspective(760px) rotateX(64deg) rotateY(-26deg) scale(0.62)",
            filter: "blur(1.2px)",
          },
          "34%": {
            opacity: 1,
            transform: "perspective(760px) rotateX(-12deg) rotateY(8deg) scale(1.16)",
            filter: "blur(0.4px)",
          },
          "68%": {
            transform: "perspective(760px) rotateX(5deg) rotateY(-3deg) scale(0.96)",
            filter: "blur(0px)",
          },
          "100%": {
            opacity: 1,
            transform: "perspective(760px) rotateX(0deg) rotateY(0deg) scale(1)",
            filter: "blur(0px)",
          },
        },
      };
    case "glitchPop":
      return {
        "@keyframes subsectionPagerGlitchPop": {
          "0%": {
            opacity: 0,
            transform: "translateX(-6px) scale(0.9)",
            filter: "blur(0.8px) hue-rotate(0deg)",
          },
          "16%": {
            opacity: 0.5,
            transform: "translateX(7px) scale(1.08)",
            filter: "blur(0.4px) hue-rotate(20deg)",
          },
          "30%": {
            opacity: 1,
            transform: "translateX(-5px) scale(0.98)",
            filter: "blur(0.2px) hue-rotate(-18deg)",
          },
          "48%": {
            transform: "translateX(3px) scale(1.04)",
            filter: "blur(0px) hue-rotate(10deg)",
          },
          "68%": {
            transform: "translateX(-2px) scale(0.99)",
            filter: "hue-rotate(-6deg)",
          },
          "100%": {
            opacity: 1,
            transform: "translateX(0px) scale(1)",
            filter: "hue-rotate(0deg)",
          },
        },
      };
    case "heartbeat":
      return {
        "@keyframes subsectionPagerHeartbeat": {
          "0%": {
            opacity: 0.2,
            transform: "scale(0.86)",
          },
          "24%": {
            opacity: 1,
            transform: "scale(1.18)",
          },
          "36%": {
            transform: "scale(0.97)",
          },
          "52%": {
            transform: "scale(1.12)",
          },
          "68%": {
            transform: "scale(0.99)",
          },
          "100%": {
            opacity: 1,
            transform: "scale(1)",
          },
        },
      };
    case "orbitIn":
      return {
        "@keyframes subsectionPagerOrbitIn": {
          "0%": {
            opacity: 0,
            transform: "translateX(-30px) translateY(-24px) rotate(-120deg) scale(0.72)",
            filter: "blur(1px)",
          },
          "36%": {
            opacity: 1,
            transform: "translateX(12px) translateY(8px) rotate(24deg) scale(1.14)",
            filter: "blur(0.3px)",
          },
          "64%": {
            transform: "translateX(-4px) translateY(-2px) rotate(-9deg) scale(0.98)",
            filter: "blur(0px)",
          },
          "100%": {
            opacity: 1,
            transform: "translateX(0px) translateY(0px) rotate(0deg) scale(1)",
            filter: "blur(0px)",
          },
        },
      };
    case "peekInOut":
      return {
        "@keyframes subsectionPagerPeekInOut": {
          "0%": {
            opacity: 0,
            transform: "translateX(-18px) scale(0.86)",
            clipPath: "inset(0 54% 0 0)",
            filter: "blur(0.8px)",
          },
          "34%": {
            opacity: 1,
            transform: "translateX(6px) scale(1.09)",
            clipPath: "inset(0 0 0 0)",
            filter: "blur(0.2px)",
          },
          "66%": {
            opacity: 0.45,
            transform: "translateX(-4px) scale(0.97)",
            clipPath: "inset(0 0 0 56%)",
            filter: "blur(0px)",
          },
          "100%": {
            opacity: 1,
            transform: "translateX(0px) scale(1)",
            clipPath: "inset(0 0 0 0)",
            filter: "blur(0px)",
          },
        },
      };
    case "tada":
      return {
        "@keyframes subsectionPagerTada": {
          "0%": {
            opacity: 0.1,
            transform: "scale(0.84) rotate(-9deg)",
          },
          "22%": {
            opacity: 1,
            transform: "scale(1.22) rotate(8deg)",
          },
          "40%": {
            transform: "scale(1.08) rotate(-7deg)",
          },
          "58%": {
            transform: "scale(1.14) rotate(6deg)",
          },
          "76%": {
            transform: "scale(1.02) rotate(-3deg)",
          },
          "100%": {
            opacity: 1,
            transform: "scale(1) rotate(0deg)",
          },
        },
      };
    case "explodeImplode":
      return {
        "@keyframes subsectionPagerExplodeImplode": {
          "0%": {
            opacity: 1,
            transform: "scale(1)",
            filter: "blur(0px)",
          },
          "34%": {
            opacity: 0.08,
            transform: "scale(1.95)",
            filter: "blur(2.2px)",
          },
          "58%": {
            opacity: 0.75,
            transform: "scale(0.68)",
            filter: "blur(0.6px)",
          },
          "78%": {
            opacity: 1,
            transform: "scale(1.09)",
            filter: "blur(0px)",
          },
          "100%": {
            opacity: 1,
            transform: "scale(1)",
            filter: "blur(0px)",
          },
        },
      };
    default:
      return {};
  }
};

export default function SubsectionPager({
  items,
  currentKey,
  showOrdinal = true,
  selectedValueAsTitle = false,
  selectedVisualSize = 24,
  selectedIconFontSize,
  selectedEmojiFontSize,
  optionVisualSize: optionVisualSizeProp,
  optionEmojiFontSize: optionEmojiFontSizeProp,
  selectedEmojiAnimation = "none",
  iconFrameStyle = "default",
  selectedIconFrameStyle,
  borderlessIconButtons = false,
  flatIconButtons = false,
  menuId,
  previousAriaLabel,
  nextAriaLabel,
  selectorAriaLabel,
  previousButtonSx,
  onSelect,
  onPrevious,
  onNext,
}: SubsectionPagerProps) {
  const [selectorAnchorEl, setSelectorAnchorEl] = useState<HTMLElement | null>(null);
  const selectorOpen = Boolean(selectorAnchorEl);
  const currentIndex = useMemo(() => {
    const matchedIndex = items.findIndex((item) => item.key === currentKey);
    return matchedIndex >= 0 ? matchedIndex : 0;
  }, [currentKey, items]);
  const currentItem = items[currentIndex];
  const hasMultipleItems = items.length > 1;
  const randomAnimationTriggerKey = `${menuId}:${currentItem?.key ?? "initial"}`;
  const [randomResolvedEmojiAnimation, setRandomResolvedEmojiAnimation] =
    useState<SubsectionPagerResolvedEmojiAnimation>(() =>
      selectedEmojiAnimation === "random" ? pickRandomEmojiAnimation(menuId) : "flip",
    );
  const lastRandomAnimationTriggerRef = useRef<string | null>(
    selectedEmojiAnimation === "random" ? randomAnimationTriggerKey : null,
  );

  useEffect(() => {
    if (selectedEmojiAnimation !== "random") {
      lastRandomAnimationTriggerRef.current = null;
      return;
    }
    if (lastRandomAnimationTriggerRef.current === randomAnimationTriggerKey) {
      return;
    }
    lastRandomAnimationTriggerRef.current = randomAnimationTriggerKey;
    const nextAnimation = pickRandomEmojiAnimation(menuId);
    setRandomResolvedEmojiAnimation(nextAnimation);
  }, [selectedEmojiAnimation, randomAnimationTriggerKey, menuId]);

  if (!currentItem || !hasMultipleItems) {
    return null;
  }

  const handleSelectorOpen = (event: MouseEvent<HTMLElement>) => {
    setSelectorAnchorEl(event.currentTarget);
  };

  const handleSelectorClose = () => {
    setSelectorAnchorEl(null);
  };

  const handleSelect = (key: string) => {
    onSelect(key);
    setSelectorAnchorEl(null);
  };
  const selectedTitleSource =
    currentItem.selectedTitle ??
    currentItem.optionTitle ??
    currentItem.optionLabel ??
    currentItem.title;
  const selectedTitle = selectedTitleSource?.trim() || currentItem.title;
  const selectedEmojiFontSizeResolved =
    selectedEmojiFontSize ?? `${Math.max(16, Math.round(selectedVisualSize * 0.78))}px`;
  const selectedVisualSizeResponsive = {
    xs: Math.max(24, Math.round(selectedVisualSize * 0.52)),
    sm: Math.max(30, Math.round(selectedVisualSize * 0.66)),
    md: selectedVisualSize,
  };
  const selectedIconFrameStyleResolved = selectedIconFrameStyle ?? iconFrameStyle;
  const resolvedSelectedEmojiAnimation =
    selectedEmojiAnimation === "random" ? randomResolvedEmojiAnimation : selectedEmojiAnimation;
  const selectedEmojiAnimationTypographySx = getSelectedEmojiAnimationTypographySx(
    resolvedSelectedEmojiAnimation,
  );
  const selectedEmojiAnimationKeyframesSx = getSelectedEmojiAnimationKeyframesSx(
    resolvedSelectedEmojiAnimation,
  );
  const optionVisualSize = optionVisualSizeProp ?? 52;
  const optionEmojiFontSizeResolved =
    optionEmojiFontSizeProp ?? `${Math.max(24, Math.round(optionVisualSize * 0.74))}px`;
  const previousButtonMergedSx: SxProps<Theme> = (() => {
    const base = getPagerIconButtonSx(
      selectedValueAsTitle,
      false,
      borderlessIconButtons,
      flatIconButtons,
    );
    if (!previousButtonSx) {
      return base;
    }
    if (Array.isArray(previousButtonSx)) {
      return [base, ...previousButtonSx];
    }
    return [base, previousButtonSx];
  })();
  const previousButtonMergedSxArray = Array.isArray(previousButtonMergedSx)
    ? previousButtonMergedSx
    : [previousButtonMergedSx];
  const selectedImageSrc = currentItem.selectedImageSrc ?? currentItem.optionImageSrc;
  const selectedImageAlt =
    currentItem.selectedImageAlt ?? currentItem.optionImageAlt ?? `${currentItem.title} icon`;
  const selectedIcon = currentItem.selectedIcon ?? currentItem.optionIcon;
  const selectedVisual = selectedImageSrc ? (
    <Box
      key={`selected-visual-${currentItem.key}`}
      className="subsection-pager-selected-visual"
      component="img"
      src={selectedImageSrc}
      alt={selectedImageAlt}
      sx={{
        width: selectedVisualSizeResponsive,
        height: selectedVisualSizeResponsive,
        borderRadius: selectedIconFrameStyleResolved === "none" ? 0 : 1.5,
        objectFit: "contain",
        border: selectedIconFrameStyleResolved === "none" ? "none" : "1px solid",
        borderColor:
          selectedIconFrameStyleResolved === "none"
            ? "transparent"
            : (theme) =>
                selectedValueAsTitle
                  ? alpha(theme.palette.common.white, 0.3)
                  : theme.palette.divider,
        bgcolor: (theme) =>
          selectedIconFrameStyleResolved === "none"
            ? "transparent"
            : selectedValueAsTitle
              ? alpha(theme.palette.common.white, 0.06)
              : theme.palette.background.paper,
        p: selectedIconFrameStyleResolved === "none" ? 0 : 0.2,
        flexShrink: 0,
        transition: "transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
      }}
    />
  ) : selectedIcon ? (
    <Box
      key={`selected-visual-${currentItem.key}`}
      className="subsection-pager-selected-visual"
      aria-hidden="true"
      sx={{
        width: selectedVisualSizeResponsive,
        height: selectedVisualSizeResponsive,
        borderRadius: selectedIconFrameStyleResolved === "none" ? 0 : 1.5,
        border: selectedIconFrameStyleResolved === "none" ? "none" : "1px solid",
        borderColor:
          selectedIconFrameStyleResolved === "none"
            ? "transparent"
            : (theme) =>
                selectedValueAsTitle
                  ? alpha(theme.palette.common.white, 0.3)
                  : theme.palette.divider,
        bgcolor: (theme) =>
          selectedIconFrameStyleResolved === "none"
            ? "transparent"
            : selectedValueAsTitle
              ? alpha(theme.palette.common.white, 0.06)
              : theme.palette.background.paper,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: selectedValueAsTitle ? "currentColor" : "text.secondary",
        flexShrink: 0,
        "& .MuiSvgIcon-root": {
          fontSize: {
            xs: "1rem",
            sm: "1.15rem",
            md: selectedIconFontSize ?? "1rem",
          },
        },
        "& .MuiTypography-root": {
          fontSize: {
            xs: "1.12rem",
            sm: "1.35rem",
            md: selectedEmojiFontSizeResolved,
          },
          lineHeight: 1,
          ...selectedEmojiAnimationTypographySx,
        },
        ...selectedEmojiAnimationKeyframesSx,
        transition: "transform 180ms ease, border-color 180ms ease, background-color 180ms ease",
      }}
    >
      {selectedIcon}
    </Box>
  ) : null;

  return (
    <>
      <Box
        sx={{
          flexShrink: 0,
          mt: 0.5,
          mx: 0.75,
          px: 1,
          py: 0.5,
          borderBottom: selectedValueAsTitle ? "none" : "1px solid",
          borderColor: "divider",
          ...(selectedValueAsTitle
            ? {
                bgcolor: "transparent",
                boxShadow: "none",
                backdropFilter: "none",
              }
            : undefined),
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            size="small"
            aria-label={previousAriaLabel}
            onClick={onPrevious}
            sx={previousButtonMergedSxArray}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
          <Chip
            clickable
            color="primary"
            variant="outlined"
            onClick={handleSelectorOpen}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 0.38, sm: 0.55, md: 0.7 },
                  width: "100%",
                  minWidth: 0,
                }}
              >
                {selectedVisual}
                <Typography
                  component="span"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: selectedValueAsTitle
                      ? { xs: "0.86rem", sm: "0.98rem", md: "1.38rem" }
                      : { xs: "0.8rem", sm: "0.92rem", md: "1.24rem" },
                    lineHeight: selectedValueAsTitle ? 1.12 : 1.2,
                    fontWeight: 800,
                    color: selectedValueAsTitle ? (theme) => getTitleModeColor(theme) : undefined,
                  }}
                >
                  {formatLabel(currentIndex, selectedTitle, showOrdinal)}
                </Typography>
              </Box>
            }
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? menuId : undefined}
            sx={{
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
                    transition: "background-color 180ms ease, transform 180ms ease",
                    "&.MuiChip-outlined": {
                      border: "0 !important",
                    },
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08) !important",
                      backgroundColor: "rgba(255,255,255,0.08) !important",
                      transform: "translateY(-1px)",
                    },
                    "&:hover .subsection-pager-selected-visual": {
                      ...(selectedIconFrameStyleResolved === "none"
                        ? {
                            borderColor: "transparent",
                            backgroundColor: "transparent",
                            transform: "none",
                          }
                        : {
                            borderColor: "rgba(255,255,255,0.52)",
                            backgroundColor: "rgba(255,255,255,0.14)",
                            transform: "translateY(-1px) scale(1.04)",
                          }),
                    },
                    "&.Mui-focusVisible": {
                      bgcolor: "rgba(255,255,255,0.12) !important",
                      backgroundColor: "rgba(255,255,255,0.12) !important",
                    },
                    "&.Mui-focusVisible .subsection-pager-selected-visual": {
                      ...(selectedIconFrameStyleResolved === "none"
                        ? {
                            borderColor: "transparent",
                            backgroundColor: "transparent",
                          }
                        : {
                            borderColor: "rgba(255,255,255,0.52)",
                            backgroundColor: "rgba(255,255,255,0.14)",
                          }),
                    },
                  }
                : undefined),
              "& .MuiChip-label": {
                width: "100%",
                overflow: "hidden",
                display: "block",
                py: 0.15,
              },
            }}
          />
          <IconButton
            size="small"
            aria-label={nextAriaLabel}
            onClick={onNext}
            sx={getPagerIconButtonSx(
              selectedValueAsTitle,
              false,
              borderlessIconButtons,
              flatIconButtons,
            )}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={selectorAriaLabel}
            size="small"
            onClick={handleSelectorOpen}
            aria-haspopup="menu"
            aria-expanded={selectorOpen ? "true" : undefined}
            aria-controls={selectorOpen ? menuId : undefined}
            sx={[
              getPagerIconButtonSx(
                selectedValueAsTitle,
                true,
                borderlessIconButtons,
                flatIconButtons,
              ),
              {
                display: { xs: "none", sm: "none", md: "inline-flex" },
              },
            ]}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Menu
        id={menuId}
        anchorEl={selectorAnchorEl}
        open={selectorOpen}
        onClose={handleSelectorClose}
        slotProps={{
          paper: {
            sx: {
              minWidth: { xs: 260, sm: 320 },
            },
          },
        }}
      >
        {items.map((item, index) => (
          <MenuItem
            key={item.key}
            selected={index === currentIndex}
            onClick={() => handleSelect(item.key)}
            sx={
              item.optionImageSrc || item.optionIcon
                ? {
                    display: "grid",
                    gridTemplateColumns: `${Math.max(40, optionVisualSize)}px minmax(0, 1fr)`,
                    columnGap: 1.25,
                    alignItems: "start",
                    py: 1.15,
                  }
                : undefined
            }
          >
            {item.optionImageSrc ? (
              <Box
                component="img"
                src={item.optionImageSrc}
                alt={item.optionImageAlt || `${item.title} logo`}
                sx={{
                  width: optionVisualSize,
                  height: optionVisualSize,
                  mt: 0.1,
                  borderRadius: iconFrameStyle === "none" ? 0 : 1.5,
                  objectFit: "contain",
                  border: iconFrameStyle === "none" ? "none" : "1px solid",
                  borderColor: iconFrameStyle === "none" ? "transparent" : "divider",
                  bgcolor: iconFrameStyle === "none" ? "transparent" : "background.paper",
                  p: iconFrameStyle === "none" ? 0 : 0.5,
                }}
              />
            ) : item.optionIcon ? (
              <Box
                aria-hidden="true"
                sx={{
                  width: optionVisualSize,
                  height: optionVisualSize,
                  mt: 0.1,
                  borderRadius: iconFrameStyle === "none" ? 0 : 1.5,
                  border: iconFrameStyle === "none" ? "none" : "1px solid",
                  borderColor: iconFrameStyle === "none" ? "transparent" : "divider",
                  bgcolor: iconFrameStyle === "none" ? "transparent" : "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  color: "text.secondary",
                  "& .MuiSvgIcon-root": {
                    fontSize: "1.55rem",
                  },
                  "& .MuiTypography-root": {
                    fontSize: `min(${optionEmojiFontSizeResolved}, ${Math.max(
                      18,
                      Math.round(optionVisualSize * 0.82),
                    )}px)`,
                    lineHeight: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                  },
                }}
              >
                {item.optionIcon}
              </Box>
            ) : null}
            <Box
              sx={{
                minWidth: 0,
                ...(item.optionImageSrc || item.optionIcon ? { gridColumn: 2 } : undefined),
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 0.75,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 0,
                    flex: "1 1 auto",
                    fontWeight: 600,
                    lineHeight: 1.3,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.optionTitle ??
                    item.optionLabel ??
                    formatLabel(index, item.title, showOrdinal)}
                </Typography>
                {item.optionTypeChipLabel ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    color={item.optionTypeChipColor ?? "default"}
                    label={item.optionTypeChipLabel}
                    sx={{
                      flexShrink: 0,
                      height: 20,
                      "& .MuiChip-label": {
                        px: 0.8,
                        fontSize: "0.66rem",
                        fontWeight: 700,
                        letterSpacing: "0.01em",
                      },
                    }}
                  />
                ) : null}
              </Box>
              {item.optionSubtitle ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    mt: 0.25,
                    whiteSpace: "pre-line",
                    lineHeight: 1.35,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {Array.isArray(item.optionSubtitle)
                    ? item.optionSubtitle.filter(Boolean).join("\n")
                    : item.optionSubtitle}
                </Typography>
              ) : null}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
