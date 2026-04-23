export type EnginePoint2D = {
  x: number;
  y: number;
};

export type EngineCircle2D = EnginePoint2D & {
  radius: number;
};

export type EngineRect2D = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ManagedHandleRef<THandle> = {
  current: THandle | null;
};

export type EngineFrameTick = {
  now: number;
  deltaMs: number;
};
