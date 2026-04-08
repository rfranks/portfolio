"use client";

import * as React from "react";
import Image from "next/image";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createPortal } from "react-dom";
import { withBasePath } from "@/utils/basePath";
import {
  BLACKJACK_START_CARD_ACE_SRC,
  BLACKJACK_START_CARD_BACK_SRC,
  BLACKJACK_START_CARD_JACK_SRC,
  CHIP_BLACK_WHITE_SRC,
  CHIP_BLUE_WHITE_SRC,
  CHIP_GREEN_WHITE_SRC,
  CHIP_RED_WHITE_SRC,
  CHIP_WHITE_BLUE_SRC,
} from "../_consts/blackjack";
import type {
  BlackjackRenderState,
  BlackjackUiAction,
} from "../_types/messages";
import type { WinningChipFx } from "../_types/page";
import {
  decorateResultDetailLine,
  getResultBadgeLabel,
  decorateStatusText,
  formatPlayerStackValue,
  getControlDisplay,
  getOutcomeStampAngle,
  getOutcomeStampClass,
  getResultBadgeClass,
  getResultToneClass,
  getWinningsClass,
  hasCurrencyValue,
} from "../_utils/helpers";
import AnimatedBlackjackCard from "./AnimatedBlackjackCard";
import AnimatedTotalLabel from "./AnimatedTotalLabel";
import BlackjackGameModeChip from "./BlackjackGameModeChip";
import ChipDecoratedValue from "./ChipDecoratedValue";

type BlackjackGameSlideProps = {
  activeVisualHandIndex: number | null;
  ambienceEnabled: boolean;
  controlsArmed: boolean;
  dealerOutcomeStampLabel: string;
  displayedPlayerStack: number | null;
  engineState: BlackjackRenderState | null;
  gameStarted: boolean;
  modeTransitionMessageVisible: boolean;
  onAction: (action: BlackjackUiAction) => void;
  onSetHandRef: (index: number, node: HTMLDivElement | null) => void;
  onStartGame: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onToggleAmbience: () => void;
  onToggleBGM: () => void;
  onToggleGameMode: () => void;
  onToggleSounds: () => void;
  playerStackRef: React.RefObject<HTMLSpanElement | null>;
  resultEmojis: [string, string] | null;
  setSlideRef: (node: HTMLElement | null) => void;
  soundsEnabled: boolean;
  stackTickerActive: boolean;
  tableShellRef: React.RefObject<HTMLDivElement | null>;
  winningChipFx: WinningChipFx[];
  bgmEnabled: boolean;
};

