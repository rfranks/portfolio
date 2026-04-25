import { useCallback, useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type mermaidType from "mermaid";

type UseMermaidScaleSyncRedrawArgs = {
  diagramCode: string;
  diagramRef: MutableRefObject<HTMLElement | null>;
  isHydrated: boolean;
  isVisible: boolean;
  mermaidModuleRef: MutableRefObject<typeof mermaidType | null>;
  scale: number;
  showingText: boolean;
  syntax: string;
};

type UseMermaidScaleSyncRedrawResult = {
  markMermaidRenderComplete: (scaleAtRender: number) => void;
};

export function useMermaidScaleSyncRedraw({
  diagramCode,
  diagramRef,
  isHydrated,
  isVisible,
  mermaidModuleRef,
  scale,
  showingText,
  syntax,
}: UseMermaidScaleSyncRedrawArgs): UseMermaidScaleSyncRedrawResult {
  const mermaidZoomRedrawTimeoutRef = useRef<number | null>(null);
  const lastScaleForMermaidRedrawRef = useRef<number | null>(null);
  const hasCompletedInitialMermaidRenderRef = useRef(false);

  const markMermaidRenderComplete = useCallback((scaleAtRender: number) => {
    hasCompletedInitialMermaidRenderRef.current = true;
    lastScaleForMermaidRedrawRef.current = scaleAtRender;
  }, []);

  const rerenderMermaidForScaleSync = useCallback(async () => {
    if (!isHydrated || syntax !== "mermaid" || showingText || !isVisible) {
      return;
    }

    const diagramNode = diagramRef.current;
    const mermaid = mermaidModuleRef.current;
    if (!diagramNode || !mermaid) {
      return;
    }

    diagramNode.removeAttribute("data-processed");
    diagramNode.innerHTML = diagramCode;

    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {},
    });

    await mermaid.run({
      nodes: [diagramNode],
      querySelector: ".diagram-mermaid",
    });
  }, [diagramCode, diagramRef, isHydrated, isVisible, mermaidModuleRef, showingText, syntax]);

  useEffect(() => {
    if (
      !isHydrated ||
      syntax !== "mermaid" ||
      showingText ||
      !isVisible ||
      !hasCompletedInitialMermaidRenderRef.current
    ) {
      return;
    }

    const previousScale = lastScaleForMermaidRedrawRef.current;
    if (previousScale === null) {
      lastScaleForMermaidRedrawRef.current = scale;
      return;
    }

    if (Math.abs(previousScale - scale) < 0.0001) {
      return;
    }

    lastScaleForMermaidRedrawRef.current = scale;

    if (mermaidZoomRedrawTimeoutRef.current !== null) {
      window.clearTimeout(mermaidZoomRedrawTimeoutRef.current);
      mermaidZoomRedrawTimeoutRef.current = null;
    }

    mermaidZoomRedrawTimeoutRef.current = window.setTimeout(() => {
      mermaidZoomRedrawTimeoutRef.current = null;
      void rerenderMermaidForScaleSync().catch(() => {
        // Ignore redraw failures; keep current diagram render.
      });
    }, 90);

    return () => {
      if (mermaidZoomRedrawTimeoutRef.current !== null) {
        window.clearTimeout(mermaidZoomRedrawTimeoutRef.current);
        mermaidZoomRedrawTimeoutRef.current = null;
      }
    };
  }, [isHydrated, isVisible, rerenderMermaidForScaleSync, scale, showingText, syntax]);

  useEffect(() => {
    return () => {
      if (mermaidZoomRedrawTimeoutRef.current !== null) {
        window.clearTimeout(mermaidZoomRedrawTimeoutRef.current);
        mermaidZoomRedrawTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    markMermaidRenderComplete,
  };
}
