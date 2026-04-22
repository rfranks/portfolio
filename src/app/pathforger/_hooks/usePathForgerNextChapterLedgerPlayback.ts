import * as React from "react";
import { buildJourneyLedgerPlaybackEntries } from "@/app/pathforger/_utils/journeyLedger";
import type {
  JourneyLedgerPlaybackEntry,
  JourneyLedgerPlaybackViewModel,
} from "@/app/pathforger/_types/journeyLedger";
import type { PathForgerChapterResult } from "@/app/pathforger/_types/pipeline";

type ActiveRunAction =
  | "name"
  | "premise"
  | "style"
  | "tone"
  | "pitch"
  | "chapter"
  | "nextChapter"
  | "pipeline"
  | "forgePath"
  | null;

type NextChapterLedgerPlaybackPhase = "idle" | "playing" | "completed";

type LedgerTransition = {
  chapterNumber: number;
  previousMarkdown: string;
  nextMarkdown: string;
};

type UsePathForgerNextChapterLedgerPlaybackArgs = {
  visibleChapter: PathForgerChapterResult | null;
  activeRunAction: ActiveRunAction;
  isRunning: boolean;
  onOpenChapterModal: () => void;
  lastForgedLedgerTransition: LedgerTransition | null;
  entryDurationMs?: number;
};

const defaultPlaybackViewModel: JourneyLedgerPlaybackViewModel = {
  active: false,
  waitingForChapter: false,
  chapterNumber: null,
  currentIndex: 0,
  total: 0,
  currentEntry: null,
  canGoPrevious: false,
  canGoNext: false,
  isLastEntry: false,
};

