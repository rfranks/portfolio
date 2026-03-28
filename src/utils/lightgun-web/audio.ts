import { RefObject } from "react";

/**
 * Pause an audio element referenced by a React ref. If the ref or element is
 * missing the call is safely ignored.
 */

export const pauseAudio = (audioRef?: RefObject<HTMLAudioElement | null>) => {
  if (!audioRef || !audioRef.current) return;
  audioRef.current.pause();
};

/**
 * Reset an audio element to the beginning and play it. Optionally replaces the
 * audio source, automatically converting unsupported extensions to `.mp3`
 * before loading.
 *
 * @param audioRef React ref to the audio element.
 * @param srcOrOptions Either the path to a new audio file that replaces the
 * current audio source (unsupported extensions are converted to `.mp3`) or an
 * object with playback options (`loop` to repeat, `volume` 0-1).
 * @param maybeOptions Playback options (`loop`, `volume`) applied when a source
 * path is provided as the second argument.
 */
export const rewindAndPlayAudio = (
  audioRef?: RefObject<HTMLAudioElement | null>,
  srcOrOptions?: string | { loop?: boolean; volume?: number },
  maybeOptions: { loop?: boolean; volume?: number } = {}
) => {
  if (!audioRef || !audioRef.current) return;

  let src: string | undefined;
  let options: { loop?: boolean; volume?: number };

  if (typeof srcOrOptions === "string") {
    src = srcOrOptions;
    options = maybeOptions;
  } else {
    options = srcOrOptions || {};
  }

  if (src) {
    const ext = src.split(".").pop()?.toLowerCase() ?? "";
    const mime = ext === "mp3" ? "audio/mpeg" : `audio/${ext}`;

    if (
      audioRef.current.canPlayType &&
      audioRef.current.canPlayType(mime) === "" &&
      ext !== "mp3" &&
      audioRef.current.canPlayType("audio/mpeg") !== ""
    ) {
      src = src.replace(/\.[^/.]+$/, ".mp3");
    }

    audioRef.current.src = src;
    if (audioRef.current.load) {
      audioRef.current.load();
    }
  }

  if (options.loop) {
    audioRef.current.loop = true;
  } else {
    audioRef.current.loop = false;
  }
  if (options.volume !== undefined) {
    audioRef.current.volume = options.volume;
  } else {
    audioRef.current.volume = 1.0; // Default volume
  }
  // Rewind to start
  audioRef.current.currentTime = 0;
  // Play the audio
  const playPromise = audioRef.current.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error: unknown) => {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }
      console.warn("Audio playback failed:", error);
    });
  }
};
