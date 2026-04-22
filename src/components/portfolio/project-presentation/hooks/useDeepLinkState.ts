import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectPresentationSectionKey } from "@/types/components/portfolio";

type DeepLinkSection = {
  key: ProjectPresentationSectionKey;
  title: string;
};

type DeepLinkDiagramEntry = {
  key: string;
};

type UseDeepLinkStateParams = {
  projectSlug: string;
  sections: DeepLinkSection[];
  diagramEntries: DeepLinkDiagramEntry[];
  activeSectionKey: ProjectPresentationSectionKey;
  setActiveSectionKey: (key: ProjectPresentationSectionKey) => void;
  activeDiagramKey: string | undefined;
  setActiveDiagramKey: (key: string | undefined) => void;
};

export function useDeepLinkState({
  projectSlug,
  sections,
  diagramEntries,
  activeSectionKey,
  setActiveSectionKey,
  activeDiagramKey,
  setActiveDiagramKey,
}: UseDeepLinkStateParams) {
  const [deepLinkInitialized, setDeepLinkInitialized] = useState(false);
  const [copyDeepLinkSucceeded, setCopyDeepLinkSucceeded] = useState(false);
  const copyDeepLinkResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (deepLinkInitialized || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const deepLinkProject = params.get("project")?.trim().toLowerCase();
    if (deepLinkProject && deepLinkProject !== projectSlug) {
      setDeepLinkInitialized(true);
      return;
    }

    const slideParam = params.get("slide")?.trim().toLowerCase();
    if (slideParam) {
      const numericSlideIndex = Number.parseInt(slideParam, 10);
      const slideByIndex =
        Number.isFinite(numericSlideIndex) && numericSlideIndex >= 1
          ? sections[numericSlideIndex - 1]
          : undefined;
      const slideByKey = sections.find((section) => section.key === slideParam);
      const slideByTitle = sections.find(
        (section) =>
          section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slideParam ||
          section.title.toLowerCase().replace(/[^a-z0-9]+/g, "") === slideParam,
      );
      const resolvedSlideKey = slideByKey?.key ?? slideByTitle?.key ?? slideByIndex?.key;
      if (resolvedSlideKey) {
        setActiveSectionKey(resolvedSlideKey);
      }
    }

    const diagramParam = params.get("diagram")?.trim().toLowerCase();
    if (diagramParam && diagramEntries.length > 0) {
      const numericDiagramIndex = Number.parseInt(diagramParam, 10);
      const diagramByIndex =
        Number.isFinite(numericDiagramIndex) && numericDiagramIndex >= 1
          ? diagramEntries[numericDiagramIndex - 1]
          : undefined;
      const diagramByKey = diagramEntries.find((entry) => entry.key === diagramParam);
      const resolvedDiagramKey = diagramByKey?.key ?? diagramByIndex?.key;
      if (resolvedDiagramKey) {
        setActiveDiagramKey(resolvedDiagramKey);
      }
    }

    setDeepLinkInitialized(true);
  }, [
    deepLinkInitialized,
    diagramEntries,
    projectSlug,
    sections,
    setActiveDiagramKey,
    setActiveSectionKey,
  ]);

  useEffect(() => {
    if (!deepLinkInitialized || typeof window === "undefined") {
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("project", projectSlug);
    nextUrl.searchParams.set("slide", activeSectionKey);

    if (diagramEntries.length > 0) {
      const index = diagramEntries.findIndex((entry) => entry.key === activeDiagramKey);
      if (index >= 0) {
        nextUrl.searchParams.set("diagram", String(index + 1));
      } else {
        nextUrl.searchParams.delete("diagram");
      }
    } else {
      nextUrl.searchParams.delete("diagram");
    }

    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    if (currentPath !== nextPath) {
      window.history.replaceState(window.history.state, "", nextPath);
    }
  }, [activeDiagramKey, activeSectionKey, deepLinkInitialized, diagramEntries, projectSlug]);

  useEffect(() => {
    return () => {
      if (copyDeepLinkResetTimeoutRef.current !== null) {
        window.clearTimeout(copyDeepLinkResetTimeoutRef.current);
        copyDeepLinkResetTimeoutRef.current = null;
      }
    };
  }, []);

  const handleCopyDeepLink = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("project", projectSlug);
    url.searchParams.set("slide", activeSectionKey);
    if (diagramEntries.length > 0) {
      const index = diagramEntries.findIndex((entry) => entry.key === activeDiagramKey);
      if (index >= 0) {
        url.searchParams.set("diagram", String(index + 1));
      } else {
        url.searchParams.delete("diagram");
      }
    } else {
      url.searchParams.delete("diagram");
    }

    const link = url.toString();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = link;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopyDeepLinkSucceeded(true);
      if (copyDeepLinkResetTimeoutRef.current !== null) {
        window.clearTimeout(copyDeepLinkResetTimeoutRef.current);
      }
      copyDeepLinkResetTimeoutRef.current = window.setTimeout(() => {
        setCopyDeepLinkSucceeded(false);
        copyDeepLinkResetTimeoutRef.current = null;
      }, 1400);
    } catch {
      // no-op: ignore clipboard failures.
    }
  }, [activeDiagramKey, activeSectionKey, diagramEntries, projectSlug]);

  return {
    deepLinkInitialized,
    copyDeepLinkSucceeded,
    handleCopyDeepLink,
  };
}
