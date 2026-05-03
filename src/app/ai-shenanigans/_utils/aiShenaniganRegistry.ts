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
import type {
  AIShenaniganDataItem,
  AIShenaniganFilterOptionByCategory,
  AIShenaniganFilterSelection,
  AIShenaniganPageItem,
} from "../_types/aiShenaniganModels";

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

const MEDIUM_LABELS: Record<string, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "Document",
  adaptation: "Adaptation",
  analysis: "Analysis",
};

const STYLE_LABELS: Record<string, string> = {
  portrait: "Portrait",
  landscape: "Landscape",
  stylized: "Stylized",
  cinematic: "Cinematic",
  storybook: "Storybook",
  horror: "Horror",
  music: "Music",
  analysis: "Analytical",
  retro: "Retro",
};

const SERIES_LABELS: Record<string, string> = {
  "alice-in-wonderland": "Alice in Wonderland",
  "zombie-chaos": "Zombie Chaos",
  standalone: "Standalone",
};

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

const slugifyToken = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const startCaseFromToken = (value: string): string =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const hasKeywordMatch = (text: string, keywords: readonly string[]): boolean =>
  keywords.some((keyword) => text.includes(keyword));

const getItemTextBlob = (item: AIShenaniganDataItem): string =>
  [
    readOptionalString(item.title),
    readOptionalString(item.shortText),
    readOptionalString(item.blurb),
    readOptionalString(item.realisticCaption),
    readOptionalString(item.stylizedCaption),
    readOptionalString(item.movieCaption),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

const hasVideoMedia = (item: AIShenaniganDataItem): boolean => {
  const itemRecord = item as Record<string, unknown>;

  return Boolean(
    readOptionalString(item.movieRendering) ||
    readOptionalString(item.movieRendering2) ||
    readOptionalString(item.trailerMovie) ||
    getString(itemRecord, "seriesMovie") ||
    (Array.isArray(item.episodeMedia) && item.episodeMedia.length > 0) ||
    (Array.isArray(itemRecord.seriesParts) && itemRecord.seriesParts.length > 0),
  );
};

const resolveMediumTags = (item: AIShenaniganDataItem, shenaniganType: AIShenaniganType) => {
  const tags = new Set<string>(["image"]);
  const itemRecord = item as Record<string, unknown>;

  if (hasVideoMedia(item)) {
    tags.add("video");
  }
  if (readOptionalString(item.songAudio)) {
    tags.add("audio");
  }
  if (
    readOptionalString(item.manuscriptPdf) ||
    readOptionalString(item.episodesPdf) ||
    (Array.isArray(itemRecord.workParts) && itemRecord.workParts.length > 0)
  ) {
    tags.add("document");
  }
  if (
    shenaniganType === "book-to-limited-series" ||
    shenaniganType === "work-to-series-adaptation"
  ) {
    tags.add("adaptation");
  }
  if (shenaniganType === "palmylyzer-pro") {
    tags.add("analysis");
  }

  return Array.from(tags);
};

const resolveStyleTags = (item: AIShenaniganDataItem, shenaniganType: AIShenaniganType) => {
  const tags = new Set<string>();
  const itemText = getItemTextBlob(item);
  const orientation = normalizeOrientation(item.orientation);

  if (orientation) {
    tags.add(orientation);
  }
  if (readOptionalString(item.stylizedRendering)) {
    tags.add("stylized");
  }
  if (hasVideoMedia(item)) {
    tags.add("cinematic");
  }
  if (shenaniganType === "song-recording") {
    tags.add("music");
  }
  if (shenaniganType === "palmylyzer-pro") {
    tags.add("analysis");
  }
  if (hasKeywordMatch(itemText, ["wonderland", "storybook", "fairytale"])) {
    tags.add("storybook");
  }
  if (hasKeywordMatch(itemText, ["zombie", "monster", "cryptid", "horror", "undead"])) {
    tags.add("horror");
  }
  if (hasKeywordMatch(itemText, ["retro", "arcade", "victorian"])) {
    tags.add("retro");
  }

  if (tags.size === 0) {
    tags.add("stylized");
  }

  return Array.from(tags);
};

const resolveSeriesTag = (
  item: AIShenaniganDataItem,
  shenaniganType: AIShenaniganType,
  sequelFamilyCounts: Map<string, number>,
) => {
  const itemRecord = item as Record<string, unknown>;
  const explicitSeries = getString(itemRecord, "series");
  if (explicitSeries) {
    return slugifyToken(explicitSeries);
  }

  const slug = readOptionalString(item.slug) ?? "";
  const itemText = getItemTextBlob(item);

  if (
    shenaniganType === "book-to-limited-series" ||
    shenaniganType === "work-to-series-adaptation"
  ) {
    return slugifyToken(slug || item.title);
  }

  if (slug.startsWith("zombie-chaos")) {
    return "zombie-chaos";
  }

  if (
    hasKeywordMatch(itemText, [
      "wonderland",
      "white rabbit",
      "cheshire",
      "mad hatter",
      "king of hearts",
      "tweedle",
      "walrus",
      "caterpillar",
    ])
  ) {
    return "alice-in-wonderland";
  }

  const sequelFamilySlug = slug.replace(/-\d+$/, "");
  if (sequelFamilySlug && (sequelFamilyCounts.get(sequelFamilySlug) ?? 0) > 1) {
    return sequelFamilySlug;
  }

  return "standalone";
};

const buildOptionList = (counts: Map<string, number>, labels: Record<string, string>) =>
  Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: labels[value] ?? startCaseFromToken(value),
      count,
    }))
    .sort((left, right) =>
      left.label.localeCompare(right.label, undefined, { sensitivity: "base" }),
    );

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
): AIShenaniganPageItem[] => {
  const sequelFamilyCounts = items.reduce((acc, item) => {
    const slug = readOptionalString(item.slug) ?? "";
    const familySlug = slug.replace(/-\d+$/, "");
    if (familySlug) {
      acc.set(familySlug, (acc.get(familySlug) ?? 0) + 1);
    }
    return acc;
  }, new Map<string, number>());

  return items.map((item, index) => {
    const props = buildAIShenaniganProps(item, index + 1);
    const shenaniganType = resolveAIShenaniganType(item.type);

    return {
      slug: item.slug,
      title: item.title,
      blurb: readOptionalString(item.blurb) ?? "",
      shortText: readOptionalString(item.shortText),
      previewImage: getPagerPreviewImage(item, shenaniganType, fallbackImage),
      mediumTags: resolveMediumTags(item, shenaniganType),
      styleTags: resolveStyleTags(item, shenaniganType),
      seriesTag: resolveSeriesTag(item, shenaniganType, sequelFamilyCounts),
      props,
    };
  });
};

