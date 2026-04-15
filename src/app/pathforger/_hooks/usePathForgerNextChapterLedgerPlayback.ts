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
  | "pitch"
  | "chapter"
  | "nextChapter"
  | "pipeline"
  | "forgePath"
  | null;

type NextChapterLedgerPlaybackPhase =
  | "idle"
  | "playing"
  | "completed";

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
    entryDurationMs = 5000,
  } = args;

  const [phase, setPhase] =
    React.useState<NextChapterLedgerPlaybackPhase>("idle");
  const [entries, setEntries] = React.useState<JourneyLedgerPlaybackEntry[]>(
    [],
  );
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
  }, [
    activeRunAction,
    onOpenChapterModal,
    phase,
    resetPlayback,
    targetChapter,
    visibleChapter,
  ]);

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
  }, [
    activeRunAction,
    isRunning,
    phase,
    resetPlayback,
    targetChapter,
    visibleChapter,
  ]);

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
      if (
        latestActiveRunActionRef.current === "nextChapter" ||
        latestIsRunningRef.current
      ) {
        return;
      }
      resetPlayback();
    }, 500);

    return () => {
      window.clearTimeout(abandonTimer);
    };
  }, [
    activeRunAction,
    isRunning,
    phase,
    resetPlayback,
    targetChapter,
    visibleChapter,
  ]);

  const playbackViewModel: JourneyLedgerPlaybackViewModel = React.useMemo(() => {
    if (phase === "idle") {
      return defaultPlaybackViewModel;
    }

    return {
      active: true,
      waitingForChapter: false,
      chapterNumber: targetChapter,
      currentIndex: index,
      total: entries.length,
      currentEntry: entries[index] ?? null,
    };
  }, [entries, index, phase, targetChapter]);

  return {
    nextChapterLedgerPlayback: playbackViewModel,
    beginNextChapterLedgerPlayback,
  };
}
