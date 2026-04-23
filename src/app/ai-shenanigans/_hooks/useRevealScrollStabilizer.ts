import { useCallback, useRef } from "react";

type UseRevealScrollStabilizerArgs = {
  mobileFooterMediaQuery?: string;
};

export function useRevealScrollStabilizer(args?: UseRevealScrollStabilizerArgs) {
  const mobileFooterMediaQuery = args?.mobileFooterMediaQuery ?? "(max-width:1199.95px)";
  const scrollStabilizersRef = useRef<Array<() => void>>([]);

  const clearScrollStabilizers = useCallback(() => {
    scrollStabilizersRef.current.forEach((cleanup) => cleanup());
    scrollStabilizersRef.current = [];
  }, []);

  const scrollPanelIntoView = useCallback(
    (panel: HTMLElement | null, block: ScrollLogicalPosition = "nearest") => {
      if (!panel) {
        return;
      }

      clearScrollStabilizers();

      const scroll = () => {
        panel.scrollIntoView({
          behavior: "smooth",
          block,
        });
      };

      scroll();

      const cleanups: Array<() => void> = [];
      [180, 480, 1080].forEach((delay) => {
        const timeoutId = window.setTimeout(scroll, delay);
        cleanups.push(() => window.clearTimeout(timeoutId));
      });

      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => {
          scroll();
        });
        observer.observe(panel);
        cleanups.push(() => observer.disconnect());

        const observerTimeoutId = window.setTimeout(() => {
          observer.disconnect();
        }, 1600);
        cleanups.push(() => window.clearTimeout(observerTimeoutId));
      }

      scrollStabilizersRef.current = cleanups;
    },
    [clearScrollStabilizers],
  );

  const scrollRevealIntoView = useCallback(
    (
      panel: HTMLElement | null,
      footer: HTMLElement | null,
      block: ScrollLogicalPosition = "center",
    ) => {
      if (!panel) {
        return;
      }

      const shouldFavorFooter =
        Boolean(footer) &&
        typeof window !== "undefined" &&
        window.matchMedia(mobileFooterMediaQuery).matches;

      if (!shouldFavorFooter || !footer) {
        scrollPanelIntoView(panel, block);
        return;
      }

      clearScrollStabilizers();

      const scrollPanel = () => {
        panel.scrollIntoView({
          behavior: "smooth",
          block,
        });
      };

      const scrollFooter = () => {
        footer.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      };

      scrollPanel();

      const cleanups: Array<() => void> = [];
      [220, 520, 1080].forEach((delay) => {
        const timeoutId = window.setTimeout(scrollFooter, delay);
        cleanups.push(() => window.clearTimeout(timeoutId));
      });

      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => {
          scrollFooter();
        });
        observer.observe(panel);
        observer.observe(footer);
        cleanups.push(() => observer.disconnect());

        const observerTimeoutId = window.setTimeout(() => {
          observer.disconnect();
        }, 1600);
        cleanups.push(() => window.clearTimeout(observerTimeoutId));
      }

      scrollStabilizersRef.current = cleanups;
    },
    [clearScrollStabilizers, mobileFooterMediaQuery, scrollPanelIntoView],
  );

  return {
    clearScrollStabilizers,
    scrollPanelIntoView,
    scrollRevealIntoView,
  };
}
