"use client";

import * as React from "react";
import { projects } from "@/consts/resumeData";
import { Diagram, type DiagramProps } from "@/components/shared/Diagram";
import { useAudio } from "@/hooks/audio/useAudio";
import { useAmbience } from "@/hooks/audio/useAmbience";
import { useBGM } from "@/hooks/audio/useBGM";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  type BlackjackCardView,
  type BlackjackGameMode,
  type BlackjackRenderState,
  type BlackjackResultView,
} from "./_types/messages";
import {
  isBlackjackStateMessage,
  postBlackjackAction,
  postBlackjackStart,
  postBlackjackToggleGameMode,
} from "./_utils/messages-utils";
import { rewindAndPlayAudio } from "@/utils/audio";
import { withBasePath } from "@/utils/basePath";
import "./page.css";
import Image from "next/image";

const BLACKJACK_BGM_PROGRESSION = [
  ["C3", "E3", "Bb3", "D4", "G4"],
  ["A2", "C3", "G3", "B3", "E4"],
  ["D3", "F3", "C4", "E4", "A4"],
  ["G2", "B2", "F3", "A3", "D4"],
] as const;

const CARD_BACK_SRC = "/assets/boardgame/PNG/Cards/cardBack_blue1.png";
const CHIP_BLUE_WHITE_SRC = "/assets/boardgame/PNG/Chips/chipBlueWhite.png";
const CHIP_WHITE_BLUE_SRC = "/assets/boardgame/PNG/Chips/chipWhiteBlue.png";
const CHIP_RED_WHITE_SRC = "/assets/boardgame/PNG/Chips/chipRedWhite.png";
const CHIP_GREEN_WHITE_SRC = "/assets/boardgame/PNG/Chips/chipGreenWhite.png";
const CHIP_BLACK_WHITE_SRC = "/assets/boardgame/PNG/Chips/chipBlackWhite.png";
const CHIP_WIN_LAUNCH_SOUNDS = [
  "/audio/chips-handle-1.ogg",
  "/audio/chips-handle-2.ogg",
  "/audio/chips-handle-3.ogg",
  "/audio/chips-handle-5.ogg",
  "/audio/chip-lay-1.ogg",
  "/audio/chip-lay-2.ogg",
  "/audio/chip-lay-3.ogg",
] as const;
const CHIP_WIN_IMPACT_SOUNDS = [
  "/audio/chips-collide-1.ogg",
  "/audio/chips-collide-2.ogg",
  "/audio/chips-collide-4.ogg",
  "/audio/chips-stack-1.ogg",
  "/audio/chips-stack-3.ogg",
] as const;
const BLACKJACK_CONFETTI_SOUND = "/audio/explosionCrunch_003.ogg";
const BLACKJACK_SOUNDS_STORAGE_KEY = "blackjack-sounds-enabled";

type BlackjackDiagramConfig = Pick<
  DiagramProps,
  "diagram" | "height" | "title" | "type"
>;

const BLACKJACK_CAROUSEL_SLIDES = [
  { id: "game-card", label: "Game card" },
  { id: "why-this-project", label: "Why this project interests me" },
  { id: "terminal-demo", label: "Go Blackjack in terminal" },
  { id: "architecture-diagrams", label: "Architecture diagrams" },
] as const;

function getControlDisplay(visible: boolean | undefined) {
  return visible ? undefined : "none";
}

function getWinningsClass(tone: string) {
  switch (tone) {
    case "positive":
      return "positive";
    case "negative":
      return "negative";
    default:
      return undefined;
  }
}

function getResultToneClass(tone: BlackjackResultView["tone"]) {
  switch (tone) {
    case "win":
      return "text-win";
    case "loss":
      return "text-loss";
    default:
      return "text-neutral";
  }
}

function getResultBadgeClass(badge: BlackjackResultView["badge"]) {
  switch (badge) {
    case "Won!":
      return "blackjack-result-badge blackjack-result-badge--winner";
    case "Lost!":
      return "blackjack-result-badge blackjack-result-badge--loser";
    case "Push":
      return "blackjack-result-badge blackjack-result-badge--push";
    default:
      return "blackjack-result-badge";
  }
}

function getGameModeChipClass(gameMode: BlackjackGameMode) {
  switch (gameMode) {
    case "blackjack":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--blackjack";
    case "jack-attack":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--jack-attack";
    case "trifecta":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--trifecta";
    case "trifecta3":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--trifecta3";
    case "trifecta-staxx":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--trifecta-staxx";
    case "spanish21":
      return "blackjack-game-mode-chip blackjack-game-mode-chip--spanish21";
    default:
      return "blackjack-game-mode-chip";
  }
}

function getGameModeChipSrc(gameMode: BlackjackGameMode) {
  switch (gameMode) {
    case "blackjack":
      return CHIP_WHITE_BLUE_SRC;
    case "jack-attack":
      return CHIP_RED_WHITE_SRC;
    case "trifecta":
      return CHIP_GREEN_WHITE_SRC;
    case "trifecta3":
      return CHIP_BLUE_WHITE_SRC;
    case "trifecta-staxx":
      return CHIP_BLACK_WHITE_SRC;
    case "spanish21":
      return CHIP_RED_WHITE_SRC;
    default:
      return CHIP_WHITE_BLUE_SRC;
  }
}

function getOutcomeStampClass(label: string) {
  switch (label) {
    case "Won!":
      return "blackjack-hand-stamp blackjack-hand-stamp--winner";
    case "Blackjack!":
      return "blackjack-hand-stamp blackjack-hand-stamp--blackjack";
    case "Lost!":
    case "Loss!":
    case "Busted!":
      return "blackjack-hand-stamp blackjack-hand-stamp--loser";
    case "Push":
    case "Push!":
      return "blackjack-hand-stamp blackjack-hand-stamp--push";
    default:
      return "blackjack-hand-stamp";
  }
}

function getOutcomeStampAngle({
  index,
  cardsLength,
  totalLabel,
  outcomeLabel,
}: {
  index: number;
  cardsLength: number;
  totalLabel: string;
  outcomeLabel: string;
}) {
  const seed =
    (index + 1) * 7 +
    cardsLength * 5 +
    totalLabel.length * 3 +
    outcomeLabel.length * 3;
  return (seed % 21) - 10;
}

function getCardImageSrc(card: BlackjackCardView) {
  if (card.masked) {
    return CARD_BACK_SRC;
  }

  return `/assets/boardgame/PNG/Cards/card${card.suit}${card.value}.png`;
}

type ChipDecoratedValueProps = {
  chipSrc: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  valueClassName?: string;
};

