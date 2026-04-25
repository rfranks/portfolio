import { z } from "zod";
import { nonEmptyString } from "./primitives";
import { visualMarkSchema } from "./projects";

export const experienceEntrySchema = z
  .object({
    company: nonEmptyString,
    position: z.string().optional(),
    location: nonEmptyString.optional(),
    start: nonEmptyString.optional(),
    end: nonEmptyString.optional(),
    details: z.array(nonEmptyString).optional(),
    achievements: z.array(nonEmptyString).optional(),
    image: nonEmptyString.optional(),
  })
  .strict();

export const educationEntrySchema = z
  .object({
    school: nonEmptyString,
    schoolUrl: nonEmptyString.optional(),
    degree: nonEmptyString.optional(),
    year: nonEmptyString.optional(),
    image: nonEmptyString.optional(),
    awards: z.array(nonEmptyString).optional(),
  })
  .strict();

const recognitionSnippetSchema = z.union([
  nonEmptyString,
  z
    .object({
      text: nonEmptyString,
      glyph: nonEmptyString.optional(),
    })
    .strict(),
]);

const recommendationEntrySchema = z
  .object({
    name: nonEmptyString,
    title: nonEmptyString.optional(),
    date: nonEmptyString.optional(),
    relationship: nonEmptyString.optional(),
    text: nonEmptyString,
    imageSrcUrl: nonEmptyString.optional(),
  })
  .strict();

const githubAchievementSchema = z
  .object({
    name: nonEmptyString,
    slug: nonEmptyString,
    imageSrcUrl: nonEmptyString,
    achievementUrl: nonEmptyString,
    source: nonEmptyString,
    tier: nonEmptyString.optional(),
  })
  .strict();

export const recognitionSchema = z
  .object({
    snippets: z.array(recognitionSnippetSchema).optional(),
    githubAchievements: z.array(githubAchievementSchema).optional(),
    recommendations: z.array(recommendationEntrySchema).optional(),
  })
  .strict();

export const projectsSectionSchema = z
  .object({
    title: nonEmptyString,
    descriptionLines: z.array(nonEmptyString),
    launchLabel: nonEmptyString,
    interestHeading: nonEmptyString,
    accoladesHeading: nonEmptyString,
    marks: z.array(visualMarkSchema).optional(),
  })
  .strict();
