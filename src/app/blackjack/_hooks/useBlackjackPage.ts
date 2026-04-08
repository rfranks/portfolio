"use client";

import * as React from "react";
import { useAudio } from "@/hooks/audio/useAudio";
import { useAmbience } from "@/hooks/audio/useAmbience";
import { useBGM } from "@/hooks/audio/useBGM";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import { rewindAndPlayAudio } from "@/utils/audio";
import {
  BLACKJACK_AMBIENT_SOUNDS,
  BLACKJACK_BGM_PROGRESSION,
  BLACKJACK_CONFETTI_SOUND,
  BLACKJACK_SOUNDS_STORAGE_KEY,
  CHIP_WIN_IMPACT_SOUNDS,
  CHIP_WIN_LAUNCH_SOUNDS,
} from "../_consts/audio";
import type {
  BlackjackGameMode,
  BlackjackRenderState,
  BlackjackUiAction,
} from "../_types/messages";
import type {
  BlackjackCarouselSlideId,
  BlackjackConfettiPiece,
  WinningChipFx,
} from "../_types/page";
import {
  isBlackjackStateMessage,
  postBlackjackAction,
  postBlackjackCycleWager,
  postBlackjackStart,
  postBlackjackToggleGameMode,
} from "../_utils/messages";
import {
  createBlackjackConfettiPieces,
  createWinningChipFx,
} from "../_utils/effects";
import {
  countRenderedCards,
  getDealerOutcomeStampLabel,
  getDisplayResultSummary,
  getPlayerHasBlackjack,
  getResultTransitionKey,
  pickStatusEmojis,
} from "../_utils/helpers";
import { BLACKJACK_CAROUSEL_SLIDES } from "../_consts/blackjack";

