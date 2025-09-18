"use client";

import { useCallback, type RefObject } from "react";

import { exportElementToPdf } from "@/utils/pdfExport";

interface UseOfferExportsOptions {
  contentRef: RefObject<HTMLElement | null>;
  baseFileName?: string;
}

interface OfferExports {
  getContent: () => string;
  downloadMarkdown: () => void;
  downloadPdf: () => void;
}

export default function useOfferExports({
  contentRef,
  baseFileName = "offer",
}: UseOfferExportsOptions): OfferExports {
  const getContent = useCallback(() => {
    return contentRef.current?.innerText ?? "";
  }, [contentRef]);

  const downloadMarkdown = useCallback(() => {
    const content = getContent();
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${baseFileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [baseFileName, getContent]);

  const downloadPdf = useCallback(() => {
    if (contentRef.current) {
      exportElementToPdf(contentRef.current, `${baseFileName}.pdf`);
    }
  }, [baseFileName, contentRef]);

  return { getContent, downloadMarkdown, downloadPdf };
}
