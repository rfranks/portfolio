"use client";

import * as React from "react";
import type { MediaCyclerMediaType } from "@/types/media/mediaCycler";
import { safeImport } from "@/utils/components/shared/media";
import { resolveMediaSectionPrefetchOrder } from "@/utils/components/shared/mediaCycler";

export const LazyDiagramRenderer = React.lazy(() => import("./renderers/DiagramRenderer"));
export const LazyImageRenderer = React.lazy(() => import("./renderers/ImageRenderer"));
export const LazyPdfRenderer = React.lazy(() => import("./renderers/PdfRenderer"));
export const LazyVideoRenderer = React.lazy(() => import("./renderers/VideoRenderer"));

const prefetchedMediaTypeSet = new Set<MediaCyclerMediaType>();

const prefetchDiagramType = () => {
  safeImport(
    import("./renderers/DiagramRenderer").then((module) => {
      module.prefetchDiagramRendererIntent();
    }),
  );
  safeImport(import("@/components/shared/media/DiagramLightBox"));
  safeImport(import("mermaid"));
};

const mediaTypePrefetchLoaders: Record<MediaCyclerMediaType, () => void> = {
  image: () => {
    safeImport(import("./renderers/ImageRenderer"));
    safeImport(import("@/components/shared/content/ImageContent"));
    safeImport(import("@/components/shared/media/ImageLightbox"));
  },
  video: () => {
    safeImport(import("./renderers/VideoRenderer"));
    safeImport(import("@/components/shared/media/VideoLightbox"));
  },
  pdf: () => {
    safeImport(import("./renderers/PdfRenderer"));
    safeImport(import("@/components/shared/content/PDFContent"));
    safeImport(import("pdfjs-dist"));
  },
  diagram: prefetchDiagramType,
  custom: () => undefined,
  project: () => undefined,
  projectPresentation: () => undefined,
  recognition: () => undefined,
  recommendation: () => undefined,
  markdown: () => undefined,
};

export function prefetchMediaTypeByIntent(mediaType: MediaCyclerMediaType): void {
  if (prefetchedMediaTypeSet.has(mediaType)) {
    return;
  }
  prefetchedMediaTypeSet.add(mediaType);
  mediaTypePrefetchLoaders[mediaType]();
}

export function resolveSectionPrefetchOrder(): MediaCyclerMediaType[] {
  if (typeof window === "undefined") {
    return [];
  }

  return resolveMediaSectionPrefetchOrder(new URLSearchParams(window.location.search));
}
