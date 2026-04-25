import * as React from "react";
import { useAudioManager } from "@/hooks/audio/useAudioManager";
import type { AudioMgr } from "@/types/audio/audio";
import { withBasePath } from "@/utils/basePath";

export function useGameAudio(): AudioMgr {
  const audios = React.useMemo<Record<string, HTMLAudioElement>>(() => {
    if (typeof Audio === "undefined") {
      return {};
    }

    const create = (src: string, loop = false) => {
      const audio = document.createElement("audio");
      audio.src = withBasePath(src);
      audio.preload = "auto";
      audio.loop = loop;
      return audio;
    };

    const base: Record<string, HTMLAudioElement> = {
      shoot: create("/audio/laser4.ogg"),
      hit: create("/audio/laser9.ogg"),
      bonus: create("/audio/powerUp8.ogg"),
      penalty: create("/audio/error_004.ogg"),
      skeleton: create("/audio/splash.ogg"),
      death: create("/audio/lowDown.ogg"),
      convert: create("/audio/zap1.ogg"),
      pop: create("/audio/glass_001.ogg"),
      tick: create("/audio/tick_002.ogg"),
      warning: create("/audio/warning.ogg"),
    };

    for (let i = 0; i <= 16; i += 1) {
      const key = `jingles_NES${i.toString().padStart(2, "0")}`;
      base[key] = create(`/audio/${key}.ogg`);
    }

    return base;
  }, []);

  return useAudioManager(audios);
}
