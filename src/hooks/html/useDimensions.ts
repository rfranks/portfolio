import React, { useState, useEffect } from "react";
import type { Dimensions } from "@/types/hooks/dimensions";

// MUI components
import { Breakpoint, useTheme } from "@mui/material/styles";

// utils
import debounce from "lodash/debounce";
import type { DebouncedFunc } from "lodash";

/**
 * Hook for getting the current dimensions—height, width and breakpoint—of
 * the element having the provided `ref`. The hook safely handles a `null`
 * reference.
 *
 * Used for controlling the content of a component
 * based on its current dimensions.
 *
 * @param {React.RefObject<HTMLElement> | null} ref the ref to the element to measure
 * @returns the dimensions of the element, including the breakpoint
 */
export function useDimensions(
  ref: React.RefObject<HTMLElement> | null,
): Dimensions {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    breakpoint: "xs" as Breakpoint,
  });

  const theme = useTheme();

  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }

    const getDimensions = (): Dimensions => {
      const dimensions = {
        width: ref.current?.offsetWidth || 0,
        height: ref.current?.offsetHeight || 0,
        breakpoint: "xs" as Breakpoint,
      };

      // calculate the breakpoint based on the theme's breakpoints and the width of the component
      if (dimensions.width < theme.breakpoints.values["sm"]) {
        dimensions.breakpoint = "xs";
      } else if (dimensions.width < theme.breakpoints.values["md"]) {
        dimensions.breakpoint = "sm";
      } else if (dimensions.width < theme.breakpoints.values["lg"]) {
        dimensions.breakpoint = "md";
      } else if (dimensions.width < theme.breakpoints.values["xl"]) {
        dimensions.breakpoint = "lg";
      } else {
        dimensions.breakpoint = "xl";
      }

      return dimensions;
    };

    const handleResize: DebouncedFunc<() => void> = debounce(() => {
      // updates the dimensions of the element on resize
      setDimensions(getDimensions());
    }, 100);

    let interval: ReturnType<typeof setInterval> | null = null;

    const dimensions = getDimensions();
    setDimensions(dimensions);

    if (dimensions.height === 0 || dimensions.width === 0) {
      // if the element is not visible, or has not rendered content yet,
      // we need to wait for the element to become visible or render content
      // before we can get the dimensions
      interval = setInterval(() => {
        if (
          ref.current &&
          ref.current.offsetHeight > 0 &&
          ref.current.offsetWidth > 0
        ) {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          handleResize();
        }
      }, 15);
    }

    // update the dimensions on window resize
    window.addEventListener("resize", handleResize);

    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
      handleResize();
    }, 150);

    return () => {
      // remove the event listener during cleanup
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
      handleResize.cancel();
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [ref, theme?.breakpoints?.values]);

  return dimensions;
}
