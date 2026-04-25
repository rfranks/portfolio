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
  BLACKJACK_CARD_FLIP_SOUNDS,
  BLACKJACK_CONFETTI_SOUND,
  BLACKJACK_SOUNDS_STORAGE_KEY,
  CHIP_WIN_IMPACT_SOUNDS,
  CHIP_WIN_LAUNCH_SOUNDS,
} from "../_consts/audio";
import type {
  BlackjackGameMode,
  BlackjackGameModeDirection,
  BlackjackRenderState,
  BlackjackUiAction,
} from "../_types/messages";
import type {
  BlackjackAnalyticsRound,
  BlackjackCarouselSlideId,
  BlackjackConfettiPiece,
  BlackjackRoundTimelineEntry,
  WinningChipFx,
} from "../_types/page";
import {
  isBlackjackStateMessage,
  postBlackjackAction,
  postBlackjackCycleBonusWager,
  postBlackjackCycleWager,
  postBlackjackStart,
  postBlackjackToggleGameMode,
} from "../_utils/messages";
import { createBlackjackConfettiPieces, createWinningChipFx } from "../_utils/effects";
import {
  getDealerOutcomeStampLabel,
  getDisplayResultSummary,
  getPlayerHasBlackjack,
  getResultTransitionKey,
  pickStatusEmojis,
} from "../_utils/helpers";
import { getRoundTimelineCardEvents } from "../_utils/roundTimelineCards";
import { BLACKJACK_CAROUSEL_SLIDES } from "../_consts/blackjack";

const BLACKJACK_ACTION_TIMELINE_LABEL: Record<BlackjackUiAction, string> = {
  deal: "Start Round",
  hit: "Hit",
  stand: "Stand",
  double: "Double Down",
  split: "Split",
  insure: "Insure",
  decline: "Decline Insurance",
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  });

