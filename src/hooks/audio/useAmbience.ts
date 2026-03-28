import * as React from "react";
import { useAudio } from "@/hooks/audio/useAudio";
import { pauseAudio, rewindAndPlayAudio } from "@/utils/lightgun-web/audio";

type UseAmbienceOptions = {
  minDelayMs?: number;
  maxDelayMs?: number;
  minVolume?: number;
  maxVolume?: number;
};

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function useAmbience(
  urls: readonly string[],
  {
    minDelayMs = 1200,
    maxDelayMs = 3200,
    minVolume = 0.04,
    maxVolume = 0.12,
  }: UseAmbienceOptions = {},
) {
  // The caller should supply a stable, fixed-length list so hook order remains stable.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const audioRefs = urls.map((url) => useAudio(url));
  const audioRefsRef = React.useRef(audioRefs);
  const [enabled, setEnabled] = React.useState(true);
  const [started, setStarted] = React.useState(false);
  const enabledRef = React.useRef(true);
  const runningRef = React.useRef(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    audioRefsRef.current = audioRefs;
  }, [audioRefs]);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const playRandomClip = React.useCallback(() => {
    if (audioRefsRef.current.length === 0) return;
    const audioRef =
      audioRefsRef.current[Math.floor(Math.random() * audioRefsRef.current.length)];
    rewindAndPlayAudio(audioRef, {
      volume: randomInRange(minVolume, maxVolume),
    });
  }, [maxVolume, minVolume]);

  const scheduleNext = React.useCallback(() => {
    if (!runningRef.current || !enabledRef.current) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      if (!runningRef.current || !enabledRef.current) return;
      playRandomClip();
      scheduleNext();
    }, randomInRange(minDelayMs, maxDelayMs));
  }, [clearTimer, maxDelayMs, minDelayMs, playRandomClip]);

  const start = React.useCallback(() => {
    enabledRef.current = true;
    setEnabled(true);
    if (runningRef.current) return;
    runningRef.current = true;
    setStarted(true);
    playRandomClip();
    scheduleNext();
  }, [playRandomClip, scheduleNext]);

  const stop = React.useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
    runningRef.current = false;
    clearTimer();
    audioRefsRef.current.forEach((audioRef) => pauseAudio(audioRef));
  }, [clearTimer]);

  const toggle = React.useCallback(() => {
    if (enabledRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  React.useEffect(() => {
    return () => {
      enabledRef.current = false;
      runningRef.current = false;
      clearTimer();
      audioRefsRef.current.forEach((audioRef) => pauseAudio(audioRef));
    };
  }, [clearTimer]);

  return { enabled, started, start, stop, toggle };
}
