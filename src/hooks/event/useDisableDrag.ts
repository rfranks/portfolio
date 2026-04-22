"use client";

import { useEffect } from "react";

/**
 * Prevents default drag behavior on images and other elements.
 * Useful for lightgun setups where the pointer should never initiate a drag
 * operation (e.g. Sinden lightgun).
 */
export function useDisableDrag() {
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener("dragstart", handleDragStart);
    return () => {
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);
}

export default useDisableDrag;