const WINNING_CHIP_SOURCES = [
  CHIP_BLUE_WHITE_SRC,
  CHIP_WHITE_BLUE_SRC,
  CHIP_RED_WHITE_SRC,
  CHIP_GREEN_WHITE_SRC,
  CHIP_BLACK_WHITE_SRC,
] as const;

type WinningChipFx = {
  id: string;
  chipSrc: string;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  arcY: number;
  size: number;
  delayMs: number;
  durationMs: number;
  startRotate: number;
  endRotate: number;
  startScale: number;
};

type BlackjackConfettiPiece = {
  id: string;
  left: number;
  delayMs: number;
  durationMs: number;
  size: number;
  driftX: number;
  rotateStart: number;
  rotateEnd: number;
  color: string;
  shape: "rect" | "circle";
};

const BLACKJACK_CONFETTI_COLORS = [
  "#facc15",
  "#fb7185",
  "#60a5fa",
  "#4ade80",
  "#f59e0b",
  "#e879f9",
  "#f8fafc",
] as const;

const ChipDecoratedValue = React.forwardRef<
  HTMLSpanElement,
  ChipDecoratedValueProps
>(function ChipDecoratedValue(
  { chipSrc, children, className, id, valueClassName },
  ref,
) {
  return (
    <span ref={ref} id={id} className={className}>
      <Image
        className="blackjack-chip-adornment"
        src={withBasePath(chipSrc)}
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
      />
      <span className={valueClassName}>{children}</span>
    </span>
  );
});

