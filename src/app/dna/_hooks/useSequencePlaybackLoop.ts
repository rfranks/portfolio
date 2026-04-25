import { useCallback, useEffect, useRef, useState } from "react";

type SequencePlaybackLoopOptions = {
  sequenceLength?: number;
  bpRange?: number[] | null;
  onBpRangeUpdate: (nextBpRange: number[]) => void;
  stepBp?: number;
  tickMs?: number;
};

type SequencePlaybackLoopApi = {
  isPlaying: boolean;
  startPlayback: () => void;
  stopPlayback: () => void;
};

const DEFAULT_STEP_BP = 10;
const DEFAULT_TICK_MS = 80;

const clampBasePair = (value: number, sequenceLength: number): number =>
  Math.max(1, Math.min(sequenceLength, Math.floor(value)));

export const resolvePlaybackSeedMaxBasePair = (
  sequenceLength: number,
  bpRange: number[] | null | undefined,
  stepBp: number,
) => {
  const currentMax = bpRange?.[1] ?? 0;
  if (currentMax >= sequenceLength) {
    return clampBasePair(stepBp, sequenceLength);
  }
  if (currentMax <= 1) {
    return clampBasePair(stepBp, sequenceLength);
  }
  return clampBasePair(currentMax, sequenceLength);
};

export const resolvePlaybackTickMaxBasePair = (
  currentMaxBasePair: number,
  sequenceLength: number,
  stepBp: number,
): number => clampBasePair(currentMaxBasePair + stepBp, sequenceLength);

export function useSequencePlaybackLoop({
  sequenceLength = 0,
  bpRange,
  onBpRangeUpdate,
  stepBp = DEFAULT_STEP_BP,
  tickMs = DEFAULT_TICK_MS,
}: SequencePlaybackLoopOptions): SequencePlaybackLoopApi {
  const [isPlaying, setIsPlaying] = useState(false);
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const maxBasePairRef = useRef(1);

  useEffect(() => {
    if (sequenceLength < 1) {
      maxBasePairRef.current = 1;
      return;
    }
    maxBasePairRef.current = clampBasePair(bpRange?.[1] ?? 1, sequenceLength);
  }, [bpRange, sequenceLength]);

  useEffect(() => {
    if (sequenceLength > 0) {
      return;
    }
    setIsPlaying(false);
  }, [sequenceLength]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (sequenceLength < 1) {
      setIsPlaying(false);
      return;
    }

    const nextMaxBasePair = resolvePlaybackSeedMaxBasePair(sequenceLength, bpRange, stepBp);
    maxBasePairRef.current = nextMaxBasePair;
    onBpRangeUpdate([1, nextMaxBasePair]);
    setIsPlaying(sequenceLength > 1);
  }, [bpRange, onBpRangeUpdate, sequenceLength, stepBp]);

  useEffect(() => {
    if (!isPlaying || sequenceLength < 1) {
      return;
    }

    const tick = (timestamp: number) => {
      if (!isPlaying) {
        return;
      }
      if (lastTickRef.current === null) {
        lastTickRef.current = timestamp;
      }

      if (timestamp - lastTickRef.current >= tickMs) {
        lastTickRef.current = timestamp;
        const nextMaxBasePair = resolvePlaybackTickMaxBasePair(
          maxBasePairRef.current,
          sequenceLength,
          stepBp,
        );
        maxBasePairRef.current = nextMaxBasePair;
        onBpRangeUpdate([1, nextMaxBasePair]);

        if (nextMaxBasePair >= sequenceLength) {
          setIsPlaying(false);
          return;
        }
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTickRef.current = null;
    };
  }, [isPlaying, onBpRangeUpdate, sequenceLength, stepBp, tickMs]);

  return {
    isPlaying,
    startPlayback,
    stopPlayback,
  };
}
