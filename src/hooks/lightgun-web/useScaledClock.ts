import { useEffect, useRef, type MutableRefObject } from "react";

const FRAME_MS = 1000 / 60;

interface TimeoutHandle {
  remaining: number;
  cb: () => void;
  cancelled: boolean;
}

export interface ClockState {
  deltaMs: number;
  scale: number;
}

export let clockRef: MutableRefObject<ClockState>;
export let setScaledTimeout: (
  cb: () => void,
  ms: number
) => TimeoutHandle;
export let clearScaledTimeout: (handle: TimeoutHandle | null) => void;

export type ScaledTimeoutHandle = TimeoutHandle;

export default function useScaledClock() {
  const last = useRef<number | null>(null);
  const timeouts = useRef<TimeoutHandle[]>([]);
  clockRef = useRef<ClockState>({ deltaMs: FRAME_MS, scale: 1 });

  setScaledTimeout = (cb: () => void, ms: number) => {
    const handle: TimeoutHandle = { remaining: ms, cb, cancelled: false };
    timeouts.current.push(handle);
    return handle;
  };

  clearScaledTimeout = (handle: TimeoutHandle | null) => {
    if (handle) {
      handle.cancelled = true;
    }
  };

  useEffect(() => {
    let running = true;
    const loop = (time: number) => {
      if (!running) return;
      if (last.current === null) last.current = time;
      const delta = time - last.current!;
      last.current = time;
      const scale = delta / FRAME_MS;
      clockRef.current = { deltaMs: delta, scale };

      for (let i = timeouts.current.length - 1; i >= 0; i--) {
        const t = timeouts.current[i];
        if (t.cancelled) {
          timeouts.current.splice(i, 1);
          continue;
        }
        t.remaining -= delta;
        if (t.remaining <= 0) {
          t.cb();
          timeouts.current.splice(i, 1);
        }
      }

      requestAnimationFrame(loop);
    };
    const id = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(id);
    };
  }, []);
}

