import type {
  EngineCircle2D,
  EngineFrameTick,
  EnginePoint2D,
  EngineRect2D,
  ManagedHandleRef,
} from "@/types/game/engine2d";

export function pointInRect(point: EnginePoint2D, rect: EngineRect2D): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function pointInCircle(point: EnginePoint2D, circle: EngineCircle2D): boolean {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export function rectsOverlap(a: EngineRect2D, b: EngineRect2D): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export function circlesOverlap(a: EngineCircle2D, b: EngineCircle2D): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy <= r * r;
}

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  return items[Math.floor(Math.random() * items.length)];
}

export function findTopmostHitIndex<T>(
  items: readonly T[],
  hitTest: (item: T, index: number) => boolean,
): number {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (hitTest(items[i], i)) {
      return i;
    }
  }
  return -1;
}

export function mapClientPointToWorld(params: {
  clientX: number;
  clientY: number;
  bounds: { left: number; top: number; width: number; height: number };
  worldWidth: number;
  worldHeight: number;
}): EnginePoint2D {
  const x = ((params.clientX - params.bounds.left) / params.bounds.width) * params.worldWidth;
  const y = ((params.clientY - params.bounds.top) / params.bounds.height) * params.worldHeight;
  return { x, y };
}

export function scheduleAnimationFrame(
  frameRef: ManagedHandleRef<number>,
  callback: FrameRequestCallback,
): number {
  const id = requestAnimationFrame(callback);
  frameRef.current = id;
  return id;
}

export function cancelAnimationFrameRef(frameRef: ManagedHandleRef<number>): void {
  if (frameRef.current === null) {
    return;
  }

  cancelAnimationFrame(frameRef.current);
  frameRef.current = null;
}

export function startManagedAnimationLoop(params: {
  frameRef: ManagedHandleRef<number>;
  onFrame: (tick: EngineFrameTick) => void;
  getNow?: () => number;
}): () => void {
  const nowFn = params.getNow ?? (() => performance.now());
  cancelAnimationFrameRef(params.frameRef);
  let lastNow = nowFn();

  const run = (now: number) => {
    const deltaMs = Math.max(0, now - lastNow);
    lastNow = now;
    params.onFrame({ now, deltaMs });
    scheduleAnimationFrame(params.frameRef, run);
  };

  scheduleAnimationFrame(params.frameRef, run);
  return () => cancelAnimationFrameRef(params.frameRef);
}

export function scheduleManagedTimeout<THandle>(params: {
  handleRef: ManagedHandleRef<THandle>;
  callback: () => void;
  delayMs: number;
  setTimeoutFn: (callback: () => void, delayMs: number) => THandle;
  clearTimeoutFn: (handle: THandle) => void;
}): THandle {
  clearManagedTimeout(params.handleRef, params.clearTimeoutFn);
  const handle = params.setTimeoutFn(params.callback, params.delayMs);
  params.handleRef.current = handle;
  return handle;
}

export function scheduleManagedSpawner<THandle>(params: {
  handleRef: ManagedHandleRef<THandle>;
  spawn: () => void;
  getDelayMs: () => number;
  shouldContinue?: () => boolean;
  setTimeoutFn: (callback: () => void, delayMs: number) => THandle;
  clearTimeoutFn: (handle: THandle) => void;
}): void {
  const scheduleNext = () => {
    if (params.shouldContinue && !params.shouldContinue()) {
      clearManagedTimeout(params.handleRef, params.clearTimeoutFn);
      return;
    }

    scheduleManagedTimeout({
      handleRef: params.handleRef,
      callback: () => {
        if (params.shouldContinue && !params.shouldContinue()) {
          clearManagedTimeout(params.handleRef, params.clearTimeoutFn);
          return;
        }
        params.spawn();
        scheduleNext();
      },
      delayMs: params.getDelayMs(),
      setTimeoutFn: params.setTimeoutFn,
      clearTimeoutFn: params.clearTimeoutFn,
    });
  };

  scheduleNext();
}

export function clearManagedTimeout<THandle>(
  handleRef: ManagedHandleRef<THandle>,
  clearTimeoutFn: (handle: THandle) => void,
): void {
  if (handleRef.current === null) {
    return;
  }

  clearTimeoutFn(handleRef.current);
  handleRef.current = null;
}
