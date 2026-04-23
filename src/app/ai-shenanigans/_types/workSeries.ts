import type { AIShenaniganMovieOrientation } from "./aiShenanigan";

export type WorkDocumentPart = {
  src: string;
  title?: string;
  source?: string;
  sourceHref?: string;
  caption?: string;
};

export type SeriesMediaPart = {
  src: string;
  title?: string;
  source?: string;
  sourceHref?: string;
  caption?: string;
};

export type RevealStep = { kind: "work"; index: number } | { kind: "series"; index: number };

export type WorkSeriesChronologyStep = {
  key: string;
  label: string;
  active: boolean;
  reached: boolean;
  step: RevealStep;
};

export type AIShenaniganWorkSeriesProps = {
  rank: number;
  title: string;
  blurb: string;
  orientation?: AIShenaniganMovieOrientation;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  workPdf?: string;
  workSource?: string;
  workSourceHref?: string;
  workCaption?: string;
  workParts?: WorkDocumentPart[];
  seriesMovie?: string;
  seriesSource?: string;
  seriesSourceHref?: string;
  seriesCaption?: string;
  seriesParts?: SeriesMediaPart[];
};
