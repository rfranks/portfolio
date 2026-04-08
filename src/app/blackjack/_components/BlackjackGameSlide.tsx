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
  getHintSuggestedAction,
  getOutcomeStampAngle,
  getOutcomeStampClass,
  getResultBadgeClass,
  getResultToneClass,
  getWinningsClass,
  hasCurrencyValue,
} from "../_utils/helpers";
import AnimatedBlackjackCard from "./AnimatedBlackjackCard";
import AnimatedTotalLabel from "./AnimatedTotalLabel";
import BlackjackBonusWagerChip from "./BlackjackBonusWagerChip";
import BlackjackGameModeChip from "./BlackjackGameModeChip";
import BlackjackSettingsModal from "./BlackjackSettingsModal";
import BlackjackWagerChip from "./BlackjackWagerChip";
import ChipDecoratedValue from "./ChipDecoratedValue";
import styles from "./BlackjackGameSlide.module.css";

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
  onCycleBonusWager: () => void;
  onCycleWager: () => void;
  onCardFlip: () => void;
  onModalOk: () => void;
  onSetHandRef: (index: number, node: HTMLDivElement | null) => void;
  onStartGame: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onToggleAllAudio: () => void;
  onToggleAmbience: () => void;
  onToggleBGM: () => void;
  onToggleGameMode: (options?: {
    autoDeal?: boolean;
    direction?: "next" | "prev";
  }) => void;
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

