import { useRef, type MutableRefObject } from "react";
import type { ClockState, ScaledTimeoutHandle } from "@/types/hooks/time";

const FRAME_MS = 1000 / 60;

export let clockRef: MutableRefObject<ClockState>;
export let setScaledTimeout: (
  cb: () => void,
  ms: number,
) => ScaledTimeoutHandle;
export let clearScaledTimeout: (handle: ScaledTimeoutHandle | null) => void;
export let advanceClock: (deltaMs: number) => void;

export default function useScaledClock() {
  const timeouts = useRef<ScaledTimeoutHandle[]>([]);
  clockRef = useRef<ClockState>({ deltaMs: FRAME_MS, scale: 1 });

  setScaledTimeout = (cb: () => void, ms: number) => {
    const handle: ScaledTimeoutHandle = { remaining: ms, cb, cancelled: false };
    timeouts.current.push(handle);
    return handle;
  };

  clearScaledTimeout = (handle: ScaledTimeoutHandle | null) => {
    if (handle) {
      handle.cancelled = true;
    }
  };

  advanceClock = (deltaMs: number) => {
    const scale = deltaMs / FRAME_MS;
    clockRef.current = { deltaMs, scale };

    for (let i = timeouts.current.length - 1; i >= 0; i--) {
      const t = timeouts.current[i];
      if (t.cancelled) {
        timeouts.current.splice(i, 1);
        continue;
      }
      t.remaining -= deltaMs;
      if (t.remaining <= 0) {
        t.cb();
        timeouts.current.splice(i, 1);
      }
    }
  };
}
