import { APPLICATION_ACTIVITY_OUTCOMES, OFFER_DECISION_STATUSES } from "@/types";
import type {
  ApplicationActivity,
  ApplicationAttachment,
  ApplicationRecord,
  ApplicationStatus,
  ConnectorSyncSnapshot,
  ConnectorSyncState,
  JobListing,
  LinkedInProfileDetails,
  LinkedInProfileSnapshot,
  Message,
  MessageReply,
  NegotiationLibraryEntry,
  Offer,
  OfferComp,
  OfferDecision,
  OfferHistoryEntry,
  RecruiterEntry,
  ResumeEntry,
  StatusChange,
  User,
} from "@/types";
import type { ConnectorToken } from "@/types/connector";
import { STATUSES } from "./keyboard";
import type { TalentForgeGoalTag } from "./promptTypes";
import type {
  CustomPromptPlaceholder,
  CustomPromptPlaceholderType,
  CustomPromptTile,
  CustomPromptTileInput,
  CurrentCompensation,
  PipelineLayoutPreferences,
  StoreSchema,
  UserProfile,
} from "./dataStore";

const ROOT_PATH = "value";

type ParseSuccess<T> = { success: true; data: T };
type ParseFailure = { success: false; errors: string[] };
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export interface Schema<T> {
  safeParse(input: unknown, path?: string): ParseResult<T>;
  optional(): Schema<T | undefined>;
  readonly isOptional: boolean;
}

function failure<T>(errors: string[] | string): ParseResult<T> {
  return {
    success: false,
    errors: Array.isArray(errors) ? errors : [errors],
  };
}

function success<T>(data: T): ParseResult<T> {
  return { success: true, data };
}

function formatPath(path?: string): string {
  return path ?? ROOT_PATH;
}

function appendKey(path: string | undefined, key: string): string {
  return path ? `${path}.${key}` : key;
}