export function useBlackjackPage(documentTitle: string) {
  const { setDocumentTitle } = useDocumentTitle();
  const pageRef = React.useRef<HTMLElement | null>(null);
  const tableShellRef = React.useRef<HTMLDivElement | null>(null);
  const playerStackRef = React.useRef<HTMLSpanElement | null>(null);
  const slideRefs = React.useRef<Partial<Record<BlackjackCarouselSlideId, HTMLElement | null>>>({});
  const handRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  const [engineState, setEngineState] = React.useState<BlackjackRenderState | null>(null);
  const [gameStarted, setGameStarted] = React.useState(false);
  const [startRequested, setStartRequested] = React.useState(false);
  const [controlsArmed, setControlsArmed] = React.useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);
  const [displayedPlayerStack, setDisplayedPlayerStack] = React.useState<number | null>(null);
  const [stackTickerActive, setStackTickerActive] = React.useState(false);
  const [winningChipFx, setWinningChipFx] = React.useState<WinningChipFx[]>([]);
  const [blackjackConfettiPieces, setBlackjackConfettiPieces] = React.useState<
    BlackjackConfettiPiece[]
  >([]);
  const [analyticsRounds, setAnalyticsRounds] = React.useState<BlackjackAnalyticsRound[]>([]);
  const [roundTimelineEntries, setRoundTimelineEntries] = React.useState<
    BlackjackRoundTimelineEntry[]
  >([]);
  const [activeRoundNumber, setActiveRoundNumber] = React.useState(0);
  const [modeTransitionMessageVisible, setModeTransitionMessageVisible] = React.useState(false);
  const [soundsEnabled, setSoundsEnabled] = React.useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(BLACKJACK_SOUNDS_STORAGE_KEY) !== "false";
  });

  const previousEngineStateRef = React.useRef<BlackjackRenderState | null>(null);
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
  const timelineEntryIdRef = React.useRef(0);
  const activeRoundRef = React.useRef(0);
  const pendingActionLabelRef = React.useRef<string | null>(null);

  const blackjackSfx = useAudio("/audio/jingles_STEEL16.ogg");
  const bustSfx = useAudio("/audio/lowDown.ogg");
  const dealSfx = useAudio("/audio/cards-pack-take-out-2.ogg");
  const actionSfx = useAudio("/audio/select_005.ogg");
  const loseSfx = useAudio("/audio/error_008.ogg");
  const winSfx = useAudio("/audio/jingles_HIT03.mp3");
  const chipWinLaunchSfx = useAudio(CHIP_WIN_LAUNCH_SOUNDS[0]);
  const chipWinImpactSfx = useAudio(CHIP_WIN_IMPACT_SOUNDS[0]);
  const cardFlipSfx = useAudio(BLACKJACK_CARD_FLIP_SOUNDS[0]);
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

  const createTimelineEntry = React.useCallback(
    (entry: Omit<BlackjackRoundTimelineEntry, "id">): BlackjackRoundTimelineEntry => {
      timelineEntryIdRef.current += 1;
      return {
        ...entry,
        id: `blackjack-round-${entry.round}-step-${timelineEntryIdRef.current}`,
      };
    },
    [],
  );

  const appendTimelineEntry = React.useCallback(
    (
      kind: BlackjackRoundTimelineEntry["kind"],
      title: string,
      options?: {
        amountDisplay?: string;
        card?: BlackjackRoundTimelineEntry["card"];
        detail?: string;
      },
    ) => {
      const round = Math.max(1, activeRoundRef.current);
      const nextEntry = createTimelineEntry({
        kind,
        round,
        title,
        detail: options?.detail,
        amountDisplay: options?.amountDisplay,
        card: options?.card,
      });
      setRoundTimelineEntries((current) => [...current, nextEntry].slice(-28));
    },
    [createTimelineEntry],
  );

  const startNewRoundTimeline = React.useCallback(() => {
    const nextRound = activeRoundRef.current + 1;
    activeRoundRef.current = nextRound;
    setActiveRoundNumber(nextRound);
    setRoundTimelineEntries([
      createTimelineEntry({
        round: nextRound,
        kind: "action",
        title: "Start Round",
      }),
    ]);
  }, [createTimelineEntry]);

  const playWagerChipSfx = React.useCallback(() => {
    const wagerToggleSound =
      CHIP_WIN_IMPACT_SOUNDS[Math.floor(Math.random() * CHIP_WIN_IMPACT_SOUNDS.length)];
    playSfx(chipWinImpactSfx, wagerToggleSound, { volume: 0.48 });
  }, [chipWinImpactSfx, playSfx]);

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

      const durationMs = Math.min(1800, Math.max(700, Math.abs(to - from) * 22));
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
      const targetX = stackRect.left - tableRect.left + stackRect.width * 0.5 - 22;
      const targetY = stackRect.top - tableRect.top + stackRect.height * 0.5 - 22;

      const nextFx = createWinningChipFx({
        chipCount,
        tableWidth: tableRect.width,
        tableHeight: tableRect.height,
        targetX,
        targetY,
      });

      setWinningChipFx(nextFx);

      const launchSound =
        CHIP_WIN_LAUNCH_SOUNDS[Math.floor(Math.random() * CHIP_WIN_LAUNCH_SOUNDS.length)];
      playSfx(chipWinLaunchSfx, launchSound, { volume: 0.5 });

      if (winningChipClearTimeoutRef.current !== null) {
        window.clearTimeout(winningChipClearTimeoutRef.current);
      }
      if (winningChipImpactTimeoutRef.current !== null) {
        window.clearTimeout(winningChipImpactTimeoutRef.current);
      }

      const maxLifetimeMs = nextFx.reduce(
        (maxLifetime, chip) => Math.max(maxLifetime, chip.delayMs + chip.durationMs),
        0,
      );
      const impactSound =
        CHIP_WIN_IMPACT_SOUNDS[Math.floor(Math.random() * CHIP_WIN_IMPACT_SOUNDS.length)];
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
      (maxLifetime, piece) => Math.max(maxLifetime, piece.delayMs + piece.durationMs),
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
      playSfx(actionSfx, undefined, { volume: 0.4 });
      pendingActionLabelRef.current = BLACKJACK_ACTION_TIMELINE_LABEL[action];
      postBlackjackAction(action);
    },
    [actionSfx, playSfx, startMusic],
  );

  const handleModalOk = React.useCallback(() => {
    playSfx(actionSfx, undefined, { volume: 0.4 });
  }, [actionSfx, playSfx]);

  const handleStartGame = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      startMusic();
      setStartRequested(true);
      setControlsArmed(false);
      activeRoundRef.current = 0;
      setActiveRoundNumber(0);
      setAnalyticsRounds([]);
      setRoundTimelineEntries([]);
      pendingActionLabelRef.current = null;
      playSfx(dealSfx);
      postBlackjackStart();
    },
    [dealSfx, playSfx, startMusic],
  );

  const handleToggleGameMode = React.useCallback(
    (options?: { autoDeal?: boolean; direction?: BlackjackGameModeDirection }) => {
      const autoDeal = options?.autoDeal ?? true;
      const direction = options?.direction ?? "next";
      startMusic();
      pendingModeChangeAutoDealRef.current = autoDeal;
      modeChangeObservedRef.current = false;
      setModeTransitionMessageVisible(autoDeal);

      if (!autoDeal) {
        pendingModeChangeAutoDealRef.current = false;
      }
      pendingActionLabelRef.current =
        direction === "prev" ? "Switch to Previous Mode" : "Switch to Next Mode";

      postBlackjackToggleGameMode(direction);
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
    window.localStorage.setItem(BLACKJACK_SOUNDS_STORAGE_KEY, String(shouldEnableAll));
  }, [ambienceEnabled, bgmEnabled, soundsEnabled, startAmbience, startBGM, stopAmbience, stopBGM]);

  const handleCycleWager = React.useCallback(() => {
    playWagerChipSfx();
    postBlackjackCycleWager();
  }, [playWagerChipSfx]);

  const handleCycleBonusWager = React.useCallback(() => {
    playWagerChipSfx();
    postBlackjackCycleBonusWager();
  }, [playWagerChipSfx]);

  const handleCardFlip = React.useCallback(() => {
    const flipSound =
      BLACKJACK_CARD_FLIP_SOUNDS[Math.floor(Math.random() * BLACKJACK_CARD_FLIP_SOUNDS.length)];
    playSfx(cardFlipSfx, flipSound, { volume: 0.34 });
  }, [cardFlipSfx, playSfx]);

  const setSlideRef = React.useCallback(
    (id: BlackjackCarouselSlideId, node: HTMLElement | null) => {
      slideRefs.current[id] = node;
    },
    [],
  );

  const setHandRef = React.useCallback((index: number, node: HTMLDivElement | null) => {
    handRefs.current[index] = node;
  }, []);

  const resolveSlideLeft = React.useCallback((index: number, root: HTMLElement) => {
    const slideId = BLACKJACK_CAROUSEL_SLIDES[index]?.id;
    const slideNode = slideId ? slideRefs.current[slideId] : null;
    return slideNode?.offsetLeft ?? index * root.clientWidth;
  }, []);

  const scrollToSlide = React.useCallback(
    (targetIndex: number) => {
      const root = pageRef.current;
      const slideCount = BLACKJACK_CAROUSEL_SLIDES.length;
      if (!root) {
        return;
      }

      const normalizedIndex = ((targetIndex % slideCount) + slideCount) % slideCount;
      root.scrollTo({
        left: resolveSlideLeft(normalizedIndex, root),
        behavior: "smooth",
      });
    },
    [resolveSlideLeft],
  );

  const handleCycleSlides = React.useCallback(
    (direction: -1 | 1) => {
      scrollToSlide(activeSlideIndex + direction);
    },
    [activeSlideIndex, scrollToSlide],
  );

  React.useEffect(() => {
    setDocumentTitle(documentTitle);
  }, [documentTitle, setDocumentTitle]);

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

    let rafId: number | null = null;

    const syncActiveIndexFromScroll = () => {
      const scrollLeft = root.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (let index = 0; index < BLACKJACK_CAROUSEL_SLIDES.length; index += 1) {
        const slideLeft = resolveSlideLeft(index, root);
        const distance = Math.abs(scrollLeft - slideLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }

      setActiveSlideIndex(closestIndex);
    };

    const handleScroll = () => {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncActiveIndexFromScroll();
      });
    };

    syncActiveIndexFromScroll();
    root.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      root.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [resolveSlideLeft]);

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
    const enteredNewRound = Boolean(previousState?.askingToDeal && !engineState.askingToDeal);
    if (enteredNewRound) {
      startNewRoundTimeline();
    }

    const pendingActionLabel = pendingActionLabelRef.current;
    const shouldSuppressStartRoundAction =
      enteredNewRound && pendingActionLabel === BLACKJACK_ACTION_TIMELINE_LABEL.deal;
    let shouldAppendPendingAction = Boolean(pendingActionLabel && !shouldSuppressStartRoundAction);

    if (previousState && activeRoundRef.current > 0) {
      const cardEvents = getRoundTimelineCardEvents({
        enteredNewRound,
        previousState,
        nextState: engineState,
      });

      if (pendingActionLabel && shouldAppendPendingAction) {
        const canMergeActionIntoDeal =
          pendingActionLabel === "Hit" || pendingActionLabel === "Double Down";
        const firstDealEventIndex = cardEvents.findIndex(
          (event) => event.kind === "state" && event.title.includes("Dealt"),
        );
        if (canMergeActionIntoDeal && firstDealEventIndex >= 0) {
          const firstDealEvent = cardEvents[firstDealEventIndex];
          cardEvents[firstDealEventIndex] = {
            ...firstDealEvent,
            kind: "action",
            title: `${pendingActionLabel} - ${firstDealEvent.title}`,
          };
          shouldAppendPendingAction = false;
        }
      }

      for (const event of cardEvents) {
        appendTimelineEntry(event.kind, event.title, { detail: event.detail, card: event.card });
      }
    }

    if (pendingActionLabel && shouldAppendPendingAction) {
      appendTimelineEntry("action", pendingActionLabel);
    }
    pendingActionLabelRef.current = null;

    const previousStatusText = previousState?.statusText?.trim() ?? "";
    const nextStatusText = engineState.statusText?.trim() ?? "";
    if (nextStatusText && nextStatusText !== previousStatusText) {
      appendTimelineEntry("decision", "Status Update", { detail: nextStatusText });
    }

    const previousHintText = previousState?.hintText?.trim() ?? "";
    const nextHintText = engineState.hintText?.trim() ?? "";
    if (nextHintText && nextHintText !== previousHintText) {
      appendTimelineEntry("decision", "Hint", { detail: nextHintText });
    }

    const currentPlayerStack = engineState.player?.stack ?? 0;
    if (displayedPlayerStack === null) {
      setDisplayedPlayerStack(currentPlayerStack);
    }

    let handledWinningStackAnimation = false;

    if (previousState) {
      const previousResultKey = getResultTransitionKey(previousState.result);
      const currentResultKey = getResultTransitionKey(engineState.result);
      const currentBusts = engineState.player?.hands.map((hand) => hand.busted) ?? [];
      const previousBusts = previousState.player?.hands.map((hand) => hand.busted) ?? [];

      for (let index = 0; index < currentBusts.length; index += 1) {
        if (currentBusts[index] && !previousBusts[index]) {
          playSfx(bustSfx);
          break;
        }
      }

      if (currentResultKey && currentResultKey !== previousResultKey) {
        const previousWinnings = previousState.player?.winnings ?? 0;
        const currentWinnings = engineState.player?.winnings ?? 0;
        const netDiff = currentWinnings - previousWinnings;
        const previousPlayerStack = previousState.player?.stack ?? currentPlayerStack;
        const stackDelta = currentPlayerStack - previousPlayerStack;
        const isBlackjackWin =
          engineState.result?.badge === "Won!" &&
          (getPlayerHasBlackjack(engineState) || engineState.result.summary.includes("Blackjack"));

        if (isBlackjackWin) {
          playSfx(blackjackSfx);
        } else if (netDiff > 0) {
          playSfx(winSfx);
        } else if (netDiff < 0) {
          playSfx(loseSfx);
        }

        if (engineState.result?.badge === "Won!") {
          const visualWinAmount = Math.max(stackDelta, netDiff, currentWinnings, 15);

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

        appendTimelineEntry("decision", "Round Resolved", {
          detail: engineState.result?.summary || "Hand completed.",
        });
        if (engineState.result?.detailLines.length) {
          appendTimelineEntry("decision", "Rule Decisions", {
            detail: engineState.result.detailLines.join(" • "),
          });
        }
        if (stackDelta !== 0 || netDiff !== 0) {
          const payoutDelta = stackDelta !== 0 ? stackDelta : netDiff;
          appendTimelineEntry("payout", payoutDelta >= 0 ? "Payout Applied" : "Loss Applied", {
            amountDisplay: `${payoutDelta >= 0 ? "+" : ""}${formatCurrency(payoutDelta)}`,
            detail: `Stack: ${formatCurrency(previousPlayerStack)} → ${formatCurrency(currentPlayerStack)}`,
          });
        }

        const roundOutcome: BlackjackAnalyticsRound["outcome"] =
          engineState.result?.badge === "Won!"
            ? "win"
            : engineState.result?.badge === "Push"
              ? "push"
              : "loss";
        setAnalyticsRounds((current) =>
          [
            ...current,
            {
              round: activeRoundRef.current,
              outcome: roundOutcome,
              netDelta: stackDelta !== 0 ? stackDelta : netDiff,
              bustedHands: currentBusts.filter(Boolean).length,
              dealerBusted: Boolean(engineState.dealer.busted),
              blackjackWin: isBlackjackWin,
            },
          ].slice(-80),
        );
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
    loseSfx,
    playSfx,
    syncDisplayedPlayerStack,
    triggerBlackjackCelebration,
    triggerWinningChipFx,
    winSfx,
    appendTimelineEntry,
    startNewRoundTimeline,
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
    handleCycleBonusWager,
    handleCycleWager,
    handleCardFlip,
    handleCycleSlides,
    handleModalOk,
    handleStartGame,
    handleToggleAllAudio,
    handleToggleGameMode,
    handleToggleSounds,
    handRefs,
    modeTransitionMessageVisible,
    pageRef,
    playerStackRef,
    resultEmojis,
    analyticsRounds,
    roundTimelineEntries,
    activeRoundNumber,
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
