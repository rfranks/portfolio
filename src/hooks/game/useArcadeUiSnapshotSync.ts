import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

type RefLike<TState> = {
  current: TState;
};

type UseArcadeUiSnapshotSyncParams<TState, TUI> = {
  stateRef: RefLike<TState>;
  setUI: Dispatch<SetStateAction<TUI>>;
  selectSnapshot: (state: TState) => TUI;
  isEqual?: (prev: TUI, next: TUI) => boolean;
};

export function useArcadeUiSnapshotSync<TState, TUI>({
  stateRef,
  setUI,
  selectSnapshot,
  isEqual,
}: UseArcadeUiSnapshotSyncParams<TState, TUI>) {
  return useCallback(() => {
    const nextSnapshot = selectSnapshot(stateRef.current);
    setUI((prevSnapshot) => {
      if (isEqual && isEqual(prevSnapshot, nextSnapshot)) {
        return prevSnapshot;
      }
      return nextSnapshot;
    });
  }, [stateRef, setUI, selectSnapshot, isEqual]);
}
