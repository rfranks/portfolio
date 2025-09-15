import { useCallback } from "react";

/**
 * React hook providing helpers to get and set the document's title.
 *
 * @returns {{ getDocumentTitle: () => string, setDocumentTitle: (title: string) => void }}
 * Object containing helper functions:
 * - `getDocumentTitle`: returns the current document title
 * - `setDocumentTitle`: sets the document title
 */
export function useDocumentTitle() {
  const getDocumentTitle = useCallback((): string => {
    return typeof document === "undefined" ? "" : document.title;
  }, []);

  const setDocumentTitle = useCallback((title: string): void => {
    if (typeof document !== "undefined") {
      document.title = title;
    }
  }, []);

  return { getDocumentTitle, setDocumentTitle };
}

