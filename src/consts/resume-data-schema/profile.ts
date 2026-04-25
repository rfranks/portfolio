import { z } from "zod";
import { nonEmptyString } from "./primitives";

const contactSchema = z
  .object({
    linkedin: nonEmptyString.optional(),
    email: nonEmptyString.optional(),
    github: z.array(nonEmptyString).optional(),
  })
  .strict();

export const summarySchema = z
  .object({
    name: nonEmptyString,
    title: nonEmptyString,
    heroOverline: nonEmptyString.optional(),
    documentTitle: nonEmptyString.optional(),
    metadataTitle: nonEmptyString.optional(),
    metadataDescription: nonEmptyString.optional(),
    location: nonEmptyString.optional(),
    avatarImage: nonEmptyString.optional(),
    headshotImage: nonEmptyString.optional(),
    resumeUrl: nonEmptyString.optional(),
    contact: contactSchema.optional(),
    gutter: z.array(nonEmptyString).optional(),
  })
  .strict();

export const contactCtaSchema = z
  .object({
    title: nonEmptyString,
    body: nonEmptyString,
    primaryLabel: nonEmptyString,
    secondaryLabel: nonEmptyString.optional(),
  })
  .strict();
