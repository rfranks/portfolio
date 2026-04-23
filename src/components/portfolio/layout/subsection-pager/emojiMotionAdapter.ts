import type { Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import type { SubsectionPagerResolvedEmojiAnimation } from "./types";
export { useResolvedSubsectionPagerEmojiAnimation } from "./emojiMotionRandom";

export const getSelectedEmojiAnimationTypographySx = (
  animation: SubsectionPagerResolvedEmojiAnimation,
): SystemStyleObject<Theme> => {
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

export const getSelectedEmojiAnimationKeyframesSx = (
  animation: SubsectionPagerResolvedEmojiAnimation,
): SystemStyleObject<Theme> => {
  switch (animation) {
    case "tornado":
      return {
        "@keyframes subsectionPagerTornadoSpin": {
          "0%": { transform: "rotate(0deg) scale(0.76)", opacity: 0.18, filter: "blur(0.4px)" },
          "24%": { transform: "rotate(400deg) scale(1.18)", opacity: 1, filter: "blur(0px)" },
          "58%": { transform: "rotate(980deg) scale(0.92)", opacity: 1 },
          "100%": { transform: "rotate(1440deg) scale(1)", opacity: 1 },
        },
      };
    case "flip":
      return {
        "@keyframes subsectionPagerFlipInY": {
          "0%": { transform: "perspective(760px) rotateY(-900deg) scale(0.84)", opacity: 0.2 },
          "44%": { transform: "perspective(760px) rotateY(-240deg) scale(1.08)", opacity: 1 },
          "72%": { transform: "perspective(760px) rotateY(36deg) scale(0.96)", opacity: 1 },
          "100%": { transform: "perspective(760px) rotateY(0deg) scale(1)", opacity: 1 },
        },
      };
    case "bounce":
      return {
        "@keyframes subsectionPagerBounceIn": {
          "0%": { transform: "translateY(-12px) scale(0.84)", opacity: 0 },
          "42%": { transform: "translateY(2px) scale(1.1)", opacity: 1 },
          "72%": { transform: "translateY(-1px) scale(0.97)", opacity: 1 },
          "100%": { transform: "translateY(0px) scale(1)", opacity: 1 },
        },
      };
    case "pulse":
      return {
        "@keyframes subsectionPagerPulseIn": {
          "0%": { transform: "scale(0.84)", opacity: 0.45 },
          "45%": { transform: "scale(1.22)", opacity: 1 },
          "75%": { transform: "scale(0.96)", opacity: 1 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
      };
    case "fadeSwap":
      return {
        "@keyframes subsectionPagerFadeSwap": {
          "0%": { opacity: 0, transform: "scale(1.18)", filter: "blur(0.8px)" },
          "38%": { opacity: 0.9, transform: "scale(0.88)", filter: "blur(0px)" },
          "72%": { opacity: 1, transform: "scale(1.06)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      };
    case "fadeInOut":
      return {
        "@keyframes subsectionPagerFadeInOut": {
          "0%": { opacity: 0, transform: "scale(0.92)", filter: "blur(0.6px)" },
          "38%": { opacity: 1, transform: "scale(1.04)", filter: "blur(0px)" },
          "68%": { opacity: 0.26, transform: "scale(0.98)" },
          "100%": { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
        },
      };
    case "fadeOutIn":
      return {
        "@keyframes subsectionPagerFadeOutIn": {
          "0%": { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
          "34%": { opacity: 0.2, transform: "scale(0.96)", filter: "blur(0.8px)" },
          "72%": { opacity: 1, transform: "scale(1.06)", filter: "blur(0px)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      };
    case "shrinkGrow":
      return {
        "@keyframes subsectionPagerShrinkGrow": {
          "0%": { opacity: 0.2, transform: "scale(1.42)", filter: "blur(0.4px)" },
          "45%": { opacity: 1, transform: "scale(0.72)", filter: "blur(0px)" },
          "74%": { opacity: 1, transform: "scale(1.11)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      };
    case "bounceSwap":
      return {
        "@keyframes subsectionPagerBounceSwap": {
          "0%": { opacity: 0, transform: "translateY(-26px) scale(0.68)" },
          "42%": { opacity: 1, transform: "translateY(8px) scale(1.18)" },
          "68%": { opacity: 1, transform: "translateY(-3px) scale(0.94)" },
          "100%": { opacity: 1, transform: "translateY(0px) scale(1)" },
        },
      };
    case "wobblePop":
      return {
        "@keyframes subsectionPagerWobblePop": {
          "0%": { opacity: 0, transform: "translateY(10px) scale(0.72) rotate(-12deg)" },
          "36%": { opacity: 1, transform: "translateY(-3px) scale(1.16) rotate(10deg)" },
          "58%": { opacity: 1, transform: "translateY(2px) scale(0.97) rotate(-7deg)" },
          "78%": { opacity: 1, transform: "translateY(-1px) scale(1.04) rotate(4deg)" },
          "100%": { opacity: 1, transform: "translateY(0px) scale(1) rotate(0deg)" },
        },
      };
    case "slideSnap":
      return {
        "@keyframes subsectionPagerSlideSnap": {
          "0%": { opacity: 0, transform: "translateX(-22px) scale(0.82)" },
          "48%": { opacity: 1, transform: "translateX(7px) scale(1.12)" },
          "76%": { opacity: 1, transform: "translateX(-2px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateX(0px) scale(1)" },
        },
      };
    case "slideUpDown":
      return {
        "@keyframes subsectionPagerSlideUpDown": {
          "0%": { opacity: 0, transform: "translateY(-28px) scale(0.84)" },
          "42%": { opacity: 1, transform: "translateY(9px) scale(1.1)" },
          "72%": { opacity: 1, transform: "translateY(-3px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateY(0px) scale(1)" },
        },
      };
    case "slideDownUp":
      return {
        "@keyframes subsectionPagerSlideDownUp": {
          "0%": { opacity: 0, transform: "translateY(28px) scale(0.84)" },
          "42%": { opacity: 1, transform: "translateY(-9px) scale(1.1)" },
          "72%": { opacity: 1, transform: "translateY(3px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateY(0px) scale(1)" },
        },
      };
    case "slideLeftRight":
      return {
        "@keyframes subsectionPagerSlideLeftRight": {
          "0%": { opacity: 0, transform: "translateX(-30px) scale(0.84)" },
          "42%": { opacity: 1, transform: "translateX(10px) scale(1.1)" },
          "72%": { opacity: 1, transform: "translateX(-3px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateX(0px) scale(1)" },
        },
      };
    case "slideRightLeft":
      return {
        "@keyframes subsectionPagerSlideRightLeft": {
          "0%": { opacity: 0, transform: "translateX(30px) scale(0.84)" },
          "42%": { opacity: 1, transform: "translateX(-10px) scale(1.1)" },
          "72%": { opacity: 1, transform: "translateX(3px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateX(0px) scale(1)" },
        },
      };
    case "materialize":
      return {
        "@keyframes subsectionPagerMaterialize": {
          "0%": { opacity: 0, transform: "scale(1.24)", filter: "blur(2.4px) saturate(0.7)" },
          "34%": {
            opacity: 0.96,
            transform: "scale(0.86)",
            filter: "blur(0.8px) saturate(1.15)",
          },
          "68%": { opacity: 1, transform: "scale(1.06)", filter: "blur(0px) saturate(1.02)" },
          "100%": { opacity: 1, transform: "scale(1)", filter: "blur(0px) saturate(1)" },
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
          "52%": { transform: "scale(0.95) skewX(-7deg) skewY(3deg)", filter: "blur(0px)" },
          "74%": { transform: "scale(1.03) skewX(3deg) skewY(-1deg)" },
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
          "68%": { transform: "translateX(-2px) scale(0.99)", filter: "hue-rotate(-6deg)" },
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
          "0%": { opacity: 0.2, transform: "scale(0.86)" },
          "24%": { opacity: 1, transform: "scale(1.18)" },
          "36%": { transform: "scale(0.97)" },
          "52%": { transform: "scale(1.12)" },
          "68%": { transform: "scale(0.99)" },
          "100%": { opacity: 1, transform: "scale(1)" },
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
          "0%": { opacity: 0.1, transform: "scale(0.84) rotate(-9deg)" },
          "22%": { opacity: 1, transform: "scale(1.22) rotate(8deg)" },
          "40%": { transform: "scale(1.08) rotate(-7deg)" },
          "58%": { transform: "scale(1.14) rotate(6deg)" },
          "76%": { transform: "scale(1.02) rotate(-3deg)" },
          "100%": { opacity: 1, transform: "scale(1) rotate(0deg)" },
        },
      };
    case "explodeImplode":
      return {
        "@keyframes subsectionPagerExplodeImplode": {
          "0%": { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
          "34%": { opacity: 0.08, transform: "scale(1.95)", filter: "blur(2.2px)" },
          "58%": { opacity: 0.75, transform: "scale(0.68)", filter: "blur(0.6px)" },
          "78%": { opacity: 1, transform: "scale(1.09)", filter: "blur(0px)" },
          "100%": { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
        },
      };
    default:
      return {};
  }
};
