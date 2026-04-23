import type {
  AdaptationEpisodeMediaItem,
  TrailerOrientation,
} from "../_utils/aiShenaniganAdaptationUtils";

export type AIShenaniganAdaptationProps = {
  rank: number;
  title: string;
  blurb: string;
  intentToCopyright?: boolean;
  rightsNotice?: string;
  bookCoverImage: string;
  bookSource?: string;
  bookSourceHref?: string;
  bookCaption?: string;
  manuscriptPdf: string;
  manuscriptSource?: string;
  manuscriptSourceHref?: string;
  manuscriptCaption?: string;
  trailerMovie?: string;
  trailerOrientation?: TrailerOrientation;
  trailerSource?: string;
  trailerSourceHref?: string;
  trailerCaption?: string;
  episodesPdf: string;
  episodesSource?: string;
  episodesSourceHref?: string;
  episodesCaption?: string;
  episodeMedia?: AdaptationEpisodeMediaItem[];
};
