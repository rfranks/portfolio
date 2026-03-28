"use client";

import * as React from "react";
import { projects } from "@/consts/resumeData";
import { useAudio } from "@/hooks/audio/useAudio";
import { useAmbience } from "@/hooks/audio/useAmbience";
import { useBGM } from "@/hooks/audio/useBGM";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  isBlackjackStateMessage,
  postBlackjackAction,
  postBlackjackStart,
  postBlackjackToggleGameMode,
  type BlackjackCardView,
  type BlackjackGameMode,
  type BlackjackPlayerHandView,
  type BlackjackRenderState,
  type BlackjackResultView,
} from "@/types/blackjack/messages";
import { rewindAndPlayAudio } from "@/utils/lightgun-web/audio";
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

function getHandStampClass(label: BlackjackPlayerHandView["outcomeLabel"]) {
  switch (label) {
    case "Won!":
      return "blackjack-hand-stamp blackjack-hand-stamp--winner";
    case "Blackjack!":
      return "blackjack-hand-stamp blackjack-hand-stamp--blackjack";
    case "Loss!":
    case "Busted!":
      return "blackjack-hand-stamp blackjack-hand-stamp--loser";
    case "Push!":
      return "blackjack-hand-stamp blackjack-hand-stamp--push";
    default:
      return "blackjack-hand-stamp";
  }
}

function getHandStampAngle(hand: BlackjackPlayerHandView) {
  const seed =
    (hand.index + 1) * 7 +
    hand.cards.length * 5 +
    hand.totalLabel.length * 3 +
    hand.outcomeLabel.length * 3;
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
};

function ChipDecoratedValue({
  chipSrc,
  children,
  className,
  id,
}: ChipDecoratedValueProps) {
  return (
    <span id={id} className={className}>
      <Image
        className="blackjack-chip-adornment"
        src={withBasePath(chipSrc)}
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
      />
      <span>{children}</span>
    </span>
  );
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

export default function BlackjackPage() {
  const { setDocumentTitle } = useDocumentTitle();
  const [engineState, setEngineState] =
    React.useState<BlackjackRenderState | null>(null);
  const [gameStarted, setGameStarted] = React.useState(false);
  const [startRequested, setStartRequested] = React.useState(false);
  const [controlsArmed, setControlsArmed] = React.useState(false);
  const previousEngineStateRef = React.useRef<BlackjackRenderState | null>(
    null,
  );
  const handRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const previousActiveHandIndexRef = React.useRef<number | null>(null);
  const blackjackSfx = useAudio("/audio/jingles_STEEL16.ogg");
  const bustSfx = useAudio("/audio/lowDown.ogg");
  const dealSfx = useAudio("/audio/cards-pack-take-out-2.ogg");
  const hitSfx = useAudio("/audio/card-slide-8.ogg");
  const loseSfx = useAudio("/audio/error_008.ogg");
  const winSfx = useAudio("/audio/jingles_HIT03.mp3");
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

  React.useEffect(() => {
    setDocumentTitle("Blackjack");
  }, [setDocumentTitle]);

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

    if (previousState) {
      const currentBusts =
        engineState.player?.hands.map((hand) => hand.busted) ?? [];
      const previousBusts =
        previousState.player?.hands.map((hand) => hand.busted) ?? [];

      for (let index = 0; index < currentBusts.length; index += 1) {
        if (currentBusts[index] && !previousBusts[index]) {
          rewindAndPlayAudio(bustSfx);
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
        rewindAndPlayAudio(hitSfx);
      }

      if (engineState.askingToDeal && !previousState.askingToDeal) {
        const previousWinnings = previousState.player?.winnings ?? 0;
        const currentWinnings = engineState.player?.winnings ?? 0;
        const netDiff = currentWinnings - previousWinnings;

        if (netDiff > 0 && getPlayerHasBlackjack(engineState)) {
          rewindAndPlayAudio(blackjackSfx);
        } else if (netDiff > 0) {
          rewindAndPlayAudio(winSfx);
        } else if (netDiff < 0) {
          rewindAndPlayAudio(loseSfx);
        }
      }
    }

    previousEngineStateRef.current = engineState;
  }, [blackjackSfx, bustSfx, engineState, hitSfx, loseSfx, winSfx]);

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
      rewindAndPlayAudio(dealSfx);
      postBlackjackStart();
    },
    [dealSfx, startMusic],
  );

  const resultEmojis = engineState?.result
    ? pickStatusEmojis(
        getDisplayResultSummary(engineState.result),
        engineState.result.badge,
        engineState.result.tone,
      )
    : null;

  return (
    <main
      className="blackjack-page"
      data-engine-state-ready={engineState ? "true" : "false"}
    >
      <section id="game-card">
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
              Go! Blackjack!
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
                onClick={postBlackjackToggleGameMode}
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
          <div id="game" className="blackjack-table-shell">
            <div id="dealer-info" className="blackjack-info-row">
              Dealer: House: <span id="house">{engineState?.house ?? 0}</span>{" "}
              Count: <span id="count">{engineState?.count ?? 0}</span>
            </div>
            <div id="dealer" className="blackjack-seat">
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
              <div id="dealer-total">
                {engineState?.dealer.totalLabel ?? "Total: 0"}
              </div>
            </div>
            {engineState?.result ? (
              <div id="result" className="blackjack-status-panel">
                <div className={getResultToneClass(engineState.result.tone)}>
                  {resultEmojis ? `${resultEmojis[0]} ` : null}
                  {getDisplayResultSummary(engineState.result)}
                  {engineState.result.badge ? (
                    <span
                      className={getResultBadgeClass(engineState.result.badge)}
                    >
                      {engineState.result.badge}
                    </span>
                  ) : null}
                  {resultEmojis ? ` ${resultEmojis[1]}` : null}
                </div>
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
                  id="player-stack"
                  className="blackjack-money-chip"
                  chipSrc={CHIP_BLUE_WHITE_SRC}
                >
                  {engineState?.player
                    ? `${engineState.player.stack >= 0 ? "+" : "-"}$${engineState.player.stack}`
                    : "$0"}
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
                <div id="player-hands" className="blackjack-hands">
                  {(engineState?.player?.hands ?? []).map((hand) => (
                    <div
                      key={hand.index}
                      ref={(element) => {
                        handRefs.current[hand.index] = element;
                      }}
                      className={`blackjack-seat blackjack-hand${hand.active ? " blackjack-hand--active" : ""}`}
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
                              className={getHandStampClass(hand.outcomeLabel)}
                              style={{
                                transform: `translate(-50%, -50%) rotate(${getHandStampAngle(hand)}deg)`,
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
                <span>Sounds</span>
              </label>
            </div>
          </div>
        </div>
      </section>
      <section id="demo-video" className="blackjack-panel blackjack-demo-panel">
        <h2 className="blackjack-panel-title">Why This Project Interests Me</h2>
        <p className="blackjack-panel-subtitle">One Go, Multiple Clients</p>
        <p>
          {
            projects?.find((proj) => "/blackjack" === proj?.href)
              ?.interestsMeWhy
          }
        </p>
      </section>
      <section id="demo-video" className="blackjack-panel blackjack-demo-panel">
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
      <script src="wasm_exec.js" defer></script>
      <script id="wasm" src="main.wasm" type="application/wasm" defer></script>
      <script src="main.js" defer></script>
    </main>
  );
}
