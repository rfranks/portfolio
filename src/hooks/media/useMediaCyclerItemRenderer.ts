import * as React from "react";
import type { MediaCyclerItem } from "@/types/media/mediaCycler";
import { flattenMediaCyclerSxArray, toMediaCyclerSxArray } from "@/utils/media/mediaCyclerSx";

type UseMediaCyclerItemRendererArgs = {
  item: MediaCyclerItem;
  items: MediaCyclerItem[];
  loopNavigation: boolean;
  markdownByKey: Record<string, string>;
  smallScreenInfoBlurb?: string;
  compactMetadataOnSmallScreens: boolean;
};

type InlineMetadataDisplay = "block" | { xs: "none"; md: "block" };

const resolvePreviousDiagramItem = ({
  isDiagramItem,
  itemIndex,
  items,
  loopNavigation,
}: {
  isDiagramItem: boolean;
  itemIndex: number;
  items: MediaCyclerItem[];
  loopNavigation: boolean;
}): MediaCyclerItem | null => {
  if (!isDiagramItem || itemIndex < 0) {
    return null;
  }

  for (let index = itemIndex - 1; index >= 0; index -= 1) {
    const candidate = items[index];
    if (candidate.mediaType === "diagram") {
      return candidate;
    }
  }

  if (loopNavigation) {
    for (let index = items.length - 1; index > itemIndex; index -= 1) {
      const candidate = items[index];
      if (candidate.mediaType === "diagram") {
        return candidate;
      }
    }
  }

  return null;
};

const resolveNextDiagramItem = ({
  isDiagramItem,
  itemIndex,
  items,
  loopNavigation,
}: {
  isDiagramItem: boolean;
  itemIndex: number;
  items: MediaCyclerItem[];
  loopNavigation: boolean;
}): MediaCyclerItem | null => {
  if (!isDiagramItem || itemIndex < 0) {
    return null;
  }

  for (let index = itemIndex + 1; index < items.length; index += 1) {
    const candidate = items[index];
    if (candidate.mediaType === "diagram") {
      return candidate;
    }
  }

  if (loopNavigation) {
    for (let index = 0; index < itemIndex; index += 1) {
      const candidate = items[index];
      if (candidate.mediaType === "diagram") {
        return candidate;
      }
    }
  }

  return null;
};

export function useMediaCyclerItemRenderer({
  item,
  items,
  loopNavigation,
  markdownByKey,
  smallScreenInfoBlurb,
  compactMetadataOnSmallScreens,
}: UseMediaCyclerItemRendererArgs) {
  return React.useMemo(() => {
    const isDiagramItem = item.mediaType === "diagram";
    const canActivate = Boolean(item.onMediaActivate);
    const hasTitle = item.title.trim().length > 0;
    const imageAlt = item.mediaAlt || item.title;
    const lightboxTitle = item.mediaLightboxTitle || item.title;
    const hasMetadata = Boolean(item.mediaSource || item.mediaCaption);
    const hasSmallScreenInfoBlurb = Boolean(smallScreenInfoBlurb?.trim());
    const compactMetadata =
      compactMetadataOnSmallScreens && (hasMetadata || hasSmallScreenInfoBlurb);
    const inlineMetadataDisplay: InlineMetadataDisplay = compactMetadata
      ? { xs: "none", md: "block" }
      : "block";
    const resolvedMarkdownContent =
      item.mediaType === "markdown"
        ? (item.markdownContent ?? markdownByKey[item.key] ?? item.mediaUrl ?? "")
        : "";

    const panelFlatSxArray = flattenMediaCyclerSxArray(toMediaCyclerSxArray(item.panelSx));
    const titleIconFlatSxArray = flattenMediaCyclerSxArray(toMediaCyclerSxArray(item.titleIconSx));
    const titleFlatSxArray = flattenMediaCyclerSxArray(toMediaCyclerSxArray(item.titleSx));
    const assetFrameFlatSxArray = flattenMediaCyclerSxArray(
      toMediaCyclerSxArray(item.assetFrameSx),
    );
    const previewVideoSxArray = toMediaCyclerSxArray(item.previewVideoSx);
    const markdownFlatSxArray = flattenMediaCyclerSxArray(toMediaCyclerSxArray(item.markdownSx));
    const diagramSxArray = toMediaCyclerSxArray(item.diagramSx);
    const customContentFlatSxArray = flattenMediaCyclerSxArray(
      toMediaCyclerSxArray(item.customContentSx),
    );
    const pdfContainerSxArray = toMediaCyclerSxArray(item.pdfContainerSx);
    const pdfFrameSxArray = toMediaCyclerSxArray(item.pdfFrameSx);
    const pdfPreviewSxArray = toMediaCyclerSxArray(item.pdfPreviewSx);
    const pdfObjectSxArray = toMediaCyclerSxArray(item.pdfObjectSx);
    const pdfIframeSxArray = toMediaCyclerSxArray(item.pdfIframeSx);

    const itemIndex = items.findIndex((cycleItem) => cycleItem.key === item.key);
    const previousDiagramItem = resolvePreviousDiagramItem({
      isDiagramItem,
      itemIndex,
      items,
      loopNavigation,
    });
    const nextDiagramItem = resolveNextDiagramItem({
      isDiagramItem,
      itemIndex,
      items,
      loopNavigation,
    });

    return {
      isDiagramItem,
      canActivate,
      hasTitle,
      imageAlt,
      lightboxTitle,
      compactMetadata,
      inlineMetadataDisplay,
      resolvedMarkdownContent,
      panelFlatSxArray,
      titleIconFlatSxArray,
      titleFlatSxArray,
      assetFrameFlatSxArray,
      previewVideoSxArray,
      markdownFlatSxArray,
      diagramSxArray,
      customContentFlatSxArray,
      pdfContainerSxArray,
      pdfFrameSxArray,
      pdfPreviewSxArray,
      pdfObjectSxArray,
      pdfIframeSxArray,
      previousDiagramItem,
      nextDiagramItem,
      canGoBackToPreviousDiagram: Boolean(previousDiagramItem?.onSelect),
      canAdvanceToNextDiagram: Boolean(nextDiagramItem?.onSelect),
    };
  }, [
    compactMetadataOnSmallScreens,
    item,
    items,
    loopNavigation,
    markdownByKey,
    smallScreenInfoBlurb,
  ]);
}