export default function BlackjackGameSlide({
  activeVisualHandIndex,
  ambienceEnabled,
  bgmEnabled,
  controlsArmed,
  dealerOutcomeStampLabel,
  displayedPlayerStack,
  engineState,
  gameStarted,
  modeTransitionMessageVisible,
  onAction,
  onSetHandRef,
  onStartGame,
  onToggleAmbience,
  onToggleBGM,
  onToggleGameMode,
  onToggleSounds,
  playerStackRef,
  resultEmojis,
  setSlideRef,
  soundsEnabled,
  stackTickerActive,
  tableShellRef,
  winningChipFx,
}: BlackjackGameSlideProps) {
  const isMobile = useMediaQuery("(max-width:768px)");
  const showRoundEndModal = Boolean(
    isMobile && engineState?.askingToDeal && engineState?.result,
  );
  const roundEndModal =
    showRoundEndModal && engineState?.result && typeof document !== "undefined"
      ? createPortal(
          <div
            className="blackjack-round-end-modal"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="blackjack-round-end-modal__backdrop"
              aria-hidden="true"
            />
            <div className="blackjack-round-end-modal__panel">
              {engineState.result.badge ? (
                <div className="blackjack-result-badge-row">
                  <span
                    className={getResultBadgeClass(engineState.result.badge)}
                  >
                    {getResultBadgeLabel(engineState.result)}
                  </span>
                </div>
              ) : null}
              <div
                className={`blackjack-result-summary ${getResultToneClass(engineState.result.tone)}`}
              >
                {resultEmojis ? `${resultEmojis[0]} ` : null}
                {engineState.result.badge === "Push"
                  ? "You pushed!"
                  : engineState.result.summary}
                {resultEmojis ? ` ${resultEmojis[1]}` : null}
              </div>
              {engineState.result.detailLines.map((line, index) =>
                engineState.result ? (
                  <div
                    key={index}
                    className={`${getResultToneClass(engineState.result.tone)}${hasCurrencyValue(line) ? " blackjack-money-chip" : ""}`}
                  >
                    {hasCurrencyValue(line) ? (
                      <ChipDecoratedValue
                        chipSrc={CHIP_WHITE_BLUE_SRC}
                        className="blackjack-money-chip-inline"
                      >
                        {decorateResultDetailLine(
                          line,
                          engineState.result.tone,
                          engineState.result.badge,
                        )}
                      </ChipDecoratedValue>
                    ) : (
                      decorateResultDetailLine(
                        line,
                        engineState.result.tone,
                        engineState.result.badge,
                      )
                    )}
                  </div>
                ) : null,
              )}
              <div className="blackjack-result-status-row">
                <div id="status">
                  {decorateStatusText(engineState?.statusText ?? "")}
                </div>
                <button
                  id="deal"
                  className="blackjack-button blackjack-button-primary"
                  style={{
                    display: getControlDisplay(engineState.controls.deal),
                  }}
                  onClick={() => onAction("deal")}
                >
                  🃏 Deal
                </button>
              </div>
              <BlackjackGameModeChip
                engineState={engineState}
                onToggleGameMode={() => onToggleGameMode({ autoDeal: false })}
                className="blackjack-round-end-modal__mode-chip"
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <section
        id="game-card"
        ref={setSlideRef}
        className="blackjack-panel blackjack-game-panel blackjack-carousel-slide"
      >
        {!gameStarted && (
          <div className="blackjack-start-screen">
            <div className="blackjack-start-backdrop" aria-hidden="true">
              <Image
                className="blackjack-start-card blackjack-start-card--back"
                src={withBasePath(BLACKJACK_START_CARD_BACK_SRC)}
                alt=""
                width={240}
                height={348}
              />
              <Image
                className="blackjack-start-card blackjack-start-card--jack"
                src={withBasePath(BLACKJACK_START_CARD_JACK_SRC)}
                alt=""
                width={240}
                height={348}
              />
              <Image
                className="blackjack-start-card blackjack-start-card--ace"
                src={withBasePath(BLACKJACK_START_CARD_ACE_SRC)}
                alt=""
                width={240}
                height={348}
              />
            </div>
            <button
              type="button"
              className="blackjack-start-button"
              onClick={onStartGame}
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
                src={withBasePath(BLACKJACK_START_CARD_BACK_SRC)}
                alt=""
                width={180}
                height={261}
              />
              <Image
                className="blackjack-game-banner-card blackjack-game-banner-card--jack"
                src={withBasePath(BLACKJACK_START_CARD_JACK_SRC)}
                alt=""
                width={180}
                height={261}
              />
              <Image
                className="blackjack-game-banner-card blackjack-game-banner-card--ace"
                src={withBasePath(BLACKJACK_START_CARD_ACE_SRC)}
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
              <BlackjackGameModeChip
                engineState={engineState}
                onToggleGameMode={onToggleGameMode}
              />
            ) : null}
            {modeTransitionMessageVisible ? (
              <div
                className="blackjack-mode-transition-indicator"
                role="status"
              >
                <span
                  className="blackjack-mode-transition-spinner"
                  aria-hidden="true"
                />
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
                <AnimatedTotalLabel
                  value={engineState?.dealer.totalLabel ?? "Total: 0"}
                />
              </div>
            </div>
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
                      ref={(node) => onSetHandRef(hand.index, node)}
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
                        ${hand.wager}
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
                        <AnimatedTotalLabel value={hand.totalLabel} />
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
          </div>
          {engineState?.result && !showRoundEndModal ? (
            <div
              id="result"
              className="blackjack-status-panel blackjack-post-table-panel"
            >
              {engineState.result.badge ? (
                <div className="blackjack-result-badge-row">
                  <span
                    className={getResultBadgeClass(engineState.result.badge)}
                  >
                    {getResultBadgeLabel(engineState.result)}
                  </span>
                </div>
              ) : null}
              <div
                className={`blackjack-result-summary ${getResultToneClass(engineState.result.tone)}`}
              >
                {resultEmojis ? `${resultEmojis[0]} ` : null}
                {engineState.result.badge === "Push"
                  ? "You pushed!"
                  : engineState.result.summary}
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
                      {engineState.result
                        ? decorateResultDetailLine(
                            line,
                            engineState.result.tone,
                            engineState.result.badge,
                          )
                        : ""}
                    </ChipDecoratedValue>
                  ) : engineState.result ? (
                    decorateResultDetailLine(
                      line,
                      engineState.result.tone,
                      engineState.result.badge,
                    )
                  ) : (
                    ""
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {engineState?.hintText ? (
            <div
              id="hint"
              className="blackjack-hint-panel blackjack-post-table-panel"
            >
              {engineState.hintText}
            </div>
          ) : null}
          {!showRoundEndModal ? (
            <div className="blackjack-status-panel blackjack-post-table-panel">
              <div className="blackjack-status-row">
                <div id="status">
                  {decorateStatusText(engineState?.statusText ?? "")}
                </div>
                {engineState?.askingToDeal ? (
                  <button
                    id="deal"
                    className="blackjack-button blackjack-button-primary"
                    style={{
                      display: getControlDisplay(engineState.controls.deal),
                    }}
                    onClick={() => onAction("deal")}
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
                    onClick={() => onAction("deal")}
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
                  onClick={() => onAction("double")}
                >
                  💥 Double
                </button>
                <button
                  id="split"
                  className="blackjack-button"
                  style={{
                    display: getControlDisplay(engineState?.controls.split),
                  }}
                  onClick={() => onAction("split")}
                >
                  ✂️ Split
                </button>
                <button
                  id="hit"
                  className="blackjack-button"
                  style={{
                    display: getControlDisplay(engineState?.controls.hit),
                  }}
                  onClick={() => onAction("hit")}
                >
                  ➕ Hit
                </button>
                <button
                  id="stand"
                  className="blackjack-button"
                  style={{
                    display: getControlDisplay(engineState?.controls.stand),
                  }}
                  onClick={() => onAction("stand")}
                >
                  ✋ Stand
                </button>
                <button
                  id="insure"
                  className="blackjack-button"
                  style={{
                    display: getControlDisplay(engineState?.controls.insure),
                  }}
                  onClick={() => onAction("insure")}
                >
                  🛡️ Insure
                </button>
                <button
                  id="decline"
                  className="blackjack-button blackjack-button-subtle"
                  style={{
                    display: getControlDisplay(engineState?.controls.decline),
                  }}
                  onClick={() => onAction("decline")}
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
                    onChange={onToggleBGM}
                  />
                  <span>BGM</span>
                </label>
                <label className="blackjack-audio-toggle">
                  <input
                    type="checkbox"
                    checked={ambienceEnabled}
                    onChange={onToggleAmbience}
                  />
                  <span>Ambient</span>
                </label>
                <label className="blackjack-audio-toggle">
                  <input
                    type="checkbox"
                    checked={soundsEnabled}
                    onChange={onToggleSounds}
                  />
                  <span>Sounds</span>
                </label>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      {roundEndModal}
    </>
  );
}
