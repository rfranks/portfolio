import type {
  AIShenaniganBookToLimitedSeriesProps,
  AIShenaniganDefaultProps,
  AIShenaniganMovieOrientation,
  AIShenaniganPalmylyzerProProps,
  AIShenaniganProps,
  AIShenaniganSongRecordingProps,
  AIShenaniganType,
  AIShenaniganWorkToSeriesAdaptationProps,
} from "../_types/aiShenanigan";
import type { AIShenaniganDataItem, AIShenaniganPageItem } from "../_types/aiShenaniganModels";

type AIShenaniganNonDefaultType = Exclude<AIShenaniganType, "default">;
type AIShenaniganNonDefaultPropsByType = {
  "book-to-limited-series": AIShenaniganBookToLimitedSeriesProps;
  "work-to-series-adaptation": AIShenaniganWorkToSeriesAdaptationProps;
  "palmylyzer-pro": AIShenaniganPalmylyzerProProps;
  "song-recording": AIShenaniganSongRecordingProps;
};
type AIShenaniganCommonBase = Pick<
  AIShenaniganDefaultProps,
  "rank" | "title" | "blurb" | "intentToCopyright" | "rightsNotice"
>;
type AIShenaniganBuilderContext = {
  commonBase: AIShenaniganCommonBase;
  item: AIShenaniganDataItem;
  itemRecord: Record<string, unknown>;
};
type AIShenaniganNonDefaultRegistry = {
  [K in AIShenaniganNonDefaultType]: (
    context: AIShenaniganBuilderContext,
  ) => AIShenaniganNonDefaultPropsByType[K];
};

const KNOWN_SHENANIGAN_TYPES: readonly AIShenaniganType[] = [
  "default",
  "book-to-limited-series",
  "work-to-series-adaptation",
  "palmylyzer-pro",
  "song-recording",
];

const readOptionalString = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length ? trimmedValue : undefined;
};

const readOptionalBoolean = (value: unknown) => (typeof value === "boolean" ? value : undefined);

const getString = (record: Record<string, unknown>, key: string) => readOptionalString(record[key]);

const normalizeOrientation = (value: unknown): AIShenaniganMovieOrientation =>
  value === "landscape" || value === "portrait" ? value : undefined;

const createMissingFieldError = (
  item: AIShenaniganDataItem,
  shenaniganType: AIShenaniganType,
  fieldName: string,
) => {
  const slug = readOptionalString(item.slug) ?? "<unknown-slug>";
  return new Error(
    `[ai-shenanigans] Missing required field "${fieldName}" for type "${shenaniganType}" on item "${slug}".`,
  );
};

const requireStringField = (
  item: AIShenaniganDataItem,
  shenaniganType: AIShenaniganType,
  fieldName: string,
  value: unknown,
) => {
  const parsedValue = readOptionalString(value);

  if (!parsedValue) {
    throw createMissingFieldError(item, shenaniganType, fieldName);
  }

  return parsedValue;
};

const requireArrayField = <T>(
  item: AIShenaniganDataItem,
  shenaniganType: AIShenaniganType,
  fieldName: string,
  value: unknown,
): T[] => {
  if (!Array.isArray(value)) {
    throw createMissingFieldError(item, shenaniganType, fieldName);
  }

  return value as T[];
};

const resolveAIShenaniganType = (value: unknown): AIShenaniganType => {
  if (typeof value === "string" && KNOWN_SHENANIGAN_TYPES.includes(value as AIShenaniganType)) {
    return value as AIShenaniganType;
  }

  return "default";
};

const buildCommonBaseProps = (item: AIShenaniganDataItem, rank: number): AIShenaniganCommonBase => {
  return {
    rank,
    title: item.title,
    blurb: readOptionalString(item.blurb) ?? "",
    intentToCopyright: readOptionalBoolean(item.intentToCopyright),
    rightsNotice: readOptionalString(item.rightsNotice),
  };
};