export function useBlackjackPage() {
  const { setDocumentTitle } = useDocumentTitle();
  const pageRef = React.useRef<HTMLElement | null>(null);
  const tableShellRef = React.useRef<HTMLDivElement | null>(null);
  const playerStackRef = React.useRef<HTMLSpanElement | null>(null);
  const slideRefs = React.useRef<
    Partial<Record<BlackjackCarouselSlideId, HTMLElement | null>>
  >({});
  const handRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

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

    return (
      window.localStorage.getItem(BLACKJACK_SOUNDS_STORAGE_KEY) !== "false"
    );
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
  const blackjackConfettiWaveTimeoutRef = React.useRef<number | null>(null);
  const previousActiveHandIndexRef = React.useRef<number | null>(null);
  const musicStartedRef = React.useRef(false);

  const blackjackSfx = useAudio("/audio/jingles_STEEL16.ogg");
  const bustSfx = useAudio("/audio/lowDown.ogg");
  const dealSfx = useAudio("/audio/cards-pack-take-out-2.ogg");
  const hitSfx = useAudio("/audio/card-slide-8.ogg");
  const loseSfx = useAudio("/audio/error_008.ogg");
  const winSfx = useAudio("/audio/jingles_HIT03.mp3");
  const chipWinLaunchSfx = useAudio(CHIP_WIN_LAUNCH_SOUNDS[0]);
  const chipWinImpactSfx = useAudio(CHIP_WIN_IMPACT_SOUNDS[0]);
  const blackjackConfettiSfx = useAudio(BLACKJACK_CONFETTI_SOUND);

  const {
    enabled: bgmEnabled,
    start: startBGM,
    stop: stopBGM,
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
    stop: stopAmbience,
    toggle: toggleAmbience,
  } = useAmbience(BLACKJACK_AMBIENT_SOUNDS, {
    minDelayMs: 1400,
    maxDelayMs: 4200,
    minVolume: 0.03,
    maxVolume: 0.1,
  });

  const dealerOutcomeStampLabel = React.useMemo(
    () => getDealerOutcomeStampLabel(engineState),
    [engineState],
  );

  const resultEmojis = React.useMemo(() => {
    if (!engineState?.result) {
      return null;
    }

    return pickStatusEmojis(
      getDisplayResultSummary(engineState.result),
      engineState.result.badge,
      engineState.result.tone,
    );
  }, [engineState?.result]);

  const activeVisualHandIndex = React.useMemo(
    () => engineState?.player?.hands.find((hand) => hand.active)?.index ?? null,
    [engineState?.player?.hands],
  );

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

  const triggerWinningChipFx = React.useCallback(
    (winAmount: number) => {
      const tableRect = tableShellRef.current?.getBoundingClientRect();
      const stackRect = playerStackRef.current?.getBoundingClientRect();
      if (!tableRect || !stackRect) {
        return;
      }

      const chipCount = Math.min(14, Math.max(6, Math.round(winAmount / 15)));
      const targetX =
        stackRect.left - tableRect.left + stackRect.width * 0.5 - 22;
      const targetY =
        stackRect.top - tableRect.top + stackRect.height * 0.5 - 22;

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
    },
    [chipWinImpactSfx, chipWinLaunchSfx, playSfx],
  );

  const triggerBlackjackCelebration = React.useCallback(() => {
    const nextPieces = createBlackjackConfettiPieces(42);
    const secondWavePreview = createBlackjackConfettiPieces(28).map((piece) => ({
      ...piece,
      delayMs: piece.delayMs + 600,
    }));
    setBlackjackConfettiPieces(nextPieces);
    playSfx(blackjackConfettiSfx, { volume: 0.68 });

    if (blackjackConfettiClearTimeoutRef.current !== null) {
      window.clearTimeout(blackjackConfettiClearTimeoutRef.current);
    }
    if (blackjackConfettiWaveTimeoutRef.current !== null) {
      window.clearTimeout(blackjackConfettiWaveTimeoutRef.current);
    }

    blackjackConfettiWaveTimeoutRef.current = window.setTimeout(() => {
      setBlackjackConfettiPieces((currentPieces) => [
        ...currentPieces,
        ...secondWavePreview.map((piece) => ({
          ...piece,
          id: `${piece.id}-wave-2`,
          delayMs: Math.max(0, piece.delayMs - 600),
        })),
      ]);
      blackjackConfettiWaveTimeoutRef.current = null;
    }, 520);

    const maxLifetimeMs = [...nextPieces, ...secondWavePreview].reduce(
      (maxLifetime, piece) =>
        Math.max(maxLifetime, piece.delayMs + piece.durationMs),
      0,
    );

    blackjackConfettiClearTimeoutRef.current = window.setTimeout(() => {
      setBlackjackConfettiPieces([]);
      blackjackConfettiClearTimeoutRef.current = null;
    }, maxLifetimeMs + 320);
  }, [blackjackConfettiSfx, playSfx]);

  const startMusic = React.useCallback(() => {
    if (musicStartedRef.current) {
      return;
    }

    musicStartedRef.current = true;
    void startBGM();
    startAmbience();
  }, [startAmbience, startBGM]);

  const handleAction = React.useCallback(
    (action: BlackjackUiAction) => {
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

  const handleToggleGameMode = React.useCallback(
    (options?: { autoDeal?: boolean }) => {
      const autoDeal = options?.autoDeal ?? true;
      startMusic();
      pendingModeChangeAutoDealRef.current = autoDeal;
      modeChangeObservedRef.current = false;
      setModeTransitionMessageVisible(autoDeal);

      if (!autoDeal) {
        pendingModeChangeAutoDealRef.current = false;
      }

      postBlackjackToggleGameMode();
    },
    [startMusic],
  );

  const handleToggleSounds = React.useCallback(() => {
    setSoundsEnabled((previous) => {
      const next = !previous;
      window.localStorage.setItem(BLACKJACK_SOUNDS_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const handleToggleAllAudio = React.useCallback(() => {
    const shouldEnableAll = !(bgmEnabled && ambienceEnabled && soundsEnabled);

    if (shouldEnableAll) {
      void startBGM();
      startAmbience();
    } else {
      void stopBGM();
      stopAmbience();
    }

    setSoundsEnabled(shouldEnableAll);
    window.localStorage.setItem(
      BLACKJACK_SOUNDS_STORAGE_KEY,
      String(shouldEnableAll),
    );
  }, [
    ambienceEnabled,
    bgmEnabled,
    soundsEnabled,
    startAmbience,
    startBGM,
    stopAmbience,
    stopBGM,
  ]);

  const handleCycleWager = React.useCallback(() => {
    postBlackjackCycleWager();
  }, []);

  const setSlideRef = React.useCallback(
    (id: BlackjackCarouselSlideId, node: HTMLElement | null) => {
      slideRefs.current[id] = node;
    },
    [],
  );

  const setHandRef = React.useCallback(
    (index: number, node: HTMLDivElement | null) => {
      handRefs.current[index] = node;
    },
    [],
  );

  const scrollToSlide = React.useCallback((targetIndex: number) => {
    const slideCount = BLACKJACK_CAROUSEL_SLIDES.length;
    const normalizedIndex =
      ((targetIndex % slideCount) + slideCount) % slideCount;
    const targetId = BLACKJACK_CAROUSEL_SLIDES[normalizedIndex]?.id;
    if (!targetId) {
      return;
    }

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
      if (blackjackConfettiWaveTimeoutRef.current !== null) {
        window.clearTimeout(blackjackConfettiWaveTimeoutRef.current);
      }
    };
  }, [stopStackTicker]);

  React.useEffect(() => {
    const root = pageRef.current;
    if (!root) {
      return;
    }

    const observedSlides = BLACKJACK_CAROUSEL_SLIDES.map(
      ({ id }) => slideRefs.current[id],
    ).filter((slide): slide is HTMLElement => Boolean(slide));

    if (observedSlides.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

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
            animateDisplayedPlayerStack(
              previousPlayerStack,
              currentPlayerStack,
            );
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

  return {
    activeSlideIndex,
    activeVisualHandIndex,
    ambienceEnabled,
    bgmEnabled,
    blackjackConfettiPieces,
    controlsArmed,
    dealerOutcomeStampLabel,
    displayedPlayerStack,
    engineState,
    gameStarted,
    handleAction,
    handleCycleWager,
    handleCycleSlides,
    handleStartGame,
    handleToggleAllAudio,
    handleToggleGameMode,
    handleToggleSounds,
    handRefs,
    modeTransitionMessageVisible,
    pageRef,
    playerStackRef,
    resultEmojis,
    scrollToSlide,
    setHandRef,
    setSlideRef,
    soundsEnabled,
    stackTickerActive,
    tableShellRef,
    toggleAmbience,
    toggleBGM,
    winningChipFx,
  };
}

export type UseBlackjackPageResult = ReturnType<typeof useBlackjackPage>;
