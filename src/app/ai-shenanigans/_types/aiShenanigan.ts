export type AIShenaniganMovieOrientation = "landscape" | "portrait" | undefined;

export type AIShenaniganType =
  | "default"
  | "book-to-limited-series"
  | "work-to-series-adaptation"
  | "palmylyzer-pro"
  | "song-recording";

export type AIShenaniganEpisodeMedia = {
  title: string;
  episodeNumber?: number;
  seasonNumber?: number;
  src: string;
  source?: string;
  sourceHref?: string;
  caption?: string;
};

export type AIShenaniganWorkOrSeriesPart = {
  src: string;
  title?: string;
  source?: string;
  sourceHref?: string;
  caption?: string;
};

export type AIShenaniganProps = {
  type?: AIShenaniganType;
  rank: number;
  title: string;
  blurb: string;
  orientation?: AIShenaniganMovieOrientation;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  realisticImage: string;
  realisticSource?: string;
  realisticSourceHref?: string;
  realisticCaption?: string;
  stylizedRendering?: string;
  stylizedSource?: string;
  stylizedSourceHref?: string;
  stylizedCaption?: string;
  movieRendering?: string | null;
  movieSource?: string;
  movieSourceHref?: string;
  movieCaption?: string;
  movieRendering2?: string | null;
  movieSource2?: string;
  movieSourceHref2?: string;
  movieCaption2?: string;
  bookCoverImage?: string;
  bookSource?: string;
  bookSourceHref?: string;
  bookCaption?: string;
  manuscriptPdf?: string;
  manuscriptSource?: string;
  manuscriptSourceHref?: string;
  manuscriptCaption?: string;
  trailerMovie?: string;
  trailerOrientation?: AIShenaniganMovieOrientation;
  trailerSource?: string;
  trailerSourceHref?: string;
  trailerCaption?: string;
  episodesPdf?: string;
  episodesSource?: string;
  episodesSourceHref?: string;
  episodesCaption?: string;
  episodeMedia?: AIShenaniganEpisodeMedia[];
  workPdf?: string;
  workSource?: string;
  workSourceHref?: string;
  workCaption?: string;
  workParts?: AIShenaniganWorkOrSeriesPart[];
  seriesMovie?: string;
  seriesSource?: string;
  seriesSourceHref?: string;
  seriesCaption?: string;
  seriesParts?: AIShenaniganWorkOrSeriesPart[];
  rawImage?: string;
  rawSource?: string;
  rawSourceHref?: string;
  rawCaption?: string;
  analyzedImage?: string;
  analyzedSource?: string;
  analyzedSourceHref?: string;
  analyzedCaption?: string;
  palmLineAnalysisImage?: string;
  palmLineAnalysisSource?: string;
  palmLineAnalysisSourceHref?: string;
  palmLineAnalysisCaption?: string;
  palmReadingTitle?: string;
  palmReadingText?: string;
  palmReadingMarkdownPath?: string;
  palmReadingSource?: string;
  palmReadingSourceHref?: string;
  songAlbumImage?: string;
  songAlbumSource?: string;
  songAlbumSourceHref?: string;
  songAlbumCaption?: string;
  songAudio?: string;
  songAudioSource?: string;
  songAudioSourceHref?: string;
  songAudioCaption?: string;
  songWrittenBy?: string;
  songPerformedBy?: string;
  songLyricsMarkdownPath?: string;
  songLyricsSource?: string;
  songLyricsSourceHref?: string;
};
