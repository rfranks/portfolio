import { buildCondensedChronologyIndices, resolveCurrentRevealIndex } from "./chronologyUtils";

export type RevealStage = "intro" | "book" | "manuscript" | "trailer" | "episodes";
export type TrailerOrientation = "landscape" | "portrait" | undefined;

export const ARROW_REVEAL_MS = 280;

export type AdaptationEpisodeMediaItem = {
  title: string;
  episodeNumber?: number;
  seasonNumber?: number;
  src: string;
  source?: string;
  sourceHref?: string;
  caption?: string;
};

export type RevealLabelKey = "book" | "manuscript" | "trailer" | "episodes" | `episode-${number}`;

export type RevealLabel = {
  key: RevealLabelKey;
  label: string;
  active: boolean;
  reached: boolean;
};

export function getEpisodeSeasonNumber(seasonNumber?: number): number {
  return seasonNumber ?? 1;
}

export function getEpisodeChronologyLabel(episode: {
  title: string;
  episodeNumber?: number;
  seasonNumber?: number;
}): string {
  if (!episode.episodeNumber) {
    return episode.title;
  }

  return `Season ${getEpisodeSeasonNumber(episode.seasonNumber)}: Episode ${episode.episodeNumber}`;
}

export function buildRevealLabels(params: {
  bookVisible: boolean;
  manuscriptVisible: boolean;
  showManuscriptArrow: boolean;
  hasTrailer: boolean;
  trailerVisible: boolean;
  showTrailerArrow: boolean;
  episodesVisible: boolean;
  showEpisodesArrow: boolean;
  revealedEpisodeCount: number;
  episodeMedia: AdaptationEpisodeMediaItem[];
}): RevealLabel[] {
  return [
    {
      key: "book",
      label: "Book cover",
      active: params.bookVisible,
      reached: params.bookVisible,
    },
    {
      key: "manuscript",
      label: "Manuscript",
      active: params.manuscriptVisible || params.showManuscriptArrow,
      reached: params.manuscriptVisible,
    },
    ...(params.hasTrailer
      ? [
          {
            key: "trailer" as const,
            label: "Trailer",
            active: params.trailerVisible || params.showTrailerArrow,
            reached: params.trailerVisible,
          },
        ]
      : []),
    {
      key: "episodes",
      label: "Episodes Draft",
      active: params.episodesVisible || params.showEpisodesArrow,
      reached: params.episodesVisible,
    },
    ...params.episodeMedia.map((episode, index) => ({
      key: `episode-${index}` as const,
      label: getEpisodeChronologyLabel(episode),
      active: params.revealedEpisodeCount > index,
      reached: params.revealedEpisodeCount > index,
    })),
  ];
}

export { buildCondensedChronologyIndices, resolveCurrentRevealIndex };