const MODAL_EXIT_ANIMATION_MS = 280;

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
  onCycleBonusWager,
  onCycleWager,
  onCardFlip,
  onModalOk,
  onSetHandRef,
  onStartGame,
  onToggleAllAudio,
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
  const isShortViewport = useMediaQuery("(max-height:820px)");
  const useRoundEndModalLayout = isMobile || isShortViewport;
  const hintSuggestedAction = engineState?.hintText
    ? getHintSuggestedAction(engineState.hintText)
    : null;
  const [hintModalOpen, setHintModalOpen] = React.useState(false);
  const [hintModalVisible, setHintModalVisible] = React.useState(false);
  const [hintModalClosing, setHintModalClosing] = React.useState(false);
  const [gameModeModalOpen, setGameModeModalOpen] = React.useState(false);
  const [gameModeModalVisible, setGameModeModalVisible] = React.useState(false);
  const [gameModeModalClosing, setGameModeModalClosing] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = React.useState(false);
  const [settingsModalClosing, setSettingsModalClosing] = React.useState(false);
  const shouldShowRoundEndModal = Boolean(
    gameStarted &&
      useRoundEndModalLayout &&
      engineState?.askingToDeal &&
      engineState?.result,
  );
  const [roundEndModalVisible, setRoundEndModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (!shouldShowRoundEndModal) {
      setRoundEndModalVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRoundEndModalVisible(true);
    }, 2250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shouldShowRoundEndModal]);

  const showRoundEndModal = shouldShowRoundEndModal && roundEndModalVisible;
  const showHintModal = Boolean(
    hintModalVisible &&
      hintModalOpen &&
      engineState?.hintText &&
      typeof document !== "undefined",
  );
  const showGameModeModal = Boolean(
    gameModeModalVisible &&
      gameModeModalOpen &&
      engineState &&
      typeof document !== "undefined",
  );
  const showSettingsModal = Boolean(
    settingsModalVisible && settingsModalOpen && typeof document !== "undefined",
  );

  React.useEffect(() => {
    if (!engineState?.hintText) {
      setHintModalOpen(false);
    }
  }, [engineState?.hintText]);

  React.useEffect(() => {
    if (hintModalOpen) {
      setHintModalVisible(true);
      setHintModalClosing(false);
      return;
    }

    if (!hintModalVisible) {
      return;
    }

    setHintModalClosing(true);
    const timeoutId = window.setTimeout(() => {
      setHintModalVisible(false);
      setHintModalClosing(false);
    }, MODAL_EXIT_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hintModalOpen, hintModalVisible]);

  React.useEffect(() => {
    if (gameModeModalOpen) {
      setGameModeModalVisible(true);
      setGameModeModalClosing(false);
      return;
    }

    if (!gameModeModalVisible) {
      return;
    }

    setGameModeModalClosing(true);
    const timeoutId = window.setTimeout(() => {
      setGameModeModalVisible(false);
      setGameModeModalClosing(false);
    }, MODAL_EXIT_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [gameModeModalOpen, gameModeModalVisible]);

  React.useEffect(() => {
    if (settingsModalOpen) {
      setSettingsModalVisible(true);
      setSettingsModalClosing(false);
      return;
    }

    if (!settingsModalVisible) {
      return;
    }

    setSettingsModalClosing(true);
    const timeoutId = window.setTimeout(() => {
      setSettingsModalVisible(false);
      setSettingsModalClosing(false);
    }, MODAL_EXIT_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [settingsModalOpen, settingsModalVisible]);

  const closeHintModal = React.useCallback(() => {
    setHintModalOpen(false);
  }, []);

  const closeGameModeModal = React.useCallback(() => {
    setGameModeModalOpen(false);
  }, []);
  const closeSettingsModal = React.useCallback(() => {
    setSettingsModalOpen(false);
  }, []);
  const renderActionButtonLabel = React.useCallback(
    (actionLabel: string) =>
      hintSuggestedAction === actionLabel ? (
        <span className="blackjack-shimmer-text">{actionLabel}</span>
      ) : (
        actionLabel
      ),
    [hintSuggestedAction],
  );
  const renderHintContent = React.useCallback((hintText: string) => {
    const suggestedAction = getHintSuggestedAction(hintText);
    if (!suggestedAction) {
      return hintText;
    }

    const lead = `Hint: Autoplay says you should ${suggestedAction}!`;
    const [firstLine, ...remainingLines] = hintText.split("\n");
    const bodyText =
      firstLine === lead
        ? remainingLines.join("\n")
        : hintText.replace(lead, "").trimStart();

    return (
      <>
        <span>
          Hint: Autoplay says you should{" "}
          <span className="blackjack-shimmer-text">{suggestedAction}</span>!
        </span>
        {bodyText ? <br /> : null}
        {bodyText}
      </>
    );
  }, []);
  const gameModeModal =
    showGameModeModal && engineState
      ? createPortal(
          <div
            className={`blackjack-round-end-modal blackjack-game-mode-modal${gameModeModalClosing ? " blackjack-round-end-modal--closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="blackjack-game-mode-title"
          >
            <button
              type="button"
              className="blackjack-round-end-modal__backdrop"
              aria-label="Close game mode details"
              onClick={closeGameModeModal}
            />
            <div className="blackjack-round-end-modal__panel blackjack-game-mode-modal__panel">
              {engineState.canToggleGameMode ? (
                <div className="blackjack-game-mode-modal__chip-row">
                  <button
                    type="button"
                    className="blackjack-game-mode-modal__chevron"
                    onClick={() =>
                      onToggleGameMode({ autoDeal: false, direction: "prev" })
                    }
                    disabled={!engineState.canToggleGameMode}
                    aria-label="Previous game mode"
                    title="Previous game mode"
                  >
                    ‹
                  </button>
                  <BlackjackGameModeChip
                    engineState={engineState}
                    onToggleGameMode={() =>
                      onToggleGameMode({ autoDeal: false, direction: "next" })
                    }
                    className="blackjack-round-end-modal__mode-chip blackjack-game-mode-modal__center-chip"
                  />
                  <button
                    type="button"
                    className="blackjack-game-mode-modal__chevron"
                    onClick={() =>
                      onToggleGameMode({ autoDeal: false, direction: "next" })
                    }
                    disabled={!engineState.canToggleGameMode}
                    aria-label="Next game mode"
                    title="Next game mode"
                  >
                    ›
                  </button>
                </div>
              ) : null}
              <p className="blackjack-game-mode-modal__description">
                {engineState.gameModeDescription}
              </p>
              {engineState.gameModeRules?.length ? (
                <div className="blackjack-mode-panel blackjack-game-mode-modal__rules">
                  <h3
                    id="blackjack-game-mode-title"
                    className="blackjack-game-mode-modal__title"
                  >
                    Game Rules for {engineState.gameModeLabel}
                  </h3>
                  <ul className="blackjack-mode-panel-rules">
                    {engineState.gameModeRules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="blackjack-game-mode-modal__actions">
                {engineState.canToggleGameMode ? (
                  <button
                    id="deal-mode-modal"
                    type="button"
                    className="blackjack-button blackjack-button-primary"
                    style={{
                      display: getControlDisplay(engineState.controls.deal),
                    }}
                    onClick={() => {
                      closeGameModeModal();
                      onAction("deal");
                    }}
                  >
                    🃏 <span className="blackjack-shimmer-text">Deal</span>
                  </button>
                ) : null}
                {!engineState.canToggleGameMode ? (
                  <button
                    id="close-mode-modal"
                    type="button"
                    className="blackjack-button blackjack-button-subtle"
                    onClick={() => {
                      onModalOk();
                      closeGameModeModal();
                    }}
                  >
                    OK
                  </button>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;
  const hintModal =
    showHintModal && engineState
      ? createPortal(
          <div
            className={`blackjack-round-end-modal blackjack-hint-modal${hintModalClosing ? " blackjack-round-end-modal--closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="blackjack-hint-modal-title"
          >
            <button
              type="button"
              className="blackjack-round-end-modal__backdrop"
              aria-label="Close hint"
              onClick={closeHintModal}
            />
            <div className="blackjack-round-end-modal__panel blackjack-hint-modal__panel">
              <h3 id="blackjack-hint-modal-title" className="blackjack-hint-modal__title">
                Hint!
              </h3>
              <p className="blackjack-hint-modal__body">
                {renderHintContent(engineState.hintText)}
              </p>
              <div className="blackjack-hint-modal__actions">
                <button
                  type="button"
                  className="blackjack-button blackjack-button-subtle"
                  onClick={() => {
                    onModalOk();
                    closeHintModal();
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;
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
              <div
                className={`blackjack-result-status-row${engineState?.askingToDeal ? " blackjack-result-status-row--deal-again" : ""}`}
              >
                {!engineState?.askingToDeal ? (
                  <div id="status">
                    {decorateStatusText(engineState?.statusText ?? "")}
                  </div>
                ) : null}
                <button
                  id="deal"
                  className="blackjack-button blackjack-button-primary"
                  style={{
                    display: getControlDisplay(engineState.controls.deal),
                  }}
                  onClick={() => onAction("deal")}
                >
                  🃏 <span className="blackjack-shimmer-text">Deal Again</span>
                </button>
              </div>
              <div className="blackjack-round-end-modal__wager-row">
                <BlackjackWagerChip
                  engineState={engineState}
                  onCycleWager={onCycleWager}
                  label="Wager"
                  presentation="mode-chip"
                  showChipIcon
                  showBorder
                  className="blackjack-round-end-modal__wager-chip"
                />
                <BlackjackBonusWagerChip
                  engineState={engineState}
                  onCycleBonusWager={onCycleBonusWager}
                  label="Bonus"
                  presentation="mode-chip"
                  showChipIcon
                  showBorder
                  className="blackjack-round-end-modal__bonus-chip"
                />
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
              <div className={styles.bannerControls}>
                <BlackjackGameModeChip
                  engineState={engineState}
                  onToggleGameMode={() => setGameModeModalOpen(true)}
                  className={styles.bannerModeChip}
                  allowWhenLocked
                />
                <button
                  type="button"
                  className={styles.settingsTrigger}
                  onClick={() => setSettingsModalOpen(true)}
                  aria-label="Open settings"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className={styles.settingsTriggerIcon}
                  >
                    <path
                      fill="currentColor"
                      d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.04 7.04 0 0 0-1.63-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.56 8.84a.5.5 0 0 0 .12.64L4.7 11.06c-.04.31-.06.62-.06.94s.02.63.07.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54a.49.49 0 0 0 .49.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.23.09.5 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.02-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"
                    />
                  </svg>
                  <span className={styles.settingsTriggerLabel}>
                    Settings
                  </span>
                </button>
              </div>
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
              Dealer:
              <span className="blackjack-dealer-count">
                Count: <span id="count">{engineState?.count ?? 0}</span>
              </span>
            </div>
            <div id="dealer" className="blackjack-seat">
              <div id="dealer-total">
                <AnimatedTotalLabel
                  value={engineState?.dealer.totalLabel ?? "Total: 0"}
                />
              </div>
              <div className="blackjack-hand-cards-wrap">
                <div className="blackjack-dealer-cards-stack">
                  <div id="dealer-cards" className="cards">
                    {(engineState?.dealer.cards ?? []).map((card, index) => (
                      <AnimatedBlackjackCard
                        key={`${card.suit}-${card.value}-${index}`}
                        card={card}
                        dealIndex={index}
                        onFlip={onCardFlip}
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
                        <BlackjackWagerChip
                          engineState={engineState!}
                          onCycleWager={onCycleWager}
                          fallbackWager={hand.wager}
                        />
                        {engineState?.askingToDeal ? (
                          <BlackjackBonusWagerChip
                            engineState={engineState}
                            onCycleBonusWager={onCycleBonusWager}
                            fallbackWager={hand.trifectaWager}
                          />
                        ) : hand.note ? (
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
                        {!isMobile && hand.bonusWinnings > 0 ? (
                          <span className="blackjack-hand-bonus-win">
                            Bonus {hand.bonusType || "Bet"} won! +
                            {hand.bonusWinnings.toLocaleString("en-US", {
                              currency: "USD",
                              maximumFractionDigits: 0,
                              style: "currency",
                            })}
                            !
                          </span>
                        ) : null}
                      </div>
                      <div className="blackjack-hand-total">
                        <AnimatedTotalLabel value={hand.totalLabel} />
                        {hand.busted ? (
                          <span className="blackjack-busted-badge">
                            Busted!
                          </span>
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
                                onFlip={onCardFlip}
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {engineState?.result && !shouldShowRoundEndModal ? (
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
          {!showRoundEndModal ? (
            <>
              <div className="blackjack-actions-panel blackjack-post-table-panel">
                <div
                  className={`blackjack-status-row${engineState?.askingToDeal ? " blackjack-status-row--deal-again" : ""}`}
                >
                  {!engineState?.askingToDeal ? (
                    <div id="status">
                      {decorateStatusText(engineState?.statusText ?? "")}
                    </div>
                  ) : null}
                  {engineState?.askingToDeal ? (
                    <button
                      id="deal"
                      className="blackjack-button blackjack-button-primary"
                      style={{
                        display: getControlDisplay(engineState.controls.deal),
                      }}
                      onClick={() => onAction("deal")}
                    >
                      🃏{" "}
                      <span className="blackjack-shimmer-text">Deal Again</span>
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
                      🃏 <span className="blackjack-shimmer-text">Deal</span>
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
                    💥 {renderActionButtonLabel("DOUBLE DOWN")}
                  </button>
                  <button
                    id="split"
                    className="blackjack-button"
                    style={{
                      display: getControlDisplay(engineState?.controls.split),
                    }}
                    onClick={() => onAction("split")}
                  >
                    ✂️ {renderActionButtonLabel("SPLIT")}
                  </button>
                  <button
                    id="hit"
                    className="blackjack-button"
                    style={{
                      display: getControlDisplay(engineState?.controls.hit),
                    }}
                    onClick={() => onAction("hit")}
                  >
                    ➕ {renderActionButtonLabel("HIT")}
                  </button>
                  <button
                    id="stand"
                    className="blackjack-button"
                    style={{
                      display: getControlDisplay(engineState?.controls.stand),
                    }}
                    onClick={() => onAction("stand")}
                  >
                    ✋ {renderActionButtonLabel("STAND")}
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
                    id="hint-action"
                    className="blackjack-button blackjack-button-subtle"
                    style={{
                      display: engineState?.hintText ? "inline-flex" : "none",
                    }}
                    onClick={() => setHintModalOpen(true)}
                  >
                    💡 <span className="blackjack-shimmer-text">Hint</span>
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
              </div>
            </>
          ) : null}
        </div>
      </section>
      <BlackjackSettingsModal
        open={showSettingsModal}
        closing={settingsModalClosing}
        onClose={closeSettingsModal}
        onModalOk={onModalOk}
        bgmEnabled={bgmEnabled}
        ambienceEnabled={ambienceEnabled}
        soundsEnabled={soundsEnabled}
        onToggleAllAudio={onToggleAllAudio}
        onToggleBGM={onToggleBGM}
        onToggleAmbience={onToggleAmbience}
        onToggleSounds={onToggleSounds}
      />
      {hintModal}
      {gameModeModal}
      {roundEndModal}
    </>
  );
}
