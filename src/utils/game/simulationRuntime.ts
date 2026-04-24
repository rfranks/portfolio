import type { EngineFrameTick, ManagedHandleRef } from "@/types/game/engine2d";
import {
  cancelAnimationFrameRef,
  clearManagedTimeout,
  scheduleManagedSpawner,
  scheduleManagedTimeout,
  startManagedAnimationLoop,
} from "@/utils/game/engine2d";

type TimeoutSetFn<THandle> = (callback: () => void, delayMs: number) => THandle;
type TimeoutClearFn<THandle> = (handle: THandle) => void;

export type GameSimulationRuntime<TTimeoutHandle> = {
  startLoop: (onFrame: (tick: EngineFrameTick) => void, getNow?: () => number) => () => void;
  stopLoop: () => void;
  scheduleTimeout: (params: {
    handleRef: ManagedHandleRef<TTimeoutHandle>;
    callback: () => void;
    delayMs: number;
  }) => TTimeoutHandle;
  clearTimeout: (handleRef: ManagedHandleRef<TTimeoutHandle>) => void;
  scheduleSpawner: (params: {
    handleRef: ManagedHandleRef<TTimeoutHandle>;
    spawn: () => void;
    getDelayMs: () => number;
    shouldContinue?: () => boolean;
  }) => void;
};

export function createGameSimulationRuntime<TTimeoutHandle>(params: {
  frameRef: ManagedHandleRef<number>;
  setTimeoutFn: TimeoutSetFn<TTimeoutHandle>;
  clearTimeoutFn: TimeoutClearFn<TTimeoutHandle>;
}): GameSimulationRuntime<TTimeoutHandle> {
  return {
    startLoop: (onFrame, getNow) =>
      startManagedAnimationLoop({
        frameRef: params.frameRef,
        onFrame,
        getNow,
      }),
    stopLoop: () => {
      cancelAnimationFrameRef(params.frameRef);
    },
    scheduleTimeout: ({ handleRef, callback, delayMs }) =>
      scheduleManagedTimeout({
        handleRef,
        callback,
        delayMs,
        setTimeoutFn: params.setTimeoutFn,
        clearTimeoutFn: params.clearTimeoutFn,
      }),
    clearTimeout: (handleRef) => {
      clearManagedTimeout(handleRef, params.clearTimeoutFn);
    },
    scheduleSpawner: ({ handleRef, spawn, getDelayMs, shouldContinue }) =>
      scheduleManagedSpawner({
        handleRef,
        spawn,
        getDelayMs,
        shouldContinue,
        setTimeoutFn: params.setTimeoutFn,
        clearTimeoutFn: params.clearTimeoutFn,
      }),
  };
}
