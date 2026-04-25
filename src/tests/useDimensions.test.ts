import React from "react";

jest.mock("@mui/material/styles", () => ({
  useTheme: () => ({
    breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  }),
}));

import { useDimensions } from "@/hooks/html/useDimensions";

jest.useFakeTimers();

type DimensionsState = {
  width: number;
  height: number;
  breakpoint: string;
};

const isDimensionsState = (value: unknown): value is DimensionsState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<DimensionsState>;
  return (
    typeof candidate.width === "number" &&
    typeof candidate.height === "number" &&
    typeof candidate.breakpoint === "string"
  );
};

const mockDimensionsUseState = (setSpy: jest.Mock) => {
  const originalUseState = React.useState as unknown as (
    init?: unknown,
  ) => [unknown, React.Dispatch<unknown>];
  const setState = setSpy as unknown as React.Dispatch<unknown>;

  jest.spyOn(React, "useState").mockImplementation((init?: unknown) => {
    const resolvedInit = typeof init === "function" ? (init as () => unknown)() : init;
    if (isDimensionsState(resolvedInit)) {
      return [resolvedInit, setState];
    }
    return originalUseState(init);
  });
};

describe("useDimensions cleanup", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  test("pending resize callbacks are cancelled on unmount", () => {
    const listeners: Record<string, () => void> = {};
    const addEventListener = jest.fn((event: string, handler: () => void) => {
      listeners[event] = handler;
    });
    const removeEventListener = jest.fn((event: string, handler: () => void) => {
      if (listeners[event] === handler) {
        delete listeners[event];
      }
    });
    const g = globalThis as unknown as {
      window: {
        addEventListener: typeof addEventListener;
        removeEventListener: typeof removeEventListener;
      };
    };
    g.window = { addEventListener, removeEventListener };

    const ref = {
      current: { offsetWidth: 100, offsetHeight: 100 },
    } as React.RefObject<HTMLElement>;

    const setSpy = jest.fn();
    mockDimensionsUseState(setSpy);

    let cleanup: (() => void) | undefined;
    jest.spyOn(React, "useEffect").mockImplementation((effect: () => void | (() => void)) => {
      cleanup = effect() as () => void;
    });

    // mount
    useDimensions(ref);
    setSpy.mockClear();

    // trigger resize before unmount to schedule debounced callback
    listeners["resize"]?.();

    // unmount
    cleanup?.();

    // advance timers to where debounced callback would normally run
    jest.advanceTimersByTime(100);

    expect(setSpy).not.toHaveBeenCalled();
    expect(removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});

describe("useDimensions resize updates", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("updates state when dimensions change", () => {
    const listeners: Record<string, () => void> = {};
    const addEventListener = jest.fn((event: string, handler: () => void) => {
      listeners[event] = handler;
    });
    const removeEventListener = jest.fn();
    const g = globalThis as unknown as {
      window: {
        addEventListener: typeof addEventListener;
        removeEventListener: typeof removeEventListener;
      };
    };
    g.window = { addEventListener, removeEventListener };

    const ref = {
      current: { offsetWidth: 100, offsetHeight: 100 },
    } as React.RefObject<HTMLElement>;

    const setSpy = jest.fn();
    mockDimensionsUseState(setSpy);

    jest.spyOn(React, "useEffect").mockImplementation((effect: () => void | (() => void)) => {
      effect();
    });

    useDimensions(ref);
    setSpy.mockClear();

    (ref.current as unknown as { offsetWidth: number; offsetHeight: number }).offsetWidth = 200;
    (ref.current as unknown as { offsetWidth: number; offsetHeight: number }).offsetHeight = 150;

    listeners["resize"]?.();
    jest.advanceTimersByTime(100);

    expect(setSpy).toHaveBeenCalledWith(expect.objectContaining({ width: 200, height: 150 }));
  });
});

describe("useDimensions breakpoints", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    { width: 599, expected: "xs" },
    { width: 600, expected: "sm" },
    { width: 900, expected: "md" },
    { width: 1200, expected: "lg" },
    { width: 1536, expected: "xl" },
  ])("width $width => breakpoint $expected", ({ width, expected }) => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    const g = globalThis as unknown as {
      window: {
        addEventListener: typeof addEventListener;
        removeEventListener: typeof removeEventListener;
      };
    };
    g.window = { addEventListener, removeEventListener };

    const ref = {
      current: { offsetWidth: width, offsetHeight: 100 },
    } as React.RefObject<HTMLElement>;

    const setSpy = jest.fn();
    mockDimensionsUseState(setSpy);

    jest.spyOn(React, "useEffect").mockImplementation((effect: () => void | (() => void)) => {
      effect();
    });

    useDimensions(ref);

    expect(setSpy).toHaveBeenCalledWith(expect.objectContaining({ breakpoint: expected }));
  });
});

describe("useDimensions with null ref", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns default dimensions without attaching listeners", () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    const g = globalThis as unknown as {
      window: {
        addEventListener: typeof addEventListener;
        removeEventListener: typeof removeEventListener;
      };
    };
    g.window = { addEventListener, removeEventListener };
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");

    const setSpy = jest.fn();
    mockDimensionsUseState(setSpy);

    jest.spyOn(React, "useEffect").mockImplementation((effect: () => void) => {
      effect();
    });

    const dimensions = useDimensions(null);

    expect(dimensions).toEqual({ width: 0, height: 0, breakpoint: "xs" });
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });
});

describe("useDimensions visibility polling", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("clears interval once element becomes visible", () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    const g = globalThis as unknown as {
      window: {
        addEventListener: typeof addEventListener;
        removeEventListener: typeof removeEventListener;
      };
    };
    g.window = { addEventListener, removeEventListener };

    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    const ref = {
      current: { offsetWidth: 0, offsetHeight: 0 },
    } as React.RefObject<HTMLElement>;

    const setSpy = jest.fn();
    mockDimensionsUseState(setSpy);

    jest.spyOn(React, "useEffect").mockImplementation((effect: () => void | (() => void)) => {
      effect();
    });

    useDimensions(ref);

    (ref.current as unknown as { offsetWidth: number; offsetHeight: number }).offsetWidth = 100;
    (ref.current as unknown as { offsetWidth: number; offsetHeight: number }).offsetHeight = 100;

    jest.advanceTimersByTime(20);
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });
});