function appendIndex(path: string | undefined, index: number): string {
  return `${formatPath(path)}[${index}]`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createSchema<T>(
  validator: (input: unknown, path?: string) => ParseResult<T>,
  optional = false,
): Schema<T> {
  const schema: Schema<T> = {
    safeParse(input, path) {
      return validator(input, path);
    },
    optional() {
      return makeOptional(schema);
    },
    get isOptional() {
      return optional;
    },
  };
  return schema;
}

function makeOptional<T>(schema: Schema<T>): Schema<T | undefined> {
  return createSchema<T | undefined>((input, path) => {
    if (typeof input === "undefined") {
      return success(undefined);
    }
    const parsed = schema.safeParse(input, path);
    if (!parsed.success) {
      return parsed;
    }
    return success(parsed.data);
  }, true);
}

function stringSchema(): Schema<string> {
  return createSchema<string>((input, path) => {
    if (typeof input === "string") {
      return success(input);
    }
    return failure(`${formatPath(path)} must be a string`);
  });
}

function numberSchema(options?: { int?: boolean; nonnegative?: boolean }): Schema<number> {
  return createSchema<number>((input, path) => {
    if (typeof input !== "number" || Number.isNaN(input) || !Number.isFinite(input)) {
      return failure(`${formatPath(path)} must be a number`);
    }
    if (options?.int && !Number.isInteger(input)) {
      return failure(`${formatPath(path)} must be an integer`);
    }
    if (options?.nonnegative && input < 0) {
      return failure(`${formatPath(path)} must be non-negative`);
    }
    return success(input);
  });
}

function booleanSchema(): Schema<boolean> {
  return createSchema<boolean>((input, path) => {
    if (typeof input === "boolean") {
      return success(input);
    }
    return failure(`${formatPath(path)} must be a boolean`);
  });
}

function enumSchema<T extends string>(values: readonly T[]): Schema<T> {
  const set = new Set(values);
  return createSchema<T>((input, path) => {
    if (typeof input === "string" && set.has(input as T)) {
      return success(input as T);
    }
    return failure(`${formatPath(path)} must be one of: ${values.join(", ")}`);
  });
}

function arraySchema<T>(schema: Schema<T>): Schema<T[]> {
  return createSchema<T[]>((input, path) => {
    if (!Array.isArray(input)) {
      return failure(`${formatPath(path)} must be an array`);
    }
    const result: T[] = [];
    const errors: string[] = [];
    input.forEach((item, index) => {
      const parsed = schema.safeParse(item, appendIndex(path, index));
      if (parsed.success) {
        result.push(parsed.data);
      } else {
        errors.push(...parsed.errors);
      }
    });
    if (errors.length > 0) {
      return failure(errors);
    }
    return success(result);
  });
}

function recordSchema<T>(schema: Schema<T>): Schema<Record<string, T>> {
  return createSchema<Record<string, T>>((input, path) => {
    if (!isPlainObject(input)) {
      return failure(`${formatPath(path)} must be an object`);
    }
    const source = input as Record<string, unknown>;
    const result: Record<string, T> = {};
    const errors: string[] = [];
    for (const [key, value] of Object.entries(source)) {
      const parsed = schema.safeParse(value, appendKey(path, key));
      if (parsed.success) {
        result[key] = parsed.data;
      } else {
        errors.push(...parsed.errors);
      }
    }
    if (errors.length > 0) {
      return failure(errors);
    }
    return success(result);
  });
}

type Shape<T> = { [K in keyof T]?: Schema<T[K]> };

function objectSchema<T extends object>(
  shape: Shape<T>,
  options?: { allowUnknown?: boolean },
): Schema<T> {
  return createSchema<T>((input, path) => {
    if (!isPlainObject(input)) {
      return failure(`${formatPath(path)} must be an object`);
    }
    const source = input as Record<string, unknown>;
    const result: Record<string, unknown> = options?.allowUnknown === false ? {} : { ...source };
    const errors: string[] = [];

    for (const [rawKey, schema] of Object.entries(shape) as [keyof T & string, Schema<T[keyof T]>][]) {
      const value = source[rawKey];
      const nextPath = appendKey(path, rawKey);
      if (typeof value === "undefined") {
        if (schema.isOptional) {
          const parsed = schema.safeParse(value, nextPath);
          if (!parsed.success) {
            errors.push(...parsed.errors);
          } else if (parsed.data !== undefined) {
            result[rawKey] = parsed.data;
          } else if (rawKey in result) {
            delete result[rawKey];
          }
        } else {
          errors.push(`${nextPath} is required`);
        }
        continue;
      }
      const parsed = schema.safeParse(value, nextPath);
      if (!parsed.success) {
        errors.push(...parsed.errors);
      } else if (parsed.data === undefined) {
        delete result[rawKey];
      } else {
        result[rawKey] = parsed.data;
      }
    }

    if (errors.length > 0) {
      return failure(errors);
    }
    return success(result as T);
  });
}

const stringArraySchema = arraySchema(stringSchema());
const applicationStatusSchema = enumSchema<ApplicationStatus>(STATUSES);
const activityOutcomeSchema = enumSchema(APPLICATION_ACTIVITY_OUTCOMES);
const goalTagSchema = enumSchema<TalentForgeGoalTag>(["resume", "networking", "search"] as const);
const promptContextSchema = enumSchema(["resume", "offers", "messaging", "jobSearch"] as const);
const placeholderTypeSchema = enumSchema<CustomPromptPlaceholderType>([
  "shortText",
  "longText",
  "resume",
  "jobApplication",
  "offer",
  "currentCompensation",
  "userProfile",
  "goals",
] as const);

const statusChangeSchema = objectSchema<StatusChange>({
  status: applicationStatusSchema,
  changedAt: stringSchema(),
  reason: stringSchema().optional(),
});

const jobListingSchema = objectSchema<JobListing>({
  title: stringSchema(),
  company: stringSchema(),
  location: stringSchema(),
  description: stringSchema().optional(),
  url: stringSchema(),
  source: stringSchema(),
});

const parsedResumeSchema = objectSchema<ResumeEntry["parsed"]>({
  contact: stringSchema(),
  experience: stringArraySchema,
  education: stringArraySchema,
  skills: stringArraySchema,
});

const resumeEntrySchema = objectSchema<ResumeEntry>({
  id: stringSchema(),
  userId: stringSchema(),
  label: stringSchema(),
  title: stringSchema(),
  url: stringSchema(),
  content: stringSchema(),
  parsed: parsedResumeSchema,
  tags: stringArraySchema,
  notes: stringSchema().optional(),
  sourceFilename: stringSchema().optional(),
  importedAt: stringSchema().optional(),
});

const userProfileSchema = objectSchema<UserProfile>({
  id: stringSchema(),
  name: stringSchema(),
  email: stringSchema(),
  firstName: stringSchema().optional(),
  lastName: stringSchema().optional(),
});

const applicantSchema = objectSchema<User>({
  id: stringSchema(),
  name: stringSchema(),
  email: stringSchema(),
  firstName: stringSchema().optional(),
  lastName: stringSchema().optional(),
});

const messageReplySchema = objectSchema<MessageReply>({
  id: stringSchema(),
  body: stringSchema(),
  sentAt: stringSchema(),
  connector: stringSchema(),
});

const messageSchema = objectSchema<Message>({
  id: stringSchema(),
  threadId: stringSchema(),
  senderId: stringSchema(),
  recruiterId: stringSchema().optional(),
  applicationId: stringSchema().optional(),
  sentAt: stringSchema(),
  body: stringSchema(),
  connector: stringSchema(),
  status: enumSchema(["unread", "read"] as const),
  replies: arraySchema(messageReplySchema),
});

const offerCompSchema = objectSchema<OfferComp>({
  type: stringSchema(),
  amount: numberSchema(),
  notes: stringSchema().optional(),
});

const offerDecisionSchema = objectSchema<OfferDecision>({
  status: enumSchema(OFFER_DECISION_STATUSES),
  decidedAt: stringSchema().optional(),
  notes: stringSchema().optional(),
});

const offerHistoryEntrySchema = objectSchema<OfferHistoryEntry>({
  id: stringSchema(),
  createdAt: stringSchema(),
  sourceLabel: stringSchema(),
  content: stringSchema(),
});

const applicationAttachmentSchema = objectSchema<ApplicationAttachment>({
  id: stringSchema(),
  name: stringSchema(),
  mimeType: stringSchema(),
  content: stringSchema(),
});

const applicationActivitySchema = objectSchema<ApplicationActivity>({
  id: stringSchema(),
  tileId: stringSchema(),
  createdAt: stringSchema(),
  summary: stringSchema(),
  outcome: activityOutcomeSchema,
  generatedContentId: stringSchema().optional(),
  error: stringSchema().optional(),
});

const recruiterEntrySchema = objectSchema<RecruiterEntry>({
  id: stringSchema(),
  name: stringSchema(),
  email: stringSchema().optional(),
  connector: stringSchema(),
  tags: stringArraySchema,
  notes: stringSchema(),
  threadIds: stringArraySchema,
});

const negotiationLibraryEntrySchema = objectSchema<NegotiationLibraryEntry>({
  id: stringSchema(),
  label: stringSchema(),
  content: stringSchema(),
  createdAt: stringSchema(),
  updatedAt: stringSchema(),
});

const customPromptPlaceholderSchema = objectSchema<CustomPromptPlaceholder>({
  id: stringSchema(),
  label: stringSchema(),
  type: placeholderTypeSchema,
  helperText: stringSchema().optional(),
  required: booleanSchema().optional(),
});

const connectorTokenSchema = objectSchema<ConnectorToken>({
  accessToken: stringSchema(),
  refreshToken: stringSchema().optional(),
  expiresAt: numberSchema({ int: true, nonnegative: true }).optional(),
});

const connectorSyncStateSchema = objectSchema<ConnectorSyncState>({
  status: enumSchema(["idle", "syncing", "success", "error"] as const),
  lastAttemptedAt: stringSchema().optional(),
  lastSuccessfulAt: stringSchema().optional(),
  error: stringSchema().optional(),
});

const linkedinProfileDetailsSchema = objectSchema<LinkedInProfileDetails>({
  id: stringSchema(),
  firstName: stringSchema(),
  lastName: stringSchema(),
  headline: stringSchema().optional(),
  location: stringSchema().optional(),
  industry: stringSchema().optional(),
  summary: stringSchema().optional(),
  connections: numberSchema({ int: true, nonnegative: true }).optional(),
});

const linkedinProfileSnapshotSchema = objectSchema<LinkedInProfileSnapshot>({
  capturedAt: stringSchema().optional(),
  error: stringSchema().optional(),
  profile: linkedinProfileDetailsSchema.optional(),
  listings: arraySchema(jobListingSchema),
});

const currentCompensationSchema = objectSchema<CurrentCompensation>({
  salary: stringSchema(),
  benefits: stringSchema(),
  stock: stringSchema(),
});

const pipelineLayoutSchema = objectSchema<PipelineLayoutPreferences>({
  order: arraySchema(applicationStatusSchema),
  collapsed: arraySchema(applicationStatusSchema),
});

const customPromptTileBaseSchema = objectSchema<CustomPromptTile>({
  id: stringSchema(),
  displayName: stringSchema(),
  fullText: stringSchema(),
  contexts: arraySchema(promptContextSchema),
  placeholders: arraySchema(customPromptPlaceholderSchema),
  createdAt: stringSchema().optional(),
  updatedAt: stringSchema().optional(),
});

const rolePostingSchema = objectSchema<ApplicationRecord["role"]>({
  id: stringSchema(),
  title: stringSchema(),
  company: stringSchema(),
  location: stringSchema().optional(),
  description: stringSchema().optional(),
  url: stringSchema().optional(),
  source: stringSchema().optional(),
});

const customPromptTileSchema: Schema<CustomPromptTile> = createSchema(
  (input, path) => {
    const parsed = customPromptTileBaseSchema.safeParse(input, path);
    if (!parsed.success) {
      return parsed;
    }
    const tile = parsed.data;
    if (!Array.isArray(tile.contexts) || tile.contexts.length === 0) {
      return failure(`${appendKey(path, "contexts")} must include at least one context`);
    }
    if (!Array.isArray(tile.placeholders) || tile.placeholders.length === 0) {
      return failure(`${appendKey(path, "placeholders")} must include at least one placeholder`);
    }
    return success(tile);
  },
);

const offerSchema: Schema<Offer> = createSchema((input, path) => {
  if (!isPlainObject(input)) {
    return failure(`${formatPath(path)} must be an object`);
  }
  const source = input as Offer & Record<string, unknown>;
  const errors: string[] = [];

  if (typeof source.id !== "string") {
    errors.push(`${appendKey(path, "id")} must be a string`);
  }

  if (!isPlainObject(source.application)) {
    errors.push(`${appendKey(path, "application")} must be an object`);
  }

  const compensationResult = arraySchema(offerCompSchema).safeParse(
    (source as { compensation?: unknown }).compensation,
    appendKey(path, "compensation"),
  );
  if (!compensationResult.success) {
    errors.push(...compensationResult.errors);
  }

  const summaryResult = arraySchema(stringSchema()).optional().safeParse(
    (source as { summary?: unknown }).summary,
    appendKey(path, "summary"),
  );
  if (!summaryResult.success) {
    errors.push(...summaryResult.errors);
  }

  const decisionResult = offerDecisionSchema.optional().safeParse(
    (source as { decision?: unknown }).decision,
    appendKey(path, "decision"),
  );
  if (!decisionResult.success) {
    errors.push(...decisionResult.errors);
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  const result: Offer = {
    ...source,
    compensation: compensationResult.success ? compensationResult.data : [],
  };

  if (summaryResult.success) {
    if (summaryResult.data === undefined) {
      delete (result as { summary?: string[] }).summary;
    } else {
      result.summary = summaryResult.data;
    }
  }

  if (decisionResult.success) {
    if (decisionResult.data === undefined) {
      delete (result as { decision?: OfferDecision }).decision;
    } else {
      result.decision = decisionResult.data;
    }
  }

  return success(result);
});

const jobApplicationSchema: Schema<ApplicationRecord> = createSchema((input, path) => {
  if (!isPlainObject(input)) {
    return failure(`${formatPath(path)} must be an object`);
  }
  const source = input as ApplicationRecord & Record<string, unknown>;
  const errors: string[] = [];

  if (typeof source.id !== "string") {
    errors.push(`${appendKey(path, "id")} must be a string`);
  }

  const applicantResult = applicantSchema.safeParse(source.applicant, appendKey(path, "applicant"));
  if (!applicantResult.success) {
    errors.push(...applicantResult.errors);
  }

  const roleResult = rolePostingSchema.safeParse(source.role, appendKey(path, "role"));
  if (!roleResult.success) {
    errors.push(...roleResult.errors);
  }

  const statusResult = applicationStatusSchema.safeParse(source.status, appendKey(path, "status"));
  if (!statusResult.success) {
    errors.push(...statusResult.errors);
  }

  const historyResult = arraySchema(statusChangeSchema).safeParse(
    (source as { history?: unknown }).history,
    appendKey(path, "history"),
  );
  if (!historyResult.success) {
    errors.push(...historyResult.errors);
  }

  const resumeResult = resumeEntrySchema.optional().safeParse(
    (source as { resumeVariant?: unknown }).resumeVariant,
    appendKey(path, "resumeVariant"),
  );
  if (!resumeResult.success) {
    errors.push(...resumeResult.errors);
  }

  const nextActionResult = stringSchema().optional().safeParse(
    (source as { nextAction?: unknown }).nextAction,
    appendKey(path, "nextAction"),
  );
  if (!nextActionResult.success) {
    errors.push(...nextActionResult.errors);
  }

  const dueAtResult = stringSchema().optional().safeParse(
    (source as { dueAt?: unknown }).dueAt,
    appendKey(path, "dueAt"),
  );
  if (!dueAtResult.success) {
    errors.push(...dueAtResult.errors);
  }

  const interviewDateResult = stringSchema().optional().safeParse(
    (source as { interviewDateTime?: unknown }).interviewDateTime,
    appendKey(path, "interviewDateTime"),
  );
  if (!interviewDateResult.success) {
    errors.push(...interviewDateResult.errors);
  }

  const interviewLocationResult = stringSchema().optional().safeParse(
    (source as { interviewLocation?: unknown }).interviewLocation,
    appendKey(path, "interviewLocation"),
  );
  if (!interviewLocationResult.success) {
    errors.push(...interviewLocationResult.errors);
  }

  const recruitersResult = arraySchema(recruiterEntrySchema).optional().safeParse(
    (source as { recruiters?: unknown }).recruiters,
    appendKey(path, "recruiters"),
  );
  if (!recruitersResult.success) {
    errors.push(...recruitersResult.errors);
  }

  const threadsResult = arraySchema(messageSchema).optional().safeParse(
    (source as { threads?: unknown }).threads,
    appendKey(path, "threads"),
  );
  if (!threadsResult.success) {
    errors.push(...threadsResult.errors);
  }

  const offerResult = offerSchema.optional().safeParse(
    (source as { offer?: unknown }).offer,
    appendKey(path, "offer"),
  );
  if (!offerResult.success) {
    errors.push(...offerResult.errors);
  }

  const decisionResult = offerDecisionSchema.optional().safeParse(
    (source as { decision?: unknown }).decision,
    appendKey(path, "decision"),
  );
  if (!decisionResult.success) {
    errors.push(...decisionResult.errors);
  }

  const historyEntriesResult = arraySchema(offerHistoryEntrySchema).optional().safeParse(
    (source as { offerHistory?: unknown }).offerHistory,
    appendKey(path, "offerHistory"),
  );
  if (!historyEntriesResult.success) {
    errors.push(...historyEntriesResult.errors);
  }

  const attachmentsResult = arraySchema(applicationAttachmentSchema).optional().safeParse(
    (source as { attachments?: unknown }).attachments,
    appendKey(path, "attachments"),
  );
  if (!attachmentsResult.success) {
    errors.push(...attachmentsResult.errors);
  }

  const activitiesResult = arraySchema(applicationActivitySchema).optional().safeParse(
    (source as { activities?: unknown }).activities,
    appendKey(path, "activities"),
  );
  if (!activitiesResult.success) {
    errors.push(...activitiesResult.errors);
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  const result: ApplicationRecord = {
    ...source,
    applicant: applicantResult.success ? applicantResult.data : source.applicant,
    role: roleResult.success ? roleResult.data : source.role,
    status: statusResult.success ? statusResult.data : source.status,
    history: historyResult.success ? historyResult.data : [],
  };

  if (resumeResult.success) {
    if (resumeResult.data === undefined) {
      delete (result as { resumeVariant?: ResumeEntry }).resumeVariant;
    } else {
      result.resumeVariant = resumeResult.data;
    }
  }

  if (nextActionResult.success) {
    if (nextActionResult.data === undefined) {
      delete (result as { nextAction?: string }).nextAction;
    } else {
      result.nextAction = nextActionResult.data;
    }
  }

  if (dueAtResult.success) {
    if (dueAtResult.data === undefined) {
      delete (result as { dueAt?: string }).dueAt;
    } else {
      result.dueAt = dueAtResult.data;
    }
  }

  if (interviewDateResult.success) {
    if (interviewDateResult.data === undefined) {
      delete (result as { interviewDateTime?: string }).interviewDateTime;
    } else {
      result.interviewDateTime = interviewDateResult.data;
    }
  }

  if (interviewLocationResult.success) {
    if (interviewLocationResult.data === undefined) {
      delete (result as { interviewLocation?: string }).interviewLocation;
    } else {
      result.interviewLocation = interviewLocationResult.data;
    }
  }

  if (recruitersResult.success) {
    if (recruitersResult.data === undefined) {
      delete (result as { recruiters?: RecruiterEntry[] }).recruiters;
    } else {
      result.recruiters = recruitersResult.data;
    }
  }

  if (threadsResult.success) {
    if (threadsResult.data === undefined) {
      delete (result as { threads?: Message[] }).threads;
    } else {
      result.threads = threadsResult.data as unknown as NonNullable<ApplicationRecord["threads"]>;
    }
  }

  if (offerResult.success) {
    if (offerResult.data === undefined) {
      delete (result as { offer?: Offer }).offer;
    } else {
      result.offer = offerResult.data;
    }
  }

  if (decisionResult.success) {
    if (decisionResult.data === undefined) {
      delete (result as { decision?: OfferDecision }).decision;
    } else {
      result.decision = decisionResult.data;
    }
  }

  if (historyEntriesResult.success) {
    if (historyEntriesResult.data === undefined) {
      delete (result as { offerHistory?: OfferHistoryEntry[] }).offerHistory;
    } else {
      result.offerHistory = historyEntriesResult.data;
    }
  }

  if (attachmentsResult.success) {
    if (attachmentsResult.data === undefined) {
      delete (result as { attachments?: ApplicationAttachment[] }).attachments;
    } else {
      result.attachments = attachmentsResult.data;
    }
  }

  if (activitiesResult.success) {
    if (activitiesResult.data === undefined) {
      delete (result as { activities?: ApplicationActivity[] }).activities;
    } else {
      result.activities = activitiesResult.data;
    }
  }

  return success(result);
});

const connectorSyncSnapshotSchema = recordSchema(connectorSyncStateSchema);
const autoReplyTemplatesSchema = recordSchema(stringSchema());
const goalsSchema = arraySchema(goalTagSchema);
const customPromptTileListSchema = arraySchema(customPromptTileSchema);
const negotiationLibrarySchema = arraySchema(negotiationLibraryEntrySchema);
const messagesSchema = arraySchema(messageSchema);
const offersSchema = arraySchema(offerSchema);
const applicationsSchema = arraySchema(jobApplicationSchema);
const resumesSchema = arraySchema(resumeEntrySchema);
const recruitersSchema = arraySchema(recruiterEntrySchema);

export const storeSchemas: { [K in keyof StoreSchema]: Schema<StoreSchema[K]> } = {
  user: userProfileSchema.optional(),
  resumes: resumesSchema,
  messages: messagesSchema,
  offers: offersSchema,
  applications: applicationsSchema,
  recruiters: recruitersSchema,
  onboarding: numberSchema({ int: true, nonnegative: true }),
  openai: stringSchema().optional(),
  connectorTokens: recordSchema(connectorTokenSchema),
  connectorSyncSnapshot: connectorSyncSnapshotSchema,
  linkedinProfileSnapshot: linkedinProfileSnapshotSchema,
  autoReplyTemplates: autoReplyTemplatesSchema,
  currentCompensation: currentCompensationSchema,
  goals: goalsSchema,
  pipelineLayout: pipelineLayoutSchema,
  negotiationLibrary: negotiationLibrarySchema,
  customPromptTiles: customPromptTileListSchema,
};
