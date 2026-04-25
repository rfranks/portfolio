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

type AIShenaniganCoreProps = {
  rank: number;
  title: string;
  blurb: string;
  intentToCopyright?: boolean;
  rightsNotice?: string;
};

type AIShenaniganRealisticMediaProps = {
  realisticImage: string;
  realisticSource?: string;
  realisticSourceHref?: string;
  realisticCaption?: string;
};

type AIShenaniganDefaultMediaProps = {
  orientation?: AIShenaniganMovieOrientation;
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
};

type AIShenaniganAdaptationMediaProps = {
  bookCoverImage: string;
  bookSource?: string;
  bookSourceHref?: string;
  bookCaption?: string;
  manuscriptPdf: string;
  manuscriptSource?: string;
  manuscriptSourceHref?: string;
  manuscriptCaption?: string;
  trailerMovie?: string;
  trailerOrientation?: AIShenaniganMovieOrientation;
  trailerSource?: string;
  trailerSourceHref?: string;
  trailerCaption?: string;
  episodesPdf: string;
  episodesSource?: string;
  episodesSourceHref?: string;
  episodesCaption?: string;
  episodeMedia?: AIShenaniganEpisodeMedia[];
};

type AIShenaniganWorkSeriesMediaProps = {
  orientation?: AIShenaniganMovieOrientation;
  workPdf?: string;
  workSource?: string;
  workSourceHref?: string;
  workCaption?: string;
  workParts: AIShenaniganWorkOrSeriesPart[];
  seriesMovie?: string;
  seriesSource?: string;
  seriesSourceHref?: string;
  seriesCaption?: string;
  seriesParts: AIShenaniganWorkOrSeriesPart[];
};

type AIShenaniganPalmReadingMediaProps = {
  rawImage: string;
  rawSource?: string;
  rawSourceHref?: string;
  rawCaption?: string;
  analyzedImage: string;
  analyzedSource?: string;
  analyzedSourceHref?: string;
  analyzedCaption?: string;
  palmLineAnalysisImage: string;
  palmLineAnalysisSource?: string;
  palmLineAnalysisSourceHref?: string;
  palmLineAnalysisCaption?: string;
  palmReadingTitle?: string;
  palmReadingText?: string;
  palmReadingMarkdownPath?: string;
  palmReadingSource?: string;
  palmReadingSourceHref?: string;
};

type AIShenaniganSongRecordingMediaProps = {
  songAlbumImage: string;
  songAlbumSource?: string;
  songAlbumSourceHref?: string;
  songAlbumCaption?: string;
  songAudio: string;
  songAudioSource?: string;
  songAudioSourceHref?: string;
  songAudioCaption?: string;
  songWrittenBy?: string;
  songPerformedBy?: string;
  songLyricsMarkdownPath?: string;
  songLyricsSource?: string;
  songLyricsSourceHref?: string;
};

type AIShenaniganAllMediaKeys =
  | keyof AIShenaniganRealisticMediaProps
  | keyof AIShenaniganDefaultMediaProps
  | keyof AIShenaniganAdaptationMediaProps
  | keyof AIShenaniganWorkSeriesMediaProps
  | keyof AIShenaniganPalmReadingMediaProps
  | keyof AIShenaniganSongRecordingMediaProps;

type AIShenaniganNeverProps<Keys extends PropertyKey> = {
  [K in Keys]?: never;
};

type AIShenaniganDefaultAllowedMediaKeys =
  | keyof AIShenaniganRealisticMediaProps
  | keyof AIShenaniganDefaultMediaProps;
type AIShenaniganBookAllowedMediaKeys = keyof AIShenaniganAdaptationMediaProps;
type AIShenaniganWorkSeriesAllowedMediaKeys = keyof AIShenaniganWorkSeriesMediaProps;
type AIShenaniganPalmAllowedMediaKeys = keyof AIShenaniganPalmReadingMediaProps;
type AIShenaniganSongAllowedMediaKeys = keyof AIShenaniganSongRecordingMediaProps;

export type AIShenaniganDefaultProps = AIShenaniganCoreProps &
  AIShenaniganRealisticMediaProps &
  AIShenaniganDefaultMediaProps &
  AIShenaniganNeverProps<Exclude<AIShenaniganAllMediaKeys, AIShenaniganDefaultAllowedMediaKeys>> & {
    type: "default";
  };

export type AIShenaniganBookToLimitedSeriesProps = AIShenaniganCoreProps &
  AIShenaniganAdaptationMediaProps &
  AIShenaniganNeverProps<Exclude<AIShenaniganAllMediaKeys, AIShenaniganBookAllowedMediaKeys>> & {
    type: "book-to-limited-series";
  };

export type AIShenaniganWorkToSeriesAdaptationProps = AIShenaniganCoreProps &
  AIShenaniganWorkSeriesMediaProps &
  AIShenaniganNeverProps<
    Exclude<AIShenaniganAllMediaKeys, AIShenaniganWorkSeriesAllowedMediaKeys>
  > & {
    type: "work-to-series-adaptation";
  };

export type AIShenaniganPalmylyzerProProps = AIShenaniganCoreProps &
  AIShenaniganPalmReadingMediaProps &
  AIShenaniganNeverProps<Exclude<AIShenaniganAllMediaKeys, AIShenaniganPalmAllowedMediaKeys>> & {
    type: "palmylyzer-pro";
  };

export type AIShenaniganSongRecordingProps = AIShenaniganCoreProps &
  AIShenaniganSongRecordingMediaProps &
  AIShenaniganNeverProps<Exclude<AIShenaniganAllMediaKeys, AIShenaniganSongAllowedMediaKeys>> & {
    type: "song-recording";
  };

export type AIShenaniganProps =
  | AIShenaniganDefaultProps
  | AIShenaniganBookToLimitedSeriesProps
  | AIShenaniganWorkToSeriesAdaptationProps
  | AIShenaniganPalmylyzerProProps
  | AIShenaniganSongRecordingProps;
