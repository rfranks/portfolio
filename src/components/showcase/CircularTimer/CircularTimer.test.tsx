// src/components/showcase/CircularTimer/CircularTimer.test.tsx
import React from "react";
import { render, screen, act, cleanup } from "@testing-library/react";
import CircularTimer from "../CircularTimer";

describe("<CircularTimer />", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    cleanup();
  });

  it("renders a progressbar with initial label '0 s'", () => {
    render(<CircularTimer />);
    // should show a progressbar role
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toBeInTheDocument();

    // label should be "0 s"
    expect(screen.getByText("0 s")).toBeInTheDocument();
  });

  it("renders the CircularProgress as indeterminate", () => {
    render(<CircularTimer />);
    const progressbar = screen.getByRole("progressbar");
    // MUI applies the "-indeterminate" class on the root element
    expect(progressbar).toHaveClass("MuiCircularProgress-indeterminate");
  });

  it("increments the label every second", () => {
    render(<CircularTimer />);
    expect(screen.getByText("0 s")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("1 s")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText("3 s")).toBeInTheDocument();
  });

  it("clears its interval on unmount", () => {
    const clearSpy = jest.spyOn(global, "clearInterval");
    const { unmount } = render(<CircularTimer />);

    // advance once to update the label before unmounting
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    const label = screen.getByText("1 s");

    // we expect one timer was created; now unmount should clear it
    unmount();
    expect(clearSpy).toHaveBeenCalledTimes(1);

    // advancing timers after unmount should not trigger clearInterval again
    // or cause the label to update
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(label.textContent).toBe("1 s");

    clearSpy.mockRestore();
  });
});