const nonDefaultRegistry: AIShenaniganNonDefaultRegistry = {
  "book-to-limited-series": ({ commonBase, item, itemRecord }) => ({
    ...commonBase,
    type: "book-to-limited-series",
    bookCoverImage: requireStringField(
      item,
      "book-to-limited-series",
      "bookCoverImage",
      item.bookCoverImage,
    ),
    bookSource: readOptionalString(item.bookSource),
    bookSourceHref: getString(itemRecord, "bookSourceHref"),
    bookCaption: readOptionalString(item.bookCaption),
    manuscriptPdf: requireStringField(
      item,
      "book-to-limited-series",
      "manuscriptPdf",
      item.manuscriptPdf,
    ),
    manuscriptSource: readOptionalString(item.manuscriptSource),
    manuscriptSourceHref: getString(itemRecord, "manuscriptSourceHref"),
    manuscriptCaption: readOptionalString(item.manuscriptCaption),
    trailerMovie: readOptionalString(item.trailerMovie),
    trailerOrientation: normalizeOrientation(item.trailerOrientation),
    trailerSource: readOptionalString(item.trailerSource),
    trailerSourceHref: getString(itemRecord, "trailerSourceHref"),
    trailerCaption: readOptionalString(item.trailerCaption),
    episodesPdf: requireStringField(
      item,
      "book-to-limited-series",
      "episodesPdf",
      item.episodesPdf,
    ),
    episodesSource: readOptionalString(item.episodesSource),
    episodesSourceHref: getString(itemRecord, "episodesSourceHref"),
    episodesCaption: readOptionalString(item.episodesCaption),
    episodeMedia: item.episodeMedia,
  }),
  "work-to-series-adaptation": ({ commonBase, item, itemRecord }) => ({
    ...commonBase,
    type: "work-to-series-adaptation",
    orientation: normalizeOrientation(item.orientation),
    workPdf: readOptionalString(item.workPdf),
    workSource: readOptionalString(item.workSource),
    workSourceHref: getString(itemRecord, "workSourceHref"),
    workCaption: readOptionalString(item.workCaption),
    workParts: requireArrayField(item, "work-to-series-adaptation", "workParts", item.workParts),
    seriesMovie: readOptionalString(item.seriesMovie),
    seriesSource: readOptionalString(item.seriesSource),
    seriesSourceHref: getString(itemRecord, "seriesSourceHref"),
    seriesCaption: readOptionalString(item.seriesCaption),
    seriesParts: requireArrayField(
      item,
      "work-to-series-adaptation",
      "seriesParts",
      item.seriesParts,
    ),
  }),
  "palmylyzer-pro": ({ commonBase, item, itemRecord }) => ({
    ...commonBase,
    type: "palmylyzer-pro",
    rawImage: requireStringField(item, "palmylyzer-pro", "rawImage", item.rawImage),
    rawSource: readOptionalString(item.rawSource),
    rawSourceHref: getString(itemRecord, "rawSourceHref"),
    rawCaption: readOptionalString(item.rawCaption),
    analyzedImage: requireStringField(item, "palmylyzer-pro", "analyzedImage", item.analyzedImage),
    analyzedSource: readOptionalString(item.analyzedSource),
    analyzedSourceHref: getString(itemRecord, "analyzedSourceHref"),
    analyzedCaption: readOptionalString(item.analyzedCaption),
    palmLineAnalysisImage: requireStringField(
      item,
      "palmylyzer-pro",
      "palmLineAnalysisImage",
      item.palmLineAnalysisImage,
    ),
    palmLineAnalysisSource: readOptionalString(item.palmLineAnalysisSource),
    palmLineAnalysisSourceHref: getString(itemRecord, "palmLineAnalysisSourceHref"),
    palmLineAnalysisCaption: readOptionalString(item.palmLineAnalysisCaption),
    palmReadingTitle: readOptionalString(item.palmReadingTitle),
    palmReadingText: getString(itemRecord, "palmReadingText"),
    palmReadingMarkdownPath: readOptionalString(item.palmReadingMarkdownPath),
    palmReadingSource: readOptionalString(item.palmReadingSource),
    palmReadingSourceHref: getString(itemRecord, "palmReadingSourceHref"),
  }),
  "song-recording": ({ commonBase, item, itemRecord }) => ({
    ...commonBase,
    type: "song-recording",
    songAlbumImage: requireStringField(
      item,
      "song-recording",
      "songAlbumImage",
      item.songAlbumImage,
    ),
    songAlbumSource: readOptionalString(item.songAlbumSource),
    songAlbumSourceHref: getString(itemRecord, "songAlbumSourceHref"),
    songAlbumCaption: getString(itemRecord, "songAlbumCaption"),
    songAudio: requireStringField(item, "song-recording", "songAudio", item.songAudio),
    songAudioSource: readOptionalString(item.songAudioSource),
    songAudioSourceHref: getString(itemRecord, "songAudioSourceHref"),
    songAudioCaption: readOptionalString(item.songAudioCaption),
    songWrittenBy: readOptionalString(item.songWrittenBy),
    songPerformedBy: readOptionalString(item.songPerformedBy),
    songLyricsMarkdownPath: readOptionalString(item.songLyricsMarkdownPath),
    songLyricsSource: readOptionalString(item.songLyricsSource),
    songLyricsSourceHref: getString(itemRecord, "songLyricsSourceHref"),
  }),
};

