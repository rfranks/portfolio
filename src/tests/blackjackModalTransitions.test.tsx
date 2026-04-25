import { act, renderHook } from "@testing-library/react";
import { useBlackjackModalTransitions } from "@/app/blackjack/_hooks/useBlackjackModalTransitions";
import { useModalTransitionMachine } from "@/app/blackjack/_hooks/useModalTransitionMachine";

describe("useModalTransitionMachine", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("transitions from open to closing to closed with exit timing", () => {
    const { result } = renderHook(() =>
      useModalTransitionMachine({
        exitAnimationMs: 280,
      }),
    );

    expect(result.current.phase).toBe("closed");
    expect(result.current.isVisible).toBe(false);

    act(() => {
      result.current.open();
    });
    expect(result.current.phase).toBe("open");
    expect(result.current.isClosing).toBe(false);
    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.phase).toBe("closing");
    expect(result.current.isClosing).toBe(true);
    expect(result.current.isVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(279);
    });
    expect(result.current.phase).toBe("closing");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.phase).toBe("closed");
    expect(result.current.isVisible).toBe(false);
  });

  it("cancels the close timer when the modal reopens while closing", () => {
    const { result } = renderHook(() =>
      useModalTransitionMachine({
        exitAnimationMs: 280,
      }),
    );

    act(() => {
      result.current.open();
      result.current.close();
    });
    expect(result.current.phase).toBe("closing");

    act(() => {
      jest.advanceTimersByTime(120);
      result.current.open();
    });
    expect(result.current.phase).toBe("open");
    expect(result.current.isClosing).toBe(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current.phase).toBe("open");
    expect(result.current.isVisible).toBe(true);
  });

  it("auto-closes and blocks opens while disabled", () => {
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useModalTransitionMachine({
          enabled,
          exitAnimationMs: 140,
        }),
      {
        initialProps: { enabled: true },
      },
    );

    act(() => {
      result.current.open();
    });
    expect(result.current.phase).toBe("open");

    act(() => {
      rerender({ enabled: false });
    });
    expect(result.current.phase).toBe("closing");

    act(() => {
      jest.advanceTimersByTime(140);
    });
    expect(result.current.phase).toBe("closed");

    act(() => {
      result.current.open();
    });
    expect(result.current.phase).toBe("closed");
  });
});

describe("useBlackjackModalTransitions", () => {
  it("gates modal rendering by feature availability rules", () => {
    const { result, rerender } = renderHook(
      ({
        hasEngineState,
        hasHintText,
        hasRoundTimelineEntries,
      }: {
        hasEngineState: boolean;
        hasHintText: boolean;
        hasRoundTimelineEntries: boolean;
      }) =>
        useBlackjackModalTransitions({
          hasEngineState,
          hasHintText,
          hasRoundTimelineEntries,
        }),
      {
        initialProps: {
          hasEngineState: false,
          hasHintText: false,
          hasRoundTimelineEntries: false,
        },
      },
    );

    act(() => {
      result.current.analyticsModal.open();
      result.current.hintModal.open();
      result.current.roundDetailsModal.open();
      result.current.gameModeModal.open();
    });

    expect(result.current.analyticsModal.shouldRender).toBe(true);
    expect(result.current.hintModal.shouldRender).toBe(false);
    expect(result.current.roundDetailsModal.shouldRender).toBe(false);
    expect(result.current.gameModeModal.shouldRender).toBe(false);

    act(() => {
      rerender({
        hasEngineState: true,
        hasHintText: true,
        hasRoundTimelineEntries: true,
      });
    });

    act(() => {
      result.current.hintModal.open();
      result.current.roundDetailsModal.open();
      result.current.gameModeModal.open();
    });

    expect(result.current.hintModal.shouldRender).toBe(true);
    expect(result.current.roundDetailsModal.shouldRender).toBe(true);
    expect(result.current.gameModeModal.shouldRender).toBe(true);
  });
});
