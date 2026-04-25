import * as React from "react";
import type { AudioMgr } from "@/types/audio/audio";

type AudioLike = HTMLAudioElement | React.RefObject<HTMLAudioElement | null> | null | undefined;

export type AudioMap = Record<string, AudioLike>;

function resolveAudioElement(audioLike: AudioLike): HTMLAudioElement | null {
  if (!audioLike) {
    return null;
  }
  if (typeof HTMLAudioElement !== "undefined" && audioLike instanceof HTMLAudioElement) {
    return audioLike;
  }
  if (typeof audioLike === "object" && "current" in audioLike) {
    return audioLike.current ?? null;
  }
  return null;
}

function safePlayAudio(audio: HTMLAudioElement): void {
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.warn("Audio playback failed:", error);
    });
  }
}

export function useAudioManager(audioMap: AudioMap): AudioMgr {
  const seqRef = React.useRef<{
    current?: HTMLAudioElement;
    handler?: () => void;
  }>({});

  const play = React.useCallback(
    (key: string, options?: { loop?: boolean; volume?: number }) => {
      const audio = resolveAudioElement(audioMap[key]);
      if (!audio) {
        return;
      }

      if (options?.loop !== undefined) {
        audio.loop = options.loop;
      }
      if (options?.volume !== undefined) {
        audio.volume = options.volume;
      }
      audio.currentTime = 0;
      safePlayAudio(audio);
    },
    [audioMap],
  );

  const pause = React.useCallback(
    (key: string) => {
      const audio = resolveAudioElement(audioMap[key]);
      if (!audio) {
        return;
      }
      audio.pause();
    },
    [audioMap],
  );

  const clearSequence = React.useCallback(() => {
    const seq = seqRef.current;
    if (seq.current && seq.handler) {
      seq.current.removeEventListener("ended", seq.handler);
    }
    seqRef.current = {};
  }, []);

  const pauseAll = React.useCallback(() => {
    Object.values(audioMap).forEach((audioLike) => {
      const audio = resolveAudioElement(audioLike);
      if (audio) {
        audio.pause();
      }
    });
    clearSequence();
  }, [audioMap, clearSequence]);

  const playSequence = React.useCallback(
    (keys: string[], options?: { loop?: boolean; volume?: number }) => {
      if (!keys.length) {
        return;
      }

      clearSequence();
      let index = 0;

      const playNext = () => {
        const key = keys[index];
        const audio = resolveAudioElement(audioMap[key]);
        if (!audio) {
          return;
        }

        if (options?.volume !== undefined) {
          audio.volume = options.volume;
        }
        audio.loop = false;
        audio.currentTime = 0;

        const handler = () => {
          audio.removeEventListener("ended", handler);
          index += 1;
          if (index >= keys.length) {
            if (options?.loop) {
              index = 0;
            } else {
              clearSequence();
              return;
            }
          }
          playNext();
        };

        seqRef.current = { current: audio, handler };
        audio.addEventListener("ended", handler);
        safePlayAudio(audio);
      };

      playNext();
    },
    [audioMap, clearSequence],
  );

  return React.useMemo(
    () => ({
      play,
      pause,
      pauseAll,
      playSequence,
    }),
    [pause, pauseAll, play, playSequence],
  );
}

export default useAudioManager;
