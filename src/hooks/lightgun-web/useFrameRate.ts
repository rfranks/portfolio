import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Provides a callback to compute frame timing information.
 * Returns { fps, scale } where `scale` is the ratio of the
 * actual frame duration to the target 60 FPS frame duration.
 */
export let fpsRef: MutableRefObject<number>;
export let scaleRef: MutableRefObject<number>;

export default function useFrameRate(targetFps = 60, intervalMs = 500) {
  const lastTime = useRef<number | null>(null);
  const deltaSum = useRef(0);
  const frameCount = useRef(0);
  fpsRef = useRef(targetFps);
  scaleRef = useRef(1);
  const frameMs = 1000 / targetFps;

  useEffect(() => {
    const id = setInterval(() => {
      if (frameCount.current > 0) {
        const avgDelta = deltaSum.current / frameCount.current;
        fpsRef.current = 1000 / avgDelta;
        scaleRef.current = avgDelta / frameMs;
        deltaSum.current = 0;
        frameCount.current = 0;
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, frameMs]);

  return (time: number) => {
    if (lastTime.current !== null) {
      const delta = time - lastTime.current;
      if (delta > 0) {
        deltaSum.current += delta;
        frameCount.current += 1;
      }
    }
    lastTime.current = time;
  };
}