function formatPlayerStackValue(value: number) {
  const roundedValue = Math.round(value);
  const sign = roundedValue >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(roundedValue)}`;
}

function createWinningChipFx({
  chipCount,
  tableWidth,
  tableHeight,
  targetX,
  targetY,
}: {
  chipCount: number;
  tableWidth: number;
  tableHeight: number;
  targetX: number;
  targetY: number;
}): WinningChipFx[] {
  return Array.from({ length: chipCount }, (_, index) => {
    const startX = tableWidth * (0.12 + Math.random() * 0.62);
    const startY = tableHeight * (0.16 + Math.random() * 0.42);
    const size = 34 + Math.random() * 18;
    const deltaX = targetX - startX + (Math.random() * 24 - 12);
    const deltaY = targetY - startY + (Math.random() * 18 - 9);

    return {
      id: `winning-chip-${Date.now()}-${index}`,
      chipSrc:
        WINNING_CHIP_SOURCES[
          Math.floor(Math.random() * WINNING_CHIP_SOURCES.length)
        ],
      startX,
      startY,
      deltaX,
      deltaY,
      arcY: -(18 + Math.random() * 34),
      size,
      delayMs: index * 45 + Math.random() * 50,
      durationMs: 720 + Math.random() * 280,
      startRotate: Math.random() * 120 - 60,
      endRotate: Math.random() * 360 + 120,
      startScale: 0.82 + Math.random() * 0.42,
    };
  });
}

function createBlackjackConfettiPieces(pieceCount: number) {
  return Array.from({ length: pieceCount }, (_, index) => {
    const size = 8 + Math.random() * 12;
    return {
      id: `blackjack-confetti-${Date.now()}-${index}`,
      left: 2 + Math.random() * 96,
      delayMs: Math.random() * 220,
      durationMs: 2100 + Math.random() * 900,
      size,
      driftX: Math.random() * 180 - 90,
      rotateStart: Math.random() * 180 - 90,
      rotateEnd: Math.random() * 900 - 450,
      color:
        BLACKJACK_CONFETTI_COLORS[
          Math.floor(Math.random() * BLACKJACK_CONFETTI_COLORS.length)
        ],
      shape: Math.random() > 0.72 ? "circle" : "rect",
    } satisfies BlackjackConfettiPiece;
  });
}

type AnimatedBlackjackCardProps = {
  card: BlackjackCardView;
  alt: string;
  dealIndex: number;
};

function AnimatedBlackjackCard({
  card,
  alt,
  dealIndex,
}: AnimatedBlackjackCardProps) {
  const [entered, setEntered] = React.useState(false);
  const [revealed, setRevealed] = React.useState(card.masked);

  React.useEffect(() => {
    setEntered(false);
    setRevealed(card.masked);

    let revealTimeout = 0;
    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
      if (!card.masked) {
        revealTimeout = window.setTimeout(
          () => {
            setRevealed(true);
          },
          220 + dealIndex * 70,
        );
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (revealTimeout) {
        window.clearTimeout(revealTimeout);
      }
    };
  }, [card.masked, card.suit, card.value, dealIndex]);

  return (
    <div
      className={`card blackjack-card${entered ? " blackjack-card--entered" : ""}${revealed ? " blackjack-card--revealed" : ""}`}
    >
      <div className="blackjack-card-inner">
        <div className="blackjack-card-face blackjack-card-face--back">
          <Image
            src={withBasePath(CARD_BACK_SRC)}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 768px) 96px, 120px"
          />
        </div>
        <div className="blackjack-card-face blackjack-card-face--front">
          <Image
            src={withBasePath(getCardImageSrc(card))}
            alt={alt}
            fill
            sizes="(max-width: 768px) 96px, 120px"
          />
        </div>
      </div>
    </div>
  );
}

function countRenderedCards(state: BlackjackRenderState | null) {
  if (!state) return 0;

  const dealerCards = state.dealer.cards.length;
  const playerCards =
    state.player?.hands.reduce((total, hand) => total + hand.cards.length, 0) ??
    0;

  return dealerCards + playerCards;
}

function getPlayerHasBlackjack(state: BlackjackRenderState | null) {
  return (
    state?.player?.hands.some((hand) => hand.outcomeLabel === "Blackjack!") ??
    false
  );
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickStatusEmojis(
  summary: string,
  badge: BlackjackResultView["badge"],
  tone: BlackjackResultView["tone"],
) {
  const blackjackPool = ["🃏", "✨", "👑", "🔥", "💫"];
  const winPool = ["💰", "💵", "😎", "🔥", "🏆", "✨"];
  const lossPool = ["😬", "💸", "🫠", "📉", "🥀", "😵‍💫"];
  const neutralPool = ["🎲", "♠️", "🃏", "🤝", "🎰"];

  const pool =
    summary.includes("Blackjack") ||
    (badge === "Won!" && summary.includes("Blackjack"))
      ? blackjackPool
      : tone === "win"
        ? winPool
        : tone === "loss"
          ? lossPool
          : neutralPool;

  const seed = hashString(`${summary}:${badge}:${tone}`);
  const first = pool[seed % pool.length];
  const second = pool[(seed + 3) % pool.length];
  return [first, second];
}

function decorateStatusText(statusText: string) {
  if (statusText === "Insurance?") {
    return "🛡️ Insurance?";
  }

  if (statusText === "Deal again?") {
    return "🔁 Deal again?";
  }

  if (statusText.includes("Deal")) {
    return `🎲 ${statusText}`;
  }

  if (statusText.includes("Hit") || statusText.includes("Stand")) {
    return `🃏 ${statusText}`;
  }

  return statusText;
}

function decorateResultDetailLine(
  line: string,
  tone: BlackjackResultView["tone"],
  badge: BlackjackResultView["badge"],
) {
  const [emoji] = pickStatusEmojis(line, badge, tone);
  return `${emoji} ${line}`;
}

function hasCurrencyValue(text: string) {
  return /\$\d/.test(text);
}

function getDisplayResultSummary(result: BlackjackResultView) {
  if (result.badge === "Push") {
    return "You pushed!";
  }

  return result.summary;
}

function getDealerOutcomeStampLabel(state: BlackjackRenderState | null) {
  const dealerLabel = state?.dealer.outcomeLabel;
  if (dealerLabel) {
    return dealerLabel;
  }

  switch (state?.result?.badge) {
    case "Won!":
      return "Lost!";
    case "Lost!":
      return "Won!";
    case "Push":
      return "Push";
    default:
      return "";
  }
}

function getResultTransitionKey(result: BlackjackResultView | null) {
  if (!result) {
    return "";
  }

  return [result.badge, result.summary, ...result.detailLines].join("|");
}

export default function BlackjackPage() {
  const { setDocumentTitle } = useDocumentTitle();
  const pageRef = React.useRef<HTMLElement | null>(null);
  const tableShellRef = React.useRef<HTMLDivElement | null>(null);
  const playerStackRef = React.useRef<HTMLSpanElement | null>(null);
  const slideRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const [engineState, setEngineState] =
    React.useState<BlackjackRenderState | null>(null);
  const [gameStarted, setGameStarted] = React.useState(false);
  const [startRequested, setStartRequested] = React.useState(false);
  const [controlsArmed, setControlsArmed] = React.useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);
  const [displayedPlayerStack, setDisplayedPlayerStack] = React.useState<
    number | null
  >(null);
  const [stackTickerActive, setStackTickerActive] = React.useState(false);
  const [winningChipFx, setWinningChipFx] = React.useState<WinningChipFx[]>([]);
  const [blackjackConfettiPieces, setBlackjackConfettiPieces] = React.useState<
    BlackjackConfettiPiece[]
  >([]);
  const [modeTransitionMessageVisible, setModeTransitionMessageVisible] =
    React.useState(false);
  const [soundsEnabled, setSoundsEnabled] = React.useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(BLACKJACK_SOUNDS_STORAGE_KEY) !== "false";
  });
  const previousEngineStateRef = React.useRef<BlackjackRenderState | null>(
    null,
  );
  const previousGameModeRef = React.useRef<BlackjackGameMode | null>(null);
  const pendingModeChangeAutoDealRef = React.useRef(false);
  const modeChangeObservedRef = React.useRef(false);
  const stackTickerFrameRef = React.useRef<number | null>(null);
  const winningChipClearTimeoutRef = React.useRef<number | null>(null);
  const winningChipImpactTimeoutRef = React.useRef<number | null>(null);
  const blackjackConfettiClearTimeoutRef = React.useRef<number | null>(null);
  const handRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const previousActiveHandIndexRef = React.useRef<number | null>(null);
  const blackjackSfx = useAudio("/audio/jingles_STEEL16.ogg");
  const bustSfx = useAudio("/audio/lowDown.ogg");
  const dealSfx = useAudio("/audio/cards-pack-take-out-2.ogg");
  const hitSfx = useAudio("/audio/card-slide-8.ogg");
  const loseSfx = useAudio("/audio/error_008.ogg");
  const winSfx = useAudio("/audio/jingles_HIT03.mp3");
  const chipWinLaunchSfx = useAudio(CHIP_WIN_LAUNCH_SOUNDS[0]);
  const chipWinImpactSfx = useAudio(CHIP_WIN_IMPACT_SOUNDS[0]);
  const blackjackConfettiSfx = useAudio(BLACKJACK_CONFETTI_SOUND);
  const musicStartedRef = React.useRef(false);
  const {
    enabled: bgmEnabled,
    start: startBGM,
    toggle: toggleBGM,
  } = useBGM(BLACKJACK_BGM_PROGRESSION, {
    bpm: 62,
    beatsPerChord: 4,
    volume: 0.028,
    swing: 0.12,
  });
  const {
    enabled: ambienceEnabled,
    start: startAmbience,
    toggle: toggleAmbience,
  } = useAmbience(
    [
      "/audio/bong_001.ogg",
      "/audio/card-fan-1.ogg",
      "/audio/card-fan-2.ogg",
      "/audio/card-place-1.ogg",
      "/audio/card-place-2.ogg",
      "/audio/chips-handle-3.ogg",
      "/audio/chips-handle-1.ogg",
      "/audio/chips-handle-2.ogg",
      "/audio/chips-handle-5.ogg",
      "/audio/chips-collide-1.ogg",
      "/audio/chips-collide-2.ogg",
      "/audio/chips-collide-4.ogg",
      "/audio/chips-stack-1.ogg",
      "/audio/chips-stack-3.ogg",
      "/audio/chip-lay-2.ogg",
      "/audio/chip-lay-1.ogg",
      "/audio/chip-lay-3.ogg",
      "/audio/card-place-3.ogg",
      "/audio/card-place-4.ogg",
      "/audio/card-shove-2.ogg",
      "/audio/card-shove-4.ogg",
      "/audio/card-slide-2.ogg",
      "/audio/card-slide-5.ogg",
      "/audio/card-shuffle.ogg",
      "/audio/dice-grab-1.ogg",
      "/audio/dice-shake-2.ogg",
      "/audio/dice-throw-1.ogg",
      "/audio/dice-throw-2.ogg",
      "/audio/die-throw-3.ogg",
    ] as const,
    {
      minDelayMs: 1400,
      maxDelayMs: 4200,
      minVolume: 0.03,
      maxVolume: 0.1,
    },
  );
  const dealerOutcomeStampLabel = getDealerOutcomeStampLabel(engineState);

  const playSfx = React.useCallback(
    (...args: Parameters<typeof rewindAndPlayAudio>) => {
      if (!soundsEnabled) {
        return;
      }

      rewindAndPlayAudio(...args);
    },
    [soundsEnabled],
  );

  const stopStackTicker = React.useCallback(() => {
    if (stackTickerFrameRef.current !== null) {
      window.cancelAnimationFrame(stackTickerFrameRef.current);
      stackTickerFrameRef.current = null;
    }
    setStackTickerActive(false);
  }, []);

  const syncDisplayedPlayerStack = React.useCallback(
    (value: number) => {
      stopStackTicker();
      setDisplayedPlayerStack(value);
    },
    [stopStackTicker],
  );

  const animateDisplayedPlayerStack = React.useCallback(
    (from: number, to: number) => {
      stopStackTicker();
      if (from === to) {
        setDisplayedPlayerStack(to);
        return;
      }

      const durationMs = Math.min(
        1800,
        Math.max(700, Math.abs(to - from) * 22),
      );
      const startTime = performance.now();
      setStackTickerActive(true);
      setDisplayedPlayerStack(from);

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const nextValue = Math.round(from + (to - from) * easedProgress);
        setDisplayedPlayerStack(nextValue);

        if (progress < 1) {
          stackTickerFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }

        stackTickerFrameRef.current = null;
        setDisplayedPlayerStack(to);
        setStackTickerActive(false);
      };

      stackTickerFrameRef.current = window.requestAnimationFrame(tick);
    },
    [stopStackTicker],
  );

  const triggerWinningChipFx = React.useCallback((winAmount: number) => {
    const tableRect = tableShellRef.current?.getBoundingClientRect();
    const stackRect = playerStackRef.current?.getBoundingClientRect();
    if (!tableRect || !stackRect) {
      return;
    }

    const chipCount = Math.min(14, Math.max(6, Math.round(winAmount / 15)));
    const targetX =
      stackRect.left -
      tableRect.left +
      stackRect.width * 0.5 -
      22;
    const targetY =
      stackRect.top -
      tableRect.top +
      stackRect.height * 0.5 -
      22;

    const nextFx = createWinningChipFx({
      chipCount,
      tableWidth: tableRect.width,
      tableHeight: tableRect.height,
      targetX,
      targetY,
    });

    setWinningChipFx(nextFx);

    const launchSound =
      CHIP_WIN_LAUNCH_SOUNDS[
        Math.floor(Math.random() * CHIP_WIN_LAUNCH_SOUNDS.length)
      ];
    playSfx(chipWinLaunchSfx, launchSound, { volume: 0.5 });

    if (winningChipClearTimeoutRef.current !== null) {
      window.clearTimeout(winningChipClearTimeoutRef.current);
    }
    if (winningChipImpactTimeoutRef.current !== null) {
      window.clearTimeout(winningChipImpactTimeoutRef.current);
    }

    const maxLifetimeMs = nextFx.reduce(
      (maxLifetime, chip) =>
        Math.max(maxLifetime, chip.delayMs + chip.durationMs),
      0,
    );
    const impactSound =
      CHIP_WIN_IMPACT_SOUNDS[
        Math.floor(Math.random() * CHIP_WIN_IMPACT_SOUNDS.length)
      ];
    const impactDelayMs = Math.max(140, maxLifetimeMs - 180);
    winningChipImpactTimeoutRef.current = window.setTimeout(() => {
      playSfx(chipWinImpactSfx, impactSound, { volume: 0.62 });
      winningChipImpactTimeoutRef.current = null;
    }, impactDelayMs);
    winningChipClearTimeoutRef.current = window.setTimeout(() => {
      setWinningChipFx([]);
      winningChipClearTimeoutRef.current = null;
    }, maxLifetimeMs + 140);
  }, [chipWinImpactSfx, chipWinLaunchSfx, playSfx]);

  const triggerBlackjackCelebration = React.useCallback(() => {
    const nextPieces = createBlackjackConfettiPieces(42);
    setBlackjackConfettiPieces(nextPieces);
    playSfx(blackjackConfettiSfx, { volume: 0.68 });

    if (blackjackConfettiClearTimeoutRef.current !== null) {
      window.clearTimeout(blackjackConfettiClearTimeoutRef.current);
    }

    const maxLifetimeMs = nextPieces.reduce(
      (maxLifetime, piece) =>
        Math.max(maxLifetime, piece.delayMs + piece.durationMs),
      0,
    );

    blackjackConfettiClearTimeoutRef.current = window.setTimeout(() => {
      setBlackjackConfettiPieces([]);
      blackjackConfettiClearTimeoutRef.current = null;
    }, maxLifetimeMs + 180);
  }, [blackjackConfettiSfx, playSfx]);

  React.useEffect(() => {
    setDocumentTitle("Blackjack");
  }, [setDocumentTitle]);

  React.useEffect(() => {
    return () => {
      stopStackTicker();
      if (winningChipClearTimeoutRef.current !== null) {
        window.clearTimeout(winningChipClearTimeoutRef.current);
      }
      if (winningChipImpactTimeoutRef.current !== null) {
        window.clearTimeout(winningChipImpactTimeoutRef.current);
      }
      if (blackjackConfettiClearTimeoutRef.current !== null) {
        window.clearTimeout(blackjackConfettiClearTimeoutRef.current);
      }
    };
  }, [stopStackTicker]);

  React.useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const observedSlides = BLACKJACK_CAROUSEL_SLIDES.map(
      ({ id }) => slideRefs.current[id],
    ).filter((slide): slide is HTMLElement => Boolean(slide));

    if (observedSlides.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const nextIndex = BLACKJACK_CAROUSEL_SLIDES.findIndex(
          (slide) => slide.id === visibleEntry.target.id,
        );
        if (nextIndex >= 0) {
          setActiveSlideIndex(nextIndex);
        }
      },
      {
        root,
        threshold: [0.35, 0.6, 0.85],
      },
    );

    observedSlides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const hands = engineState?.player?.hands ?? [];
    if (hands.length <= 1) {
      previousActiveHandIndexRef.current = null;
      return;
    }

    const activeHand = hands.find((hand) => hand.active);
    if (!activeHand) {
      return;
    }

    if (previousActiveHandIndexRef.current === activeHand.index) {
      return;
    }

    previousActiveHandIndexRef.current = activeHand.index;

    const target = handRefs.current[activeHand.index];
    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });
  }, [engineState]);

  React.useEffect(() => {
    if (!engineState) {
      previousEngineStateRef.current = engineState;
      return;
    }

    const previousState = previousEngineStateRef.current;
    const currentPlayerStack = engineState.player?.stack ?? 0;
    if (displayedPlayerStack === null) {
      setDisplayedPlayerStack(currentPlayerStack);
    }

    let handledWinningStackAnimation = false;

    if (previousState) {
      const previousResultKey = getResultTransitionKey(previousState.result);
      const currentResultKey = getResultTransitionKey(engineState.result);
      const currentBusts =
        engineState.player?.hands.map((hand) => hand.busted) ?? [];
      const previousBusts =
        previousState.player?.hands.map((hand) => hand.busted) ?? [];

      for (let index = 0; index < currentBusts.length; index += 1) {
        if (currentBusts[index] && !previousBusts[index]) {
          playSfx(bustSfx);
          break;
        }
      }

      const currentTotalCards = countRenderedCards(engineState);
      const previousTotalCards = countRenderedCards(previousState);
      if (
        !engineState.askingToDeal &&
        currentTotalCards > previousTotalCards &&
        !previousState.askingToDeal &&
        previousTotalCards > 0
      ) {
        playSfx(hitSfx);
      }

      if (currentResultKey && currentResultKey !== previousResultKey) {
        const previousWinnings = previousState.player?.winnings ?? 0;
        const currentWinnings = engineState.player?.winnings ?? 0;
        const netDiff = currentWinnings - previousWinnings;
        const previousPlayerStack =
          previousState.player?.stack ?? currentPlayerStack;
        const stackDelta = currentPlayerStack - previousPlayerStack;
        const isBlackjackWin =
          engineState.result?.badge === "Won!" &&
          (getPlayerHasBlackjack(engineState) ||
            engineState.result.summary.includes("Blackjack"));

        if (isBlackjackWin) {
          playSfx(blackjackSfx);
        } else if (netDiff > 0) {
          playSfx(winSfx);
        } else if (netDiff < 0) {
          playSfx(loseSfx);
        }

        if (engineState.result?.badge === "Won!") {
          const visualWinAmount = Math.max(
            stackDelta,
            netDiff,
            currentWinnings,
            15,
          );

          if (stackDelta > 0) {
            handledWinningStackAnimation = true;
            animateDisplayedPlayerStack(previousPlayerStack, currentPlayerStack);
          }

          triggerWinningChipFx(visualWinAmount);

          if (isBlackjackWin) {
            triggerBlackjackCelebration();
          }
        } else if (stackDelta > 0) {
          handledWinningStackAnimation = true;
          syncDisplayedPlayerStack(currentPlayerStack);
        }
      }
    }

    if (
      displayedPlayerStack !== null &&
      displayedPlayerStack !== currentPlayerStack &&
      !handledWinningStackAnimation
    ) {
      syncDisplayedPlayerStack(currentPlayerStack);
    }

    previousEngineStateRef.current = engineState;
  }, [
    animateDisplayedPlayerStack,
    blackjackSfx,
    bustSfx,
    displayedPlayerStack,
    engineState,
    hitSfx,
    loseSfx,
    playSfx,
    syncDisplayedPlayerStack,
    triggerBlackjackCelebration,
    triggerWinningChipFx,
    winSfx,
  ]);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (isBlackjackStateMessage(event.data)) {
        setEngineState(event.data.state);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  React.useEffect(() => {
    if (!startRequested || !engineState?.hasRendered || gameStarted) {
      return;
    }

    setGameStarted(true);
    setControlsArmed(true);
  }, [engineState?.hasRendered, gameStarted, startRequested]);

  React.useEffect(() => {
    const currentGameMode = engineState?.gameMode;
    if (!currentGameMode) {
      return;
    }

    if (previousGameModeRef.current === null) {
      previousGameModeRef.current = currentGameMode;
      return;
    }

    if (previousGameModeRef.current !== currentGameMode) {
      previousGameModeRef.current = currentGameMode;
      if (pendingModeChangeAutoDealRef.current) {
        modeChangeObservedRef.current = true;
      }
    }

    if (
      pendingModeChangeAutoDealRef.current &&
      modeChangeObservedRef.current &&
      engineState.askingToDeal &&
      engineState.controls.deal
    ) {
      pendingModeChangeAutoDealRef.current = false;
      modeChangeObservedRef.current = false;
      setModeTransitionMessageVisible(false);
      playSfx(dealSfx);
      postBlackjackAction("deal");
    }
  }, [dealSfx, engineState, playSfx]);

  const startMusic = React.useCallback(() => {
    if (musicStartedRef.current) return;
    musicStartedRef.current = true;
    void startBGM();
    startAmbience();
  }, [startAmbience, startBGM]);

  const handleAction = React.useCallback(
    (
      action:
        | "deal"
        | "hit"
        | "stand"
        | "double"
        | "split"
        | "insure"
        | "decline",
    ) => {
      startMusic();
      postBlackjackAction(action);
    },
    [startMusic],
  );

  const handleStartGame = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      startMusic();
      setStartRequested(true);
      setControlsArmed(false);
      playSfx(dealSfx);
      postBlackjackStart();
    },
    [dealSfx, playSfx, startMusic],
  );

  const handleToggleGameMode = React.useCallback(() => {
    startMusic();
    pendingModeChangeAutoDealRef.current = true;
    modeChangeObservedRef.current = false;
    setModeTransitionMessageVisible(true);
    postBlackjackToggleGameMode();
  }, [startMusic]);

  const handleToggleSounds = React.useCallback(() => {
    setSoundsEnabled((previous) => {
      const next = !previous;
      window.localStorage.setItem(
        BLACKJACK_SOUNDS_STORAGE_KEY,
        String(next),
      );
      return next;
    });
  }, []);

  const setSlideRef = React.useCallback(
    (id: string, node: HTMLElement | null) => {
      slideRefs.current[id] = node;
    },
    [],
  );

  const scrollToSlide = React.useCallback((targetIndex: number) => {
    const slideCount = BLACKJACK_CAROUSEL_SLIDES.length;
    const normalizedIndex =
      ((targetIndex % slideCount) + slideCount) % slideCount;
    const targetId = BLACKJACK_CAROUSEL_SLIDES[normalizedIndex]?.id;
    if (!targetId) return;
    slideRefs.current[targetId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }, []);

  const handleCycleSlides = React.useCallback(
    (direction: -1 | 1) => {
      scrollToSlide(activeSlideIndex + direction);
    },
    [activeSlideIndex, scrollToSlide],
  );

  const resultEmojis = engineState?.result
    ? pickStatusEmojis(
        getDisplayResultSummary(engineState.result),
        engineState.result.badge,
        engineState.result.tone,
      )
    : null;
  const activeVisualHandIndex =
    engineState?.player?.hands.find((hand) => hand.active)?.index ?? null;
  const blackjackProject = projects?.find(
    (proj) => proj?.href === "/blackjack",
  );
  const blackjackDiagrams =
    (blackjackProject?.diagrams as BlackjackDiagramConfig[] | undefined) ?? [];

  return (
    <main
      ref={pageRef}
      className="blackjack-page"
      data-engine-state-ready={engineState ? "true" : "false"}
    >
      {blackjackConfettiPieces.length ? (
        <div className="blackjack-confetti-layer" aria-hidden="true">
          {blackjackConfettiPieces.map((piece) => (
            <span
              key={piece.id}
              className={`blackjack-confetti-piece blackjack-confetti-piece--${piece.shape}`}
              style={
                {
                  left: `${piece.left}%`,
                  width: `${piece.size}px`,
                  height:
                    piece.shape === "circle"
                      ? `${piece.size}px`
                      : `${piece.size * 1.6}px`,
                  backgroundColor: piece.color,
                  animationDelay: `${piece.delayMs}ms`,
                  animationDuration: `${piece.durationMs}ms`,
                  "--confetti-drift-x": `${piece.driftX}px`,
                  "--confetti-rotate-start": `${piece.rotateStart}deg`,
                  "--confetti-rotate-end": `${piece.rotateEnd}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ) : null}
      <section
        id="game-card"
        ref={(node) => setSlideRef("game-card", node)}
        className="blackjack-panel blackjack-game-panel blackjack-carousel-slide"
      >
        {!gameStarted && (
          <div className="blackjack-start-screen">
            <div className="blackjack-start-backdrop" aria-hidden="true">
              <Image
                className="blackjack-start-card blackjack-start-card--back"
                src={withBasePath(
                  "/assets/cards/PNG/Cards (medium)/card_back.png",
                )}
                alt=""
                width={240}
                height={348}
              />
              <Image
                className="blackjack-start-card blackjack-start-card--jack"
                src={withBasePath(
                  "/assets/cards/PNG/Cards (medium)/card_spades_J.png",
                )}
                alt=""
                width={240}
                height={348}
              />
              <Image
                className="blackjack-start-card blackjack-start-card--ace"
                src={withBasePath(
                  "/assets/cards/PNG/Cards (medium)/card_spades_A.png",
                )}
                alt=""
                width={240}
                height={348}
              />
            </div>
            <button
              type="button"
              className="blackjack-start-button"
              onClick={handleStartGame}
            >
              <span className="blackjack-start-button-title">
                Go! Blackjack!
              </span>
              <span className="blackjack-start-button-caption">
                Click to play!
              </span>
            </button>
          </div>
        )}
        <div
          className={
            gameStarted
              ? controlsArmed
                ? "blackjack-game-shell"
                : "blackjack-game-shell blackjack-game-shell--cooldown"
              : "blackjack-game-shell blackjack-game-shell--hidden"
          }
        >
          <div className="blackjack-game-banner">
            <div className="blackjack-game-banner-cards" aria-hidden="true">
              <Image
                className="blackjack-game-banner-card blackjack-game-banner-card--back"
                src={withBasePath(
                  "/assets/cards/PNG/Cards (medium)/card_back.png",
                )}
                alt=""
                width={180}
                height={261}
              />
              <Image
                className="blackjack-game-banner-card blackjack-game-banner-card--jack"
                src={withBasePath(
                  "/assets/cards/PNG/Cards (medium)/card_spades_J.png",
                )}
                alt=""
                width={180}
                height={261}
              />
              <Image
                className="blackjack-game-banner-card blackjack-game-banner-card--ace"
                src={withBasePath(
                  "/assets/cards/PNG/Cards (medium)/card_spades_A.png",
                )}
                alt=""
                width={180}
                height={261}
              />
            </div>
            <div className="blackjack-game-banner-stamp">Go! Blackjack!</div>
            <div className="blackjack-game-banner-subtitle">
              Wasm Web Client
            </div>
            {engineState ? (
              <button
                type="button"
                className={getGameModeChipClass(engineState.gameMode)}
                disabled={!engineState.canToggleGameMode}
                onClick={handleToggleGameMode}
                title={
                  engineState.canToggleGameMode
                    ? "Cycle blackjack game mode"
                    : "Finish the current round before changing mode"
                }
              >
                <Image
                  className="blackjack-chip-adornment"
                  src={withBasePath(getGameModeChipSrc(engineState.gameMode))}
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                />
                <span className="blackjack-game-mode-chip-label">Mode</span>
                <span className="blackjack-game-mode-chip-value">
                  {engineState.gameModeLabel}
                </span>
              </button>
            ) : null}
            {modeTransitionMessageVisible ? (
              <div className="blackjack-mode-transition-indicator" role="status">
                <span className="blackjack-mode-transition-spinner" aria-hidden="true" />
                <span>Shuffling into new mode...</span>
              </div>
            ) : null}
          </div>
          {!engineState?.progressives?.length ? (
            <div id="progressives" className="blackjack-progressives">
              {engineState?.progressives.map((progressive, index) => (
                <ChipDecoratedValue
                  key={index}
                  className="blackjack-money-chip"
                  chipSrc={CHIP_RED_WHITE_SRC}
                >
                  {progressive.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </ChipDecoratedValue>
              ))}
            </div>
          ) : null}
          <div id="game" ref={tableShellRef} className="blackjack-table-shell">
            {winningChipFx.length ? (
              <div className="blackjack-winning-chip-layer" aria-hidden="true">
                {winningChipFx.map((chip) => (
                  <Image
                    key={chip.id}
                    className="blackjack-winning-chip"
                    src={withBasePath(chip.chipSrc)}
                    alt=""
                    width={Math.round(chip.size)}
                    height={Math.round(chip.size)}
                    style={
                      {
                        left: `${chip.startX}px`,
                        top: `${chip.startY}px`,
                        width: `${chip.size}px`,
                        height: `${chip.size}px`,
                        animationDelay: `${chip.delayMs}ms`,
                        animationDuration: `${chip.durationMs}ms`,
                        "--chip-dx": `${chip.deltaX}px`,
                        "--chip-dy": `${chip.deltaY}px`,
                        "--chip-arc-y": `${chip.arcY}px`,
                        "--chip-rotate-start": `${chip.startRotate}deg`,
                        "--chip-rotate-end": `${chip.endRotate}deg`,
                        "--chip-scale-start": `${chip.startScale}`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            ) : null}
            <div id="dealer-info" className="blackjack-info-row">
              Dealer: House: <span id="house">{engineState?.house ?? 0}</span>{" "}
              Count: <span id="count">{engineState?.count ?? 0}</span>
            </div>
            <div id="dealer" className="blackjack-seat">
              <div className="blackjack-hand-cards-wrap">
                <div className="blackjack-dealer-cards-stack">
                  <div id="dealer-cards" className="cards">
                    {(engineState?.dealer.cards ?? []).map((card, index) => (
                      <AnimatedBlackjackCard
                        key={`${card.suit}-${card.value}-${index}`}
                        card={card}
                        dealIndex={index}
                        alt={
                          card.masked
                            ? "Hidden card"
                            : `${card.value} of ${card.suit}`
                        }
                      />
                    ))}
                  </div>
                  {dealerOutcomeStampLabel ? (
                    <div
                      className={getOutcomeStampClass(dealerOutcomeStampLabel)}
                      style={{
                        transform: `translate(-50%, -50%) rotate(${getOutcomeStampAngle(
                          {
                            index: 0,
                            cardsLength: engineState?.dealer.cards.length ?? 0,
                            totalLabel: engineState?.dealer.totalLabel ?? "0",
                            outcomeLabel: dealerOutcomeStampLabel,
                          },
                        )}deg)`,
                      }}
                    >
                      {dealerOutcomeStampLabel}
                    </div>
                  ) : null}
                </div>
              </div>
              <div id="dealer-total">
                {engineState?.dealer.totalLabel ?? "Total: 0"}
              </div>
            </div>
            {engineState?.result ? (
              <div id="result" className="blackjack-status-panel">
                <div
                  className={`blackjack-result-summary ${getResultToneClass(engineState.result.tone)}`}
                >
                  {resultEmojis ? `${resultEmojis[0]} ` : null}
                  {getDisplayResultSummary(engineState.result)}
                  {resultEmojis ? ` ${resultEmojis[1]}` : null}
                </div>
                {engineState.result.badge ? (
                  <div className="blackjack-result-badge-row">
                    <span
                      className={getResultBadgeClass(engineState.result.badge)}
                    >
                      {engineState.result.badge}
                    </span>
                  </div>
                ) : null}
                {engineState.result.detailLines.map((line, index) => (
                  <div
                    key={index}
                    className={`${engineState.result ? getResultToneClass(engineState.result.tone) : ""}${hasCurrencyValue(line) ? " blackjack-money-chip" : ""}`}
                  >
                    {hasCurrencyValue(line) ? (
                      <ChipDecoratedValue
                        chipSrc={CHIP_WHITE_BLUE_SRC}
                        className="blackjack-money-chip-inline"
                      >
                        {engineState &&
                          engineState.result &&
                          decorateResultDetailLine(
                            line,
                            engineState.result.tone,
                            engineState.result.badge,
                          )}
                      </ChipDecoratedValue>
                    ) : (
                      engineState &&
                      engineState.result &&
                      decorateResultDetailLine(
                        line,
                        engineState.result.tone,
                        engineState.result.badge,
                      )
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="blackjack-player">
              <div id="player-info" className="blackjack-info-row">
                Player:{" "}
                <ChipDecoratedValue
                  ref={playerStackRef}
                  id="player-stack"
                  className="blackjack-money-chip"
                  chipSrc={CHIP_BLUE_WHITE_SRC}
                  valueClassName={`blackjack-stack-ticker${stackTickerActive ? " blackjack-stack-ticker--active" : ""}`}
                >
                  {formatPlayerStackValue(
                    displayedPlayerStack ?? engineState?.player?.stack ?? 0,
                  )}
                </ChipDecoratedValue>
                <ChipDecoratedValue
                  id="player-winnings"
                  className={`blackjack-money-chip ${
                    getWinningsClass(
                      engineState?.player?.winningsTone ?? "neutral",
                    ) ?? ""
                  }`.trim()}
                  chipSrc={
                    engineState?.player?.winningsTone === "positive"
                      ? CHIP_GREEN_WHITE_SRC
                      : engineState?.player?.winningsTone === "negative"
                        ? CHIP_RED_WHITE_SRC
                        : CHIP_WHITE_BLUE_SRC
                  }
                >
                  {engineState?.player?.winningsDisplay
                    ? ` ${engineState.player.winningsDisplay}`
                    : ""}
                </ChipDecoratedValue>
              </div>
              <div className="blackjack-hands-scroll">
                <div
                  id="player-hands"
                  className={`blackjack-hands${(engineState?.player?.hands?.length ?? 0) > 1 ? " blackjack-hands--split" : ""}`}
                >
                  {(engineState?.player?.hands ?? []).map((hand) => (
                    <div
                      key={hand.index}
                      ref={(element) => {
                        handRefs.current[hand.index] = element;
                      }}
                      className={`blackjack-seat blackjack-hand${activeVisualHandIndex === hand.index ? " blackjack-hand--active" : ""}`}
                    >
                      <div className="blackjack-hand-header">
                        <span className="blackjack-hand-label">
                          Hand {hand.index + 1}
                        </span>
                        <ChipDecoratedValue
                          className="blackjack-hand-meta blackjack-money-chip"
                          chipSrc={CHIP_BLACK_WHITE_SRC}
                        >
                          Wager: ${hand.wager}
                        </ChipDecoratedValue>
                        {hand.note ? (
                          hasCurrencyValue(hand.note) ? (
                            <ChipDecoratedValue
                              className="blackjack-hand-note blackjack-money-chip"
                              chipSrc={CHIP_GREEN_WHITE_SRC}
                            >
                              {hand.note}
                            </ChipDecoratedValue>
                          ) : (
                            <span className="blackjack-hand-note">
                              {hand.note}
                            </span>
                          )
                        ) : null}
                      </div>
                      <div className="blackjack-hand-cards-wrap">
                        <div className="blackjack-hand-cards-stack">
                          <div className="cards">
                            {hand.cards.map((card, index) => (
                              <AnimatedBlackjackCard
                                key={`${hand.index}-${card.suit}-${card.value}-${index}`}
                                card={card}
                                dealIndex={index}
                                alt={
                                  card.masked
                                    ? "Hidden card"
                                    : `${card.value} of ${card.suit}`
                                }
                              />
                            ))}
                          </div>
                          {hand.outcomeLabel ? (
                            <div
                              className={getOutcomeStampClass(
                                hand.outcomeLabel,
                              )}
                              style={{
                                transform: `translate(-50%, -50%) rotate(${getOutcomeStampAngle(
                                  {
                                    index: hand.index,
                                    cardsLength: hand.cards.length,
                                    totalLabel: hand.totalLabel,
                                    outcomeLabel: hand.outcomeLabel,
                                  },
                                )}deg)`,
                              }}
                            >
                              {hand.outcomeLabel}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="blackjack-hand-total">
                        {hand.totalLabel}
                        {hand.busted ? (
                          <span className="blackjack-busted-badge">
                            Busted!
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {engineState?.hintText ? (
              <div id="hint" className="blackjack-hint-panel">
                {engineState.hintText}
              </div>
            ) : null}
          </div>
          {false ? (
            <div className="blackjack-mode-panel blackjack-mode-panel--table">
              <div className="blackjack-mode-panel-header">
                <span className="blackjack-mode-panel-kicker">Game Type</span>
                <span className="blackjack-mode-panel-title">
                  {engineState?.gameModeLabel}
                </span>
              </div>
              <p className="blackjack-mode-panel-description">
                {engineState?.gameModeDescription}
              </p>
              <ul className="blackjack-mode-panel-rules">
                {engineState?.gameModeRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="blackjack-status-panel">
            <div className="blackjack-status-row">
              <div id="status">
                {decorateStatusText(engineState?.statusText ?? "")}
              </div>
              {engineState?.askingToDeal ? (
                <button
                  id="deal"
                  className="blackjack-button blackjack-button-primary"
                  style={{
                    display: getControlDisplay(engineState?.controls.deal),
                  }}
                  onClick={() => handleAction("deal")}
                >
                  🃏 Deal
                </button>
              ) : null}
            </div>
            <div id="controls" className="blackjack-controls">
              {!engineState?.askingToDeal ? (
                <button
                  id="deal"
                  className="blackjack-button blackjack-button-primary"
                  style={{
                    display: getControlDisplay(engineState?.controls.deal),
                  }}
                  onClick={() => handleAction("deal")}
                >
                  🃏 Deal
                </button>
              ) : null}
              <button
                id="double"
                className="blackjack-button"
                style={{
                  display: getControlDisplay(engineState?.controls.double),
                }}
                onClick={() => handleAction("double")}
              >
                💥 Double
              </button>
              <button
                id="split"
                className="blackjack-button"
                style={{
                  display: getControlDisplay(engineState?.controls.split),
                }}
                onClick={() => handleAction("split")}
              >
                ✂️ Split
              </button>
              <button
                id="hit"
                className="blackjack-button"
                style={{
                  display: getControlDisplay(engineState?.controls.hit),
                }}
                onClick={() => handleAction("hit")}
              >
                ➕ Hit
              </button>
              <button
                id="stand"
                className="blackjack-button"
                style={{
                  display: getControlDisplay(engineState?.controls.stand),
                }}
                onClick={() => handleAction("stand")}
              >
                ✋ Stand
              </button>
              <button
                id="insure"
                className="blackjack-button"
                style={{
                  display: getControlDisplay(engineState?.controls.insure),
                }}
                onClick={() => handleAction("insure")}
              >
                🛡️ Insure
              </button>
              <button
                id="decline"
                className="blackjack-button blackjack-button-subtle"
                style={{
                  display: getControlDisplay(engineState?.controls.decline),
                }}
                onClick={() => handleAction("decline")}
              >
                Decline
              </button>
            </div>
            <div className="blackjack-audio-toggles">
              <span className="blackjack-audio-label">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="blackjack-audio-label-icon"
                >
                  <path
                    d="M3 10v4h4l5 4V6L7 10H3zm12.5 2a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 15.5 12zm0-9.5v2.06a7.5 7.5 0 0 1 0 14.88v2.06a9.5 9.5 0 0 0 0-19z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <label className="blackjack-audio-toggle">
                <input
                  type="checkbox"
                  checked={bgmEnabled}
                  onChange={toggleBGM}
                />
                <span>BGM</span>
              </label>
              <label className="blackjack-audio-toggle">
                <input
                  type="checkbox"
                  checked={ambienceEnabled}
                  onChange={toggleAmbience}
                />
                <span>Ambient</span>
              </label>
              <label className="blackjack-audio-toggle">
                <input
                  type="checkbox"
                  checked={soundsEnabled}
                  onChange={handleToggleSounds}
                />
                <span>Sounds</span>
              </label>
            </div>
          </div>
        </div>
      </section>
      <section
        id="why-this-project"
        ref={(node) => setSlideRef("why-this-project", node)}
        className="blackjack-panel blackjack-demo-panel blackjack-carousel-slide"
      >
        <h2 className="blackjack-panel-title">Why This Project Interests Me</h2>
        <p className="blackjack-panel-subtitle">One Go, Multiple Clients</p>
        <p>{blackjackProject?.interestsMeWhy}</p>
      </section>
      <section
        id="terminal-demo"
        ref={(node) => setSlideRef("terminal-demo", node)}
        className="blackjack-panel blackjack-demo-panel blackjack-carousel-slide"
      >
        <h2 className="blackjack-panel-title">Go! Blackjack!</h2>
        <p className="blackjack-panel-subtitle">
          Via Go in the terminal in VS Code Debugger
        </p>
        <video
          src={withBasePath("/demovideos/blackjack_terminal.mov")}
          controls
          playsInline
          preload="metadata"
        />
      </section>
      {blackjackDiagrams.length ? (
        <section
          id="architecture-diagrams"
          ref={(node) => setSlideRef("architecture-diagrams", node)}
          className="blackjack-panel blackjack-demo-panel blackjack-diagrams-panel blackjack-carousel-slide"
        >
          <h2 className="blackjack-panel-title">Architecture Diagrams</h2>
          <p className="blackjack-panel-subtitle">
            Go engine, WASM message bridge, render state, and UI flow
          </p>
          <div className="blackjack-diagrams-grid">
            {blackjackDiagrams.map((diagram) => (
              <article
                key={diagram.title ?? diagram.diagram}
                className="blackjack-diagram-card"
              >
                <h3 className="blackjack-diagram-title">{diagram.title}</h3>
                <div className="blackjack-diagram-host">
                  <Diagram
                    title={diagram.title}
                    type={diagram.type}
                    diagram={diagram.diagram}
                    height={diagram.height ?? 420}
                    width="100%"
                    showToolbar
                    showDots={false}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <nav
        className="blackjack-carousel-nav"
        aria-label="Blackjack page sections"
      >
        <button
          type="button"
          className="blackjack-carousel-arrow"
          aria-label="Previous section"
          onClick={() => handleCycleSlides(-1)}
        >
          ←
        </button>
        <div
          className="blackjack-carousel-dots"
          role="tablist"
          aria-label="Slides"
        >
          {BLACKJACK_CAROUSEL_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={activeSlideIndex === index}
              aria-label={`Go to ${slide.label} section`}
              className={`blackjack-carousel-dot${activeSlideIndex === index ? " blackjack-carousel-dot--active" : ""}`}
              onClick={() => scrollToSlide(index)}
            />
          ))}
        </div>
        <button
          type="button"
          className="blackjack-carousel-arrow"
          aria-label="Next section"
          onClick={() => handleCycleSlides(1)}
        >
          →
        </button>
      </nav>
      <script src="wasm_exec.js" defer></script>
      <script id="wasm" src="main.wasm" type="application/wasm" defer></script>
      <script src="main.js" defer></script>
    </main>
  );
}
