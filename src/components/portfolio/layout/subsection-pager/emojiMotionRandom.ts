import { useEffect, useRef, useState } from "react";
import type { SubsectionPagerEmojiAnimation, SubsectionPagerResolvedEmojiAnimation } from "./types";

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

export function useResolvedSubsectionPagerEmojiAnimation(
  selectedEmojiAnimation: SubsectionPagerEmojiAnimation,
  menuId: string,
  triggerKey: string,
): SubsectionPagerResolvedEmojiAnimation {
  const [randomResolvedEmojiAnimation, setRandomResolvedEmojiAnimation] =
    useState<SubsectionPagerResolvedEmojiAnimation>(() =>
      selectedEmojiAnimation === "random" ? pickRandomEmojiAnimation(menuId) : "flip",
    );
  const lastRandomAnimationTriggerRef = useRef<string | null>(
    selectedEmojiAnimation === "random" ? triggerKey : null,
  );

  useEffect(() => {
    if (selectedEmojiAnimation !== "random") {
      lastRandomAnimationTriggerRef.current = null;
      return;
    }
    if (lastRandomAnimationTriggerRef.current === triggerKey) {
      return;
    }
    lastRandomAnimationTriggerRef.current = triggerKey;
    const nextAnimation = pickRandomEmojiAnimation(menuId);
    setRandomResolvedEmojiAnimation(nextAnimation);
  }, [selectedEmojiAnimation, triggerKey, menuId]);

  return selectedEmojiAnimation === "random"
    ? randomResolvedEmojiAnimation
    : selectedEmojiAnimation;
}
