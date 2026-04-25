import { z } from "zod";
import { nonEmptyString } from "./primitives";

export const competencySkillSchema = z
  .object({
    label: nonEmptyString,
    description: nonEmptyString,
    emoji: nonEmptyString.optional(),
  })
  .strict();

const competencyCategorySchema = z
  .object({
    title: nonEmptyString,
    shortText: nonEmptyString.optional(),
    subTitle: nonEmptyString.optional(),
    icon: nonEmptyString.optional(),
    emoji: nonEmptyString.optional(),
    items: z.array(competencySkillSchema).optional(),
  })
  .strict();

export const competenciesSchema = z
  .object({
    categories: z.array(competencyCategorySchema).optional(),
    skills: z.array(nonEmptyString).optional(),
  })
  .strict();

export const hobbiesSchema = z
  .object({
    title: nonEmptyString,
    heroImageUrl: nonEmptyString.optional(),
    heroVideoUrl: nonEmptyString.nullable().optional(),
    items: z.array(nonEmptyString),
    introText: nonEmptyString.optional(),
  })
  .strict();

const aiShenaniganMediaPartSchema = z
  .object({
    title: nonEmptyString,
    src: nonEmptyString,
    caption: nonEmptyString.optional(),
    source: nonEmptyString.optional(),
    episodeNumber: z.number().int().positive().optional(),
  })
  .strict();

const aiShenaniganEntrySchema = z
  .object({
    slug: nonEmptyString,
    title: nonEmptyString,
    type: nonEmptyString.optional(),
    orientation: nonEmptyString.optional(),
    shortText: nonEmptyString.optional(),
    blurb: nonEmptyString.optional(),
    realisticImage: nonEmptyString.optional(),
    realisticSource: nonEmptyString.optional(),
    realisticCaption: nonEmptyString.optional(),
    stylizedRendering: nonEmptyString.optional(),
    stylizedSource: nonEmptyString.optional(),
    stylizedSourceHref: nonEmptyString.optional(),
    stylizedCaption: nonEmptyString.optional(),
    movieRendering: nonEmptyString.optional(),
    movieSource: nonEmptyString.optional(),
    movieCaption: nonEmptyString.optional(),
    movieRendering2: nonEmptyString.optional(),
    movieSource2: nonEmptyString.optional(),
    movieCaption2: nonEmptyString.optional(),
    trailerMovie: nonEmptyString.optional(),
    trailerSource: nonEmptyString.optional(),
    trailerCaption: nonEmptyString.optional(),
    trailerOrientation: nonEmptyString.optional(),
    rawImage: nonEmptyString.optional(),
    rawSource: nonEmptyString.optional(),
    rawCaption: nonEmptyString.optional(),
    analyzedImage: nonEmptyString.optional(),
    analyzedSource: nonEmptyString.optional(),
    analyzedSourceHref: nonEmptyString.optional(),
    analyzedCaption: nonEmptyString.optional(),
    palmLineAnalysisImage: nonEmptyString.optional(),
    palmLineAnalysisSource: nonEmptyString.optional(),
    palmLineAnalysisSourceHref: nonEmptyString.optional(),
    palmLineAnalysisCaption: nonEmptyString.optional(),
    palmReadingTitle: nonEmptyString.optional(),
    palmReadingMarkdownPath: nonEmptyString.optional(),
    palmReadingSource: nonEmptyString.optional(),
    palmReadingSourceHref: nonEmptyString.optional(),
    songAudio: nonEmptyString.optional(),
    songAudioSource: nonEmptyString.optional(),
    songAudioCaption: nonEmptyString.optional(),
    songAlbumImage: nonEmptyString.optional(),
    songAlbumSource: nonEmptyString.optional(),
    songLyricsMarkdownPath: nonEmptyString.optional(),
    songLyricsSource: nonEmptyString.optional(),
    songPerformedBy: nonEmptyString.optional(),
    songWrittenBy: nonEmptyString.optional(),
    manuscriptPdf: nonEmptyString.optional(),
    manuscriptSource: nonEmptyString.optional(),
    manuscriptCaption: nonEmptyString.optional(),
    episodesPdf: nonEmptyString.optional(),
    episodesSource: nonEmptyString.optional(),
    episodesCaption: nonEmptyString.optional(),
    episodeMedia: z.array(aiShenaniganMediaPartSchema).optional(),
    seriesParts: z.array(aiShenaniganMediaPartSchema).optional(),
    workParts: z.array(aiShenaniganMediaPartSchema).optional(),
    bookCoverImage: nonEmptyString.optional(),
    bookSource: nonEmptyString.optional(),
    bookCaption: nonEmptyString.optional(),
    pagerOptionImage: nonEmptyString.optional(),
    intentToCopyright: z.boolean().optional(),
    rightsNotice: nonEmptyString.optional(),
  })
  .strict();

export const aiShenanigansSchema = z
  .object({
    title: nonEmptyString.optional(),
    description: nonEmptyString.optional(),
    items: z.array(aiShenaniganEntrySchema),
  })
  .strict();
