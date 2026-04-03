export interface ScaledTimeoutHandle {
  remaining: number;
  cb: () => void;
  cancelled: boolean;
}

export interface ClockState {
  deltaMs: number;
  scale: number;
}