export function usePathForgerNextChapterLedgerPlayback(
  args: UsePathForgerNextChapterLedgerPlaybackArgs,
) {
  const {
    visibleChapter,
    activeRunAction,
    isRunning,
    onOpenChapterModal,
    lastForgedLedgerTransition,
    entryDurationMs = 10000,
  } = args;

  const [phase, setPhase] = React.useState<NextChapterLedgerPlaybackPhase>("idle");
  const [entries, setEntries] = React.useState<JourneyLedgerPlaybackEntry[]>([]);
  const [index, setIndex] = React.useState(0);
  const [targetChapter, setTargetChapter] = React.useState<number | null>(null);
  const playbackTimerRef = React.useRef<number | null>(null);
  const latestActiveRunActionRef = React.useRef<ActiveRunAction>(activeRunAction);
  const latestIsRunningRef = React.useRef(isRunning);

  const clearPlaybackTimer = React.useCallback(() => {
    if (playbackTimerRef.current === null) {
      return;
    }

    window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
  }, []);

  const resetPlayback = React.useCallback(() => {
    clearPlaybackTimer();
    setPhase("idle");
    setEntries([]);
    setIndex(0);
    setTargetChapter(null);
  }, [clearPlaybackTimer]);

  const beginNextChapterLedgerPlayback = React.useCallback(() => {
    if (!visibleChapter) {
      return false;
    }

    clearPlaybackTimer();
    const nextEntries =
      lastForgedLedgerTransition &&
      lastForgedLedgerTransition.chapterNumber === visibleChapter.chapterNumber
        ? buildJourneyLedgerPlaybackEntries({
            previousMarkdown: lastForgedLedgerTransition.previousMarkdown,
            nextMarkdown: lastForgedLedgerTransition.nextMarkdown,
          })
        : buildJourneyLedgerPlaybackEntries({
            previousMarkdown: "",
            nextMarkdown: visibleChapter.pathLedgerMarkdown,
          });

    setEntries(nextEntries);
    setIndex(0);
    setTargetChapter(visibleChapter.chapterNumber + 1);
    setPhase("playing");
    return true;
  }, [clearPlaybackTimer, lastForgedLedgerTransition, visibleChapter]);

  const moveToPreviousPlaybackEntry = React.useCallback(() => {
    setPhase("playing");
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const moveToNextPlaybackEntry = React.useCallback(() => {
    const totalEntries = entries.length;
    if (totalEntries === 0) {
      setPhase("completed");
      return;
    }

    setPhase("playing");
    setIndex((prev) => Math.min(totalEntries - 1, prev + 1));
  }, [entries.length]);

  const continueFromPlayback = React.useCallback(() => {
    setPhase("completed");
  }, []);

  React.useEffect(
    () => () => {
      if (playbackTimerRef.current !== null) {
        window.clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    },
    [],
  );

  React.useEffect(() => {
    latestActiveRunActionRef.current = activeRunAction;
    latestIsRunningRef.current = isRunning;
  }, [activeRunAction, isRunning]);

  React.useEffect(() => {
    if (!visibleChapter?.chapterMarkdown) {
      return;
    }

    if (phase !== "idle") {
      return;
    }

    onOpenChapterModal();
  }, [onOpenChapterModal, phase, visibleChapter?.chapterMarkdown]);

  React.useEffect(() => {
    clearPlaybackTimer();

    if (phase !== "playing") {
      return;
    }

    const totalEntries = entries.length;
    if (totalEntries === 0) {
      setPhase("completed");
      return;
    }

    playbackTimerRef.current = window.setTimeout(() => {
      setIndex((prev) => {
        if (prev >= totalEntries - 1) {
          setPhase("completed");
          return prev;
        }
        return prev + 1;
      });
      playbackTimerRef.current = null;
    }, entryDurationMs);

    return clearPlaybackTimer;
  }, [clearPlaybackTimer, entries.length, entryDurationMs, index, phase]);

  React.useEffect(() => {
    if (phase !== "completed") {
      return;
    }
    if (!visibleChapter || targetChapter === null) {
      return;
    }
    if (visibleChapter.chapterNumber !== targetChapter) {
      return;
    }
    if (activeRunAction === "nextChapter") {
      return;
    }

    resetPlayback();
    onOpenChapterModal();
  }, [activeRunAction, onOpenChapterModal, phase, resetPlayback, targetChapter, visibleChapter]);

  React.useEffect(() => {
    if (phase !== "completed") {
      return;
    }
    if (activeRunAction === "nextChapter" || isRunning) {
      return;
    }
    if (visibleChapter && targetChapter !== null) {
      if (visibleChapter.chapterNumber === targetChapter) {
        return;
      }
    }

    // Chapter generation ended without reaching the expected chapter:
    // clear playback state to avoid leaving the panel pinned.
    resetPlayback();
  }, [activeRunAction, isRunning, phase, resetPlayback, targetChapter, visibleChapter]);

  React.useEffect(() => {
    if (phase !== "playing") {
      return;
    }
    if (activeRunAction === "nextChapter" || isRunning) {
      return;
    }

    // Allow a short window for nextChapter state to flip to running before
    // deciding this run was abandoned.
    const abandonTimer = window.setTimeout(() => {
      if (latestActiveRunActionRef.current === "nextChapter" || latestIsRunningRef.current) {
        return;
      }
      resetPlayback();
    }, 500);

    return () => {
      window.clearTimeout(abandonTimer);
    };
  }, [activeRunAction, isRunning, phase, resetPlayback, targetChapter, visibleChapter]);

  const playbackViewModel: JourneyLedgerPlaybackViewModel = React.useMemo(() => {
    if (phase === "idle") {
      return defaultPlaybackViewModel;
    }

    const total = entries.length;
    const currentIndex = Math.max(0, Math.min(index, Math.max(total - 1, 0)));
    const isLastEntry = total > 0 && currentIndex >= total - 1;
    const chapterReady =
      Boolean(visibleChapter && targetChapter !== null) &&
      visibleChapter?.chapterNumber === targetChapter;
    const waitingForChapter =
      phase === "completed"
        ? !chapterReady || activeRunAction === "nextChapter" || isRunning
        : false;

    return {
      active: true,
      waitingForChapter,
      chapterNumber: targetChapter,
      currentIndex,
      total,
      currentEntry: entries[currentIndex] ?? null,
      canGoPrevious: total > 0 && currentIndex > 0,
      canGoNext: total > 0 && currentIndex < total - 1,
      isLastEntry,
    };
  }, [activeRunAction, entries, index, isRunning, phase, targetChapter, visibleChapter]);

  return {
    nextChapterLedgerPlayback: playbackViewModel,
    beginNextChapterLedgerPlayback,
    moveToPreviousPlaybackEntry,
    moveToNextPlaybackEntry,
    continueFromPlayback,
  };
}
