import type {
  RevealStep,
  SeriesMediaPart,
  WorkDocumentPart,
  WorkSeriesChronologyStep,
} from "../_types/workSeries";

type BuildChronologyStepsArgs = {
  title: string;
  normalizedWorkParts: WorkDocumentPart[];
  normalizedSeriesParts: SeriesMediaPart[];
  revealedWorkCount: number;
  revealedSeriesCount: number;
  totalWorkParts: number;
  totalSeriesParts: number;
};

export function normalizeWorkParts(args: {
  workParts: WorkDocumentPart[];
  workPdf?: string;
  workSource?: string;
  workSourceHref?: string;
  workCaption?: string;
}): WorkDocumentPart[] {
  const { workParts, workPdf, workSource, workSourceHref, workCaption } = args;
  if (workParts.length > 0) {
    return workParts;
  }

  if (!workPdf) {
    return [];
  }

  return [
    {
      src: workPdf,
      source: workSource,
      sourceHref: workSourceHref,
      caption: workCaption,
    },
  ];
}

export function normalizeSeriesParts(args: {
  seriesParts: SeriesMediaPart[];
  seriesMovie?: string;
  seriesSource?: string;
  seriesSourceHref?: string;
  seriesCaption?: string;
}): SeriesMediaPart[] {
  const { seriesParts, seriesMovie, seriesSource, seriesSourceHref, seriesCaption } = args;
  if (seriesParts.length > 0) {
    return seriesParts;
  }

  if (!seriesMovie) {
    return [];
  }

  return [
    {
      src: seriesMovie,
      source: seriesSource,
      sourceHref: seriesSourceHref,
      caption: seriesCaption,
    },
  ];
}

export function getWorkLabel(title: string, index: number, totalWorkParts: number): string {
  return `${title} - Part ${index + 1} of ${totalWorkParts}`;
}

export function getSeriesLabel(title: string, index: number, totalSeriesParts: number): string {
  return `${title} - Series - Part ${index + 1} of ${totalSeriesParts}`;
}

export function currentRevealStep(args: {
  revealedWorkCount: number;
  revealedSeriesCount: number;
}): RevealStep | null {
  const { revealedWorkCount, revealedSeriesCount } = args;
  if (revealedSeriesCount > 0) {
    return { kind: "series", index: revealedSeriesCount - 1 };
  }
  if (revealedWorkCount > 0) {
    return { kind: "work", index: revealedWorkCount - 1 };
  }
  return null;
}

export function nextRevealStep(args: {
  revealedWorkCount: number;
  revealedSeriesCount: number;
  totalWorkParts: number;
  totalSeriesParts: number;
}): RevealStep | null {
  const { revealedWorkCount, revealedSeriesCount, totalWorkParts, totalSeriesParts } = args;
  if (revealedWorkCount < totalWorkParts) {
    return { kind: "work", index: revealedWorkCount };
  }
  if (revealedSeriesCount < totalSeriesParts) {
    return { kind: "series", index: revealedSeriesCount };
  }
  return null;
}

export function buildWorkSeriesChronologySteps({
  title,
  normalizedWorkParts,
  normalizedSeriesParts,
  revealedWorkCount,
  revealedSeriesCount,
  totalWorkParts,
  totalSeriesParts,
}: BuildChronologyStepsArgs): WorkSeriesChronologyStep[] {
  return [
    ...normalizedWorkParts.map((_, index) => ({
      key: `work-${index}`,
      label: getWorkLabel(title, index, totalWorkParts),
      active: revealedWorkCount === index + 1 && revealedSeriesCount === 0,
      reached: revealedWorkCount > index,
      step: { kind: "work" as const, index },
    })),
    ...normalizedSeriesParts.map((_, index) => ({
      key: `series-${index}`,
      label: getSeriesLabel(title, index, totalSeriesParts),
      active: revealedSeriesCount === index + 1,
      reached: revealedSeriesCount > index,
      step: { kind: "series" as const, index },
    })),
  ];
}
