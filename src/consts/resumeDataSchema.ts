import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

const contactSchema = z
  .object({
    linkedin: nonEmptyString.optional(),
    email: nonEmptyString.optional(),
    github: z.array(nonEmptyString).optional(),
  })
  .passthrough();

const summarySchema = z
  .object({
    name: nonEmptyString,
    title: nonEmptyString,
    location: nonEmptyString.optional(),
    resumeUrl: nonEmptyString.optional(),
    contact: contactSchema.optional(),
    gutter: z.array(nonEmptyString).optional(),
  })
  .passthrough();

const projectEntrySchema = z
  .object({
    name: nonEmptyString,
    description: nonEmptyString,
    href: nonEmptyString,
    type: z.enum(["personal", "work"]).or(nonEmptyString),
    interestsMeWhy: nonEmptyString,
  })
  .passthrough();

const experienceEntrySchema = z
  .object({
    company: nonEmptyString,
    position: z.string().optional(),
    location: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    details: z.array(nonEmptyString).optional(),
    achievements: z.array(nonEmptyString).optional(),
    image: z.string().optional(),
  })
  .passthrough();

const educationEntrySchema = z
  .object({
    school: nonEmptyString,
    degree: z.string().optional(),
    year: z.string().optional(),
    image: z.string().optional(),
    awards: z.array(nonEmptyString).optional(),
  })
  .passthrough();

const recognitionSnippetSchema = z.union([
  nonEmptyString,
  z
    .object({
      text: nonEmptyString,
      glyph: z.string().optional(),
    })
    .passthrough(),
]);

const recommendationEntrySchema = z
  .object({
    name: nonEmptyString,
    title: z.string().optional(),
    date: z.string().optional(),
    relationship: z.string().optional(),
    text: nonEmptyString,
    imageSrcUrl: z.string().optional(),
  })
  .passthrough();

const recognitionSchema = z
  .object({
    snippets: z.array(recognitionSnippetSchema).optional(),
    recommendations: z.array(recommendationEntrySchema).optional(),
  })
  .passthrough();

const competencySkillSchema = z
  .object({
    label: nonEmptyString,
    description: nonEmptyString,
  })
  .passthrough();

const competencyCategorySchema = z
  .object({
    title: nonEmptyString,
    shortText: z.string().optional(),
    subTitle: z.string().optional(),
    icon: z.string().optional(),
    items: z.array(competencySkillSchema).optional(),
  })
  .passthrough();

const competenciesSchema = z
  .object({
    categories: z.array(competencyCategorySchema).optional(),
    skills: z.array(nonEmptyString).optional(),
  })
  .passthrough();

const aiShenaniganEntrySchema = z
  .object({
    slug: nonEmptyString,
    title: nonEmptyString,
  })
  .passthrough();

const aiShenanigansSchema = z
  .object({
    items: z.array(aiShenaniganEntrySchema).optional(),
  })
  .passthrough();

export const resumeDataSchema = z
  .object({
    summary: summarySchema,
    projects: z.array(projectEntrySchema),
    experience: z.array(experienceEntrySchema).optional(),
    education: z.array(educationEntrySchema).optional(),
    recognition: recognitionSchema.optional(),
    competencies: competenciesSchema.optional(),
    aiShenanigans: aiShenanigansSchema.optional(),
  })
  .passthrough();

export type ResumeDataSchemaType = z.infer<typeof resumeDataSchema>;

const formatZodIssues = (issues: z.ZodIssue[]) =>
  issues
    .slice(0, 10)
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");

export function parseResumeDataWithSchema(
  input: unknown,
  source = "resumeData",
): ResumeDataSchemaType {
  const parsed = resumeDataSchema.safeParse(input);
  if (!parsed.success) {
    const details = formatZodIssues(parsed.error.issues);
    throw new Error(`Invalid ${source} shape: ${details}`);
  }
  return parsed.data;
}