const buildDefaultProps = (context: AIShenaniganBuilderContext): AIShenaniganDefaultProps => {
  const { commonBase, item, itemRecord } = context;

  return {
    ...commonBase,
    type: "default",
    realisticImage: requireStringField(item, "default", "realisticImage", item.realisticImage),
    realisticSource: readOptionalString(item.realisticSource),
    realisticSourceHref: getString(itemRecord, "realisticSourceHref"),
    realisticCaption: readOptionalString(item.realisticCaption),
    orientation: normalizeOrientation(item.orientation),
    stylizedRendering: readOptionalString(item.stylizedRendering),
    stylizedSource: readOptionalString(item.stylizedSource),
    stylizedSourceHref: getString(itemRecord, "stylizedSourceHref"),
    stylizedCaption: readOptionalString(item.stylizedCaption),
    movieRendering: readOptionalString(item.movieRendering),
    movieSource: readOptionalString(item.movieSource),
    movieSourceHref: getString(itemRecord, "movieSourceHref"),
    movieCaption: readOptionalString(item.movieCaption),
    movieRendering2: readOptionalString(item.movieRendering2),
    movieSource2: readOptionalString(item.movieSource2),
    movieSourceHref2: getString(itemRecord, "movieSourceHref2"),
    movieCaption2: readOptionalString(item.movieCaption2),
  };
};

export const buildAIShenaniganProps = (
  item: AIShenaniganDataItem,
  rank: number,
): AIShenaniganProps => {
  const itemRecord = item as Record<string, unknown>;
  const context: AIShenaniganBuilderContext = {
    item,
    itemRecord,
    commonBase: buildCommonBaseProps(item, rank),
  };
  const shenaniganType = resolveAIShenaniganType(item.type);

  if (shenaniganType === "default") {
    return buildDefaultProps(context);
  }

  return nonDefaultRegistry[shenaniganType](context);
};

const getPagerPreviewImage = (
  item: AIShenaniganDataItem,
  shenaniganType: AIShenaniganType,
  fallbackImage: string,
) => {
  const itemRecord = item as Record<string, unknown>;
  const explicitPreview = readOptionalString(item.pagerOptionImage);

  if (explicitPreview) {
    return explicitPreview;
  }

  const stylizedPreview = readOptionalString(item.stylizedRendering);

  if (shenaniganType === "default" && stylizedPreview) {
    return stylizedPreview;
  }

  return (
    readOptionalString(item.bookCoverImage) ||
    readOptionalString(item.songAlbumImage) ||
    readOptionalString(item.analyzedImage) ||
    readOptionalString(item.stylizedRendering) ||
    readOptionalString(item.realisticImage) ||
    readOptionalString(item.rawImage) ||
    readOptionalString(item.palmLineAnalysisImage) ||
    getString(itemRecord, "previewImage") ||
    fallbackImage
  );
};

export const normalizeAIShenaniganItems = (
  items: AIShenaniganDataItem[],
  fallbackImage: string,
): AIShenaniganPageItem[] =>
  items.map((item, index) => {
    const props = buildAIShenaniganProps(item, index + 1);
    const shenaniganType = resolveAIShenaniganType(item.type);

    return {
      slug: item.slug,
      title: item.title,
      blurb: readOptionalString(item.blurb) ?? "",
      shortText: readOptionalString(item.shortText),
      previewImage: getPagerPreviewImage(item, shenaniganType, fallbackImage),
      props,
    };
  });
