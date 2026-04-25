import { z } from "zod";
import {
  assertResumeSchemaGovernance,
  getLatestResumeSchemaChangeLogEntry,
  RESUME_DATA_SCHEMA_CHANGELOG,
  RESUME_SCHEMA_BREAKING_FIELDS_APPROVAL_ENV,
  type ResumeSchemaChangeLogEntry,
} from "./resume-data-schema/governance";
import { navigationSchema } from "./resume-data-schema/navigation";
import { portfolioAppsSchema } from "./resume-data-schema/portfolioApps";
import { contactCtaSchema, summarySchema } from "./resume-data-schema/profile";
import {
  aiShenanigansSchema,
  competenciesSchema,
  hobbiesSchema,
} from "./resume-data-schema/profileSections";
import { projectEntrySchema } from "./resume-data-schema/projects";
import {
  educationEntrySchema,
  experienceEntrySchema,
  projectsSectionSchema,
  recognitionSchema,
} from "./resume-data-schema/records";
import { nonEmptyString } from "./resume-data-schema/primitives";
import { LATEST_RESUME_DATA_SCHEMA_VERSION } from "@/utils/data/migrations/resumeDataMigrations";

export {
  assertResumeSchemaGovernance,
  getLatestResumeSchemaChangeLogEntry,
  RESUME_DATA_SCHEMA_CHANGELOG,
  RESUME_SCHEMA_BREAKING_FIELDS_APPROVAL_ENV,
};

export type { ResumeSchemaChangeLogEntry };

export const resumeDataSchema = z
  .object({
    schemaVersion: z.literal(LATEST_RESUME_DATA_SCHEMA_VERSION).optional(),
    summary: summarySchema,
    contactCTA: contactCtaSchema,
    portfolioApps: portfolioAppsSchema,
    navigation: navigationSchema,
    competencies: competenciesSchema,
    coreCompetencies: z.array(nonEmptyString),
    hobbies: hobbiesSchema,
    aiShenanigans: aiShenanigansSchema,
    projects: z.array(projectEntrySchema),
    experience: z.array(experienceEntrySchema),
    recognition: recognitionSchema,
    education: z.array(educationEntrySchema),
    projectsSection: projectsSectionSchema,
  })
  .superRefine((data, ctx) => {
    const seenProjectHrefs = new Map<string, number>();
    data.projects.forEach((project, index) => {
      const priorIndex = seenProjectHrefs.get(project.href);
      if (priorIndex !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["projects", index, "href"],
          message: `Duplicate project href also used at projects.${priorIndex}.href`,
        });
        return;
      }
      seenProjectHrefs.set(project.href, index);
    });
  })
  .strict();

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
  assertResumeSchemaGovernance();
  const parsed = resumeDataSchema.safeParse(input);
  if (!parsed.success) {
    const details = formatZodIssues(parsed.error.issues);
    throw new Error(`Invalid ${source} shape: ${details}`);
  }
  return parsed.data;
}