export const resolveAIShenaniganFilterOptions = (
  items: AIShenaniganPageItem[],
): AIShenaniganFilterOptionByCategory => {
  const mediumCounts = new Map<string, number>();
  const styleCounts = new Map<string, number>();
  const seriesCounts = new Map<string, number>();

  items.forEach((item) => {
    item.mediumTags.forEach((tag) => {
      mediumCounts.set(tag, (mediumCounts.get(tag) ?? 0) + 1);
    });
    item.styleTags.forEach((tag) => {
      styleCounts.set(tag, (styleCounts.get(tag) ?? 0) + 1);
    });
    seriesCounts.set(item.seriesTag, (seriesCounts.get(item.seriesTag) ?? 0) + 1);
  });

  return {
    medium: buildOptionList(mediumCounts, MEDIUM_LABELS),
    style: buildOptionList(styleCounts, STYLE_LABELS),
    series: buildOptionList(seriesCounts, SERIES_LABELS),
  };
};

export const filterAIShenaniganItems = (
  items: AIShenaniganPageItem[],
  filters: AIShenaniganFilterSelection,
): AIShenaniganPageItem[] =>
  items.filter((item) => {
    const matchesMedium = filters.medium ? item.mediumTags.includes(filters.medium) : true;
    const matchesStyle = filters.style ? item.styleTags.includes(filters.style) : true;
    const matchesSeries = filters.series ? item.seriesTag === filters.series : true;

    return matchesMedium && matchesStyle && matchesSeries;
  });
