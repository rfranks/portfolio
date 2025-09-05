import { useRef } from "react";

/**
 * Provides a callback to compute frame timing information.
 * Returns { fps, scale } where `scale` is the ratio of the
 * actual frame duration to the target 60 FPS frame duration.
 */
export default function useFrameRate(targetFps = 60) {
  const lastTime = useRef<number | null>(null);
  const fpsRef = useRef(targetFps);
  const scaleRef = useRef(1);
  const frameMs = 1000 / targetFps;

  return (time: number) => {
    if (lastTime.current !== null) {
      const delta = time - lastTime.current;
      if (delta > 0) {
        fpsRef.current = 1000 / delta;
        scaleRef.current = delta / frameMs;
      }
    }
    lastTime.current = time;
    return { fps: fpsRef.current, scale: scaleRef.current };
  };
}
