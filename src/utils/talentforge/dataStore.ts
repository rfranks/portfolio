"use client";

import {
  loadItem,
  saveItem,
  deleteItem,
} from "@/utils/storage";
import { v4 as uuid } from "uuid";
import { ConnectorToken } from "@/types/connector";
import type {
  ApplicationStatus,
  JobListing,
  StatusChange,
  User,
  ResumeEntry,
  Message,
  MessageReply,
  Offer,
  ApplicationRecord,
  ApplicationAttachment,
  OfferHistoryEntry,
  NegotiationLibraryEntry,
  OfferComp,
  OfferDecision,
  OfferDecisionStatus,
  RecruiterEntry,
  ConnectorSyncSnapshot,
  ConnectorSyncState,
  ConnectorSyncStatus,
  LinkedInProfileDetails,
  LinkedInProfileSnapshot,
  ApplicationActivity,
} from "@/types";
import {
  OFFER_DECISION_DEFAULT_STATUS,
  OFFER_DECISION_STATUSES,
} from "@/types";
import { AUTO_REPLY_TEMPLATES } from "@/utils/autoReply/templates";
import type { PromptContext, TalentForgeGoalTag } from "./promptTypes";
import { STATUSES } from "./keyboard";
import { PROMPT_TILES } from "@/consts/promptTiles";

export type UserProfile = User;

export type JobApplication = ApplicationRecord;

export interface CurrentCompensation {
  salary: string;
  benefits: string;
  stock: string;
}

export interface PipelineLayoutPreferences {
  order: ApplicationStatus[];
  collapsed: ApplicationStatus[];
}

export type CustomPromptPlaceholderType =
  | "shortText"
  | "longText"
  | "resume"
  | "jobApplication"
  | "offer"
  | "currentCompensation"
  | "userProfile"
  | "goals";

export interface CustomPromptPlaceholder {
  id: string;
  label: string;
  type: CustomPromptPlaceholderType;
  helperText?: string;
  required?: boolean;
}

export interface CustomPromptTile {
  id: string;
  displayName: string;
  fullText: string;
  contexts: PromptContext[];
  placeholders: CustomPromptPlaceholder[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomPromptTileInput
  extends Omit<CustomPromptTile, "id" | "createdAt" | "updatedAt"> {
  id?: string;
}

interface StoreSchema {
  user: UserProfile | undefined;
  resumes: ResumeEntry[];
  messages: Message[];
  offers: Offer[];
  applications: JobApplication[];
  recruiters: RecruiterEntry[];
  onboarding: number;
  openai: string | undefined;
  connectorTokens: Record<string, ConnectorToken>;
  connectorSyncSnapshot: ConnectorSyncSnapshot;
  linkedinProfileSnapshot: LinkedInProfileSnapshot;
  autoReplyTemplates: Record<string, string>;
  currentCompensation: CurrentCompensation;
  goals: TalentForgeGoalTag[];
  pipelineLayout: PipelineLayoutPreferences;
  negotiationLibrary: NegotiationLibraryEntry[];
  customPromptTiles: CustomPromptTile[];
}

// Storage keys for each entity
const KEYS: { [K in keyof StoreSchema]: string } = {
  user: "userProfile",
  resumes: "resumes",
  messages: "messages",
  offers: "offers",
  applications: "jobApplications",
  recruiters: "recruiters",
  onboarding: "onboardingStep",
  openai: "talentforge-openai-key",
  connectorTokens: "connectorTokens",
  connectorSyncSnapshot: "connectorSyncSnapshot",
  linkedinProfileSnapshot: "linkedinProfileSnapshot",
  autoReplyTemplates: "autoReplyTemplates",
  currentCompensation: "currentCompensation",
  goals: "talentforge-goals",
  pipelineLayout: "pipelineLayout",
  negotiationLibrary: "negotiationLibrary",
  customPromptTiles: "customPromptTiles",
} as const;

const LEGACY_GOALS_KEY = "talentforge-goal-selections";
const KNOWN_GOAL_TAGS: readonly TalentForgeGoalTag[] = [
  "resume",
  "networking",
  "search",
];
const LEGACY_GOAL_SELECTIONS_VERSION = 1;

const KNOWN_PROMPT_CONTEXTS: readonly PromptContext[] = [
  "resume",
  "offers",
  "messaging",
  "jobSearch",
];

const CUSTOM_PLACEHOLDER_TYPES: readonly CustomPromptPlaceholderType[] = [
  "shortText",
  "longText",
  "resume",
  "jobApplication",
  "offer",
  "currentCompensation",
  "userProfile",
  "goals",
];

const DEFAULT_PROMPT_TILE_IDS = new Set(
  Object.keys(PROMPT_TILES).map((id) => id.toLowerCase()),
);

// Version constants per entity so tests and other modules can reference them.
export const USER_VERSION = 1;
export const RESUMES_VERSION = 1;
export const MESSAGES_VERSION = 2;
export const OFFERS_VERSION = 3;
export const APPLICATIONS_VERSION = 7;
export const RECRUITERS_VERSION = 1;
export const ONBOARDING_VERSION = 1;
export const OPENAI_VERSION = 1;
export const CONNECTOR_TOKENS_VERSION = 1;
export const CONNECTOR_SYNC_SNAPSHOT_VERSION = 1;
export const LINKEDIN_PROFILE_SNAPSHOT_VERSION = 1;
export const AUTO_REPLY_TEMPLATES_VERSION = 1;
export const CURRENT_COMP_VERSION = 1;
export const GOALS_VERSION = 1;
export const PIPELINE_LAYOUT_VERSION = 1;
export const NEGOTIATION_LIBRARY_VERSION = 1;
export const CUSTOM_PROMPT_TILES_VERSION = 1;

const VERSION: { [K in keyof StoreSchema]: number } = {
  user: USER_VERSION,
  resumes: RESUMES_VERSION,
  messages: MESSAGES_VERSION,
  offers: OFFERS_VERSION,
  applications: APPLICATIONS_VERSION,
  recruiters: RECRUITERS_VERSION,
  onboarding: ONBOARDING_VERSION,
  openai: OPENAI_VERSION,
  connectorTokens: CONNECTOR_TOKENS_VERSION,
  connectorSyncSnapshot: CONNECTOR_SYNC_SNAPSHOT_VERSION,
  linkedinProfileSnapshot: LINKEDIN_PROFILE_SNAPSHOT_VERSION,
  autoReplyTemplates: AUTO_REPLY_TEMPLATES_VERSION,
  currentCompensation: CURRENT_COMP_VERSION,
  goals: GOALS_VERSION,
  pipelineLayout: PIPELINE_LAYOUT_VERSION,
  negotiationLibrary: NEGOTIATION_LIBRARY_VERSION,
  customPromptTiles: CUSTOM_PROMPT_TILES_VERSION,
} as const;

export const SNAPSHOT_VERSION = 11;

const CONTEXT_SET = new Set<PromptContext>(KNOWN_PROMPT_CONTEXTS);
const PLACEHOLDER_TYPE_SET = new Set<CustomPromptPlaceholderType>(
  CUSTOM_PLACEHOLDER_TYPES as CustomPromptPlaceholderType[],
);

type CustomPromptTileLike = Partial<CustomPromptTileInput> & {
  placeholders?: unknown[];
  display?: string;
  fullPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
};

function sanitizePlaceholder(value: unknown): CustomPromptPlaceholder | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CustomPromptPlaceholder> & {
    id?: string | number;
  };
  const type = candidate.type;
  if (!type || !PLACEHOLDER_TYPE_SET.has(type as CustomPromptPlaceholderType)) {
    return null;
  }
  const idValue =
    typeof candidate.id === "string"
      ? candidate.id
      : typeof candidate.id === "number"
        ? String(candidate.id)
        : "";
  const labelValue =
    typeof candidate.label === "string"
      ? candidate.label
      : typeof candidate.label === "number"
        ? String(candidate.label)
        : "";
  const id = idValue.trim().replace(/\s+/g, "_");
  const label = labelValue.trim();
  if (!id || !label) {
    return null;
  }
  const helperText =
    typeof candidate.helperText === "string"
      ? candidate.helperText.trim() || undefined
      : undefined;
  const required = candidate.required === false ? false : true;
  return {
    id,
    label,
    type: type as CustomPromptPlaceholderType,
    helperText,
    required,
  };
}

function sanitizeCustomPromptTileInput(
  tile: CustomPromptTileLike,
  id: string,
  previous?: CustomPromptTile,
): CustomPromptTile | null {
  const displaySource =
    typeof tile.displayName === "string"
      ? tile.displayName
      : typeof tile.display === "string"
        ? tile.display
        : "";
  const displayName = displaySource.trim();
  if (!displayName) return null;

  const contextsInput = Array.isArray(tile.contexts) ? tile.contexts : [];
  const contexts = Array.from(
    new Set(
      contextsInput
        .map((ctx) => ctx as PromptContext)
        .filter((ctx): ctx is PromptContext => CONTEXT_SET.has(ctx)),
    ),
  );
  if (contexts.length === 0) {
    contexts.push("resume");
  }

  const rawPlaceholders = Array.isArray(tile.placeholders)
    ? tile.placeholders
    : [];
  const placeholders: CustomPromptPlaceholder[] = [];
  const seen = new Set<string>();
  for (const raw of rawPlaceholders) {
    const sanitized = sanitizePlaceholder(raw);
    if (!sanitized) continue;
    if (seen.has(sanitized.id)) continue;
    placeholders.push(sanitized);
    seen.add(sanitized.id);
  }
  if (placeholders.length === 0) {
    return null;
  }

  const fullTextSource =
    typeof tile.fullText === "string"
      ? tile.fullText
      : typeof tile.fullPrompt === "string"
        ? tile.fullPrompt
        : tile.fullText !== undefined && tile.fullText !== null
          ? String(tile.fullText)
          : "";

  const now = new Date().toISOString();
  const createdAt =
    typeof tile.createdAt === "string"
      ? tile.createdAt
      : previous?.createdAt ?? now;

  const updatedAt =
    typeof tile.updatedAt === "string" ? tile.updatedAt : now;

  return {
    id,
    displayName,
    fullText: fullTextSource,
    contexts,
    placeholders,
    createdAt,
    updatedAt,
  };
}

function ensureCustomPromptId(
  candidate: string,
  current: CustomPromptTile[],
  previousId?: string,
): string {
  const trimmed = candidate.trim();
  const base = trimmed || uuid();
  const previousLower = previousId ? previousId.toLowerCase() : undefined;

  const isConflict = (value: string) => {
    const lower = value.toLowerCase();
    if (previousLower && lower === previousLower) {
      return false;
    }
    if (DEFAULT_PROMPT_TILE_IDS.has(lower)) {
      return true;
    }
    return current.some((tile) => tile.id.toLowerCase() === lower);
  };

  let candidateId = base;
  let suffix = 1;
  while (isConflict(candidateId)) {
    candidateId = `${base}_${suffix}`;
    suffix += 1;
  }
  return candidateId;
}
// Generic migration helper which applies migrations sequentially until the
// data reaches `targetVersion`.
function migrate<T>(
  data: unknown,
  storedVersion: number,
  targetVersion: number,
  migrations: Record<number, (value: unknown) => unknown>,
): T {
  let result: unknown = data;
  let version = storedVersion;
  while (version < targetVersion) {
    const step = migrations[version];
    if (step) {
      result = step(result);
    }
    version += 1;
  }
  return result as T;
}

// Entity-specific migration functions
function migrateUser(data: unknown, version: number): UserProfile | undefined {
  return migrate<UserProfile | undefined>(data, version, USER_VERSION, {
    0: (d) => (d as UserProfile | undefined),
  });
}

function migrateResumes(data: unknown, version: number): ResumeEntry[] {
  return migrate<ResumeEntry[]>(data, version, RESUMES_VERSION, {
    0: (d) => (Array.isArray(d) ? (d as ResumeEntry[]) : []),
  });
}

function migrateMessages(data: unknown, version: number): Message[] {
  return migrate<Message[]>(data, version, MESSAGES_VERSION, {
    0: migrateLegacyMessages,
  });
}

function migrateOffers(data: unknown, version: number): Offer[] {
  return migrate<Offer[]>(data, version, OFFERS_VERSION, {
    0: migrateLegacyOffers,
    2: migrateOfferDecisions,
  });
}

function migrateApplications(data: unknown, version: number): JobApplication[] {
  return migrate<JobApplication[]>(data, version, APPLICATIONS_VERSION, {
    0: migrateLegacyApplications,
    3: migrateReminderFields,
    4: migrateApplicationDecisions,
    5: migrateApplicationAttachments,
    6: migrateApplicationActivities,
  });
}

function migrateRecruiters(data: unknown, version: number): RecruiterEntry[] {
  return migrate<RecruiterEntry[]>(data, version, RECRUITERS_VERSION, {
    0: (d) => (Array.isArray(d) ? (d as RecruiterEntry[]) : []),
  });
}

function migrateOnboarding(data: unknown, version: number): number {
  return migrate<number>(data, version, ONBOARDING_VERSION, {
    0: (d) => (typeof d === "number" ? d : 0),
  });
}

function migrateOpenAI(data: unknown, version: number): string | undefined {
  return migrate<string | undefined>(data, version, OPENAI_VERSION, {
    0: (d) => (typeof d === "string" ? d : undefined),
  });
}

function migrateConnectorTokens(
  data: unknown,
  version: number,
): Record<string, ConnectorToken> {
  return migrate<Record<string, ConnectorToken>>(
    data,
    version,
    CONNECTOR_TOKENS_VERSION,
    {
      0: (d) =>
        d && typeof d === "object"
          ? (d as Record<string, ConnectorToken>)
          : {},
    },
  );
}

function isConnectorSyncStatus(value: unknown): value is ConnectorSyncStatus {
  return value === "idle" || value === "syncing" || value === "success" || value === "error";
}

function normalizeConnectorSyncState(value: unknown): ConnectorSyncState {
  const base =
    value && typeof value === "object"
      ? (value as Partial<ConnectorSyncState>)
      : {};
  const state: ConnectorSyncState = {
    status: isConnectorSyncStatus(base.status) ? base.status : "idle",
  };
  if (typeof base.lastAttemptedAt === "string") {
    state.lastAttemptedAt = base.lastAttemptedAt;
  }
  if (typeof base.lastSuccessfulAt === "string") {
    state.lastSuccessfulAt = base.lastSuccessfulAt;
  }
  if (typeof base.error === "string") {
    state.error = base.error;
  }
  return state;
}

function normalizeConnectorSyncSnapshot(value: unknown): ConnectorSyncSnapshot {
  if (!value || typeof value !== "object") return {};
  const snapshot: ConnectorSyncSnapshot = {};
  for (const [connector, details] of Object.entries(value as Record<string, unknown>)) {
    snapshot[connector] = normalizeConnectorSyncState(details);
  }
  return snapshot;
}

function migrateConnectorSyncSnapshot(
  data: unknown,
  version: number,
): ConnectorSyncSnapshot {
  return migrate<ConnectorSyncSnapshot>(
    data,
    version,
    CONNECTOR_SYNC_SNAPSHOT_VERSION,
    {
      0: normalizeConnectorSyncSnapshot,
    },
  );
}

function normalizeJobListings(value: unknown): JobListing[] {
  if (!Array.isArray(value)) return [];
  const listings: JobListing[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const { title, company, location, url, source, description } = record;
    if (
      typeof title !== "string" ||
      typeof company !== "string" ||
      typeof location !== "string" ||
      typeof url !== "string" ||
      typeof source !== "string"
    ) {
      continue;
    }
    const listing: JobListing = {
      title,
      company,
      location,
      url,
      source,
    };
    if (typeof description === "string") {
      listing.description = description;
    }
    listings.push(listing);
  }
  return listings;
}

function normalizeLinkedInProfileSnapshot(value: unknown): LinkedInProfileSnapshot {
  if (!value || typeof value !== "object") {
    return { listings: [] };
  }

  const candidate = value as Partial<LinkedInProfileSnapshot> &
    Record<string, unknown>;
  const snapshot: LinkedInProfileSnapshot = {
    listings: normalizeJobListings(candidate.listings),
  };

  if (typeof candidate.capturedAt === "string") {
    snapshot.capturedAt = candidate.capturedAt;
  }
  if (typeof candidate.error === "string") {
    snapshot.error = candidate.error;
  }

  const profileCandidate = candidate.profile;
  if (profileCandidate && typeof profileCandidate === "object") {
    const raw = profileCandidate as Partial<LinkedInProfileDetails>;
    const { id, firstName, lastName } = raw;
    if (
      typeof id === "string" &&
      typeof firstName === "string" &&
      typeof lastName === "string"
    ) {
      const profile: NonNullable<LinkedInProfileSnapshot["profile"]> = {
        id,
        firstName,
        lastName,
      };
      if (typeof raw.headline === "string") {
        profile.headline = raw.headline;
      }
      if (typeof raw.location === "string") {
        profile.location = raw.location;
      }
      if (typeof raw.industry === "string") {
        profile.industry = raw.industry;
      }
      if (typeof raw.summary === "string") {
        profile.summary = raw.summary;
      }
      if (typeof raw.connections === "number") {
        profile.connections = raw.connections;
      }
      snapshot.profile = profile;
    }
  }

  return snapshot;
}

function migrateLinkedInProfileSnapshot(
  data: unknown,
  version: number,
): LinkedInProfileSnapshot {
  return migrate<LinkedInProfileSnapshot>(
    data,
    version,
    LINKEDIN_PROFILE_SNAPSHOT_VERSION,
    {
      0: normalizeLinkedInProfileSnapshot,
    },
  );
}

function migrateAutoReplyTemplates(
  data: unknown,
  version: number,
): Record<string, string> {
  return migrate<Record<string, string>>(
    data,
    version,
    AUTO_REPLY_TEMPLATES_VERSION,
    {
      0: (d) =>
        d && typeof d === "object"
          ? (d as Record<string, string>)
          : (AUTO_REPLY_TEMPLATES as Record<string, string>),
    },
  );
}

function migrateCurrentCompensation(
  data: unknown,
  version: number,
): CurrentCompensation {
  return migrate<CurrentCompensation>(
    data,
    version,
    CURRENT_COMP_VERSION,
    {
      0: (d) =>
        d && typeof d === "object"
          ? (d as CurrentCompensation)
          : { salary: "", benefits: "", stock: "" },
    },
  );
}

function normalizeGoalTags(value: unknown): TalentForgeGoalTag[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<TalentForgeGoalTag>();
  const normalized: TalentForgeGoalTag[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const tag = entry as TalentForgeGoalTag;
    if (KNOWN_GOAL_TAGS.includes(tag) && !seen.has(tag)) {
      seen.add(tag);
      normalized.push(tag);
    }
  }
  return normalized;
}

function createDefaultDecision(): OfferDecision {
  return { status: OFFER_DECISION_DEFAULT_STATUS };
}

function normalizeIsoTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function isDecisionStatus(value: unknown): value is OfferDecisionStatus {
  return (
    typeof value === "string" &&
    (OFFER_DECISION_STATUSES as readonly string[]).includes(value)
  );
}

function normalizeDecisionValue(value: unknown): OfferDecision {
  if (!value || typeof value !== "object") {
    return createDefaultDecision();
  }
  const raw = value as Partial<OfferDecision>;
  const status = isDecisionStatus(raw.status)
    ? raw.status
    : OFFER_DECISION_DEFAULT_STATUS;
  const decidedAt = normalizeIsoTimestamp(raw.decidedAt);
  const notes =
    typeof raw.notes === "string" && raw.notes.trim().length > 0
      ? raw.notes.trim()
      : undefined;
  const decision: OfferDecision = { status };
  if (decidedAt) {
    decision.decidedAt = decidedAt;
  }
  if (notes) {
    decision.notes = notes;
  }
  return decision;
}

function mergeDecision(
  current: OfferDecision | undefined,
  updates: Partial<OfferDecision> | undefined,
): OfferDecision {
  const base = current ? normalizeDecisionValue(current) : createDefaultDecision();
  if (!updates || typeof updates !== "object") {
    return base;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "status")) {
    base.status = isDecisionStatus(updates.status)
      ? updates.status
      : OFFER_DECISION_DEFAULT_STATUS;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "decidedAt")) {
    const normalized = normalizeIsoTimestamp(updates.decidedAt);
    if (normalized) {
      base.decidedAt = normalized;
    } else {
      delete base.decidedAt;
    }
  }
  if (Object.prototype.hasOwnProperty.call(updates, "notes")) {
    const trimmed =
      typeof updates.notes === "string" ? updates.notes.trim() : "";
    if (trimmed) {
      base.notes = trimmed;
    } else {
      delete base.notes;
    }
  }
  return base;
}

function decisionsEqual(
  a: OfferDecision | undefined,
  b: OfferDecision | undefined,
): boolean {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  const normalizedA = normalizeDecisionValue(a);
  const normalizedB = normalizeDecisionValue(b);
  return (
    normalizedA.status === normalizedB.status &&
    normalizedA.decidedAt === normalizedB.decidedAt &&
    normalizedA.notes === normalizedB.notes
  );
}

function offersEqual(a?: Offer, b?: Offer): boolean {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  if (a.id !== b.id) {
    return false;
  }
  const summaryA = Array.isArray(a.summary) ? a.summary : [];
  const summaryB = Array.isArray(b.summary) ? b.summary : [];
  if (summaryA.length !== summaryB.length) {
    return false;
  }
  for (let i = 0; i < summaryA.length; i += 1) {
    if (summaryA[i] !== summaryB[i]) {
      return false;
    }
  }
  const compA = Array.isArray(a.compensation) ? a.compensation : [];
  const compB = Array.isArray(b.compensation) ? b.compensation : [];
  if (compA.length !== compB.length) {
    return false;
  }
  for (let i = 0; i < compA.length; i += 1) {
    const entryA = compA[i];
    const entryB = compB[i];
    if (
      entryA.type !== entryB.type ||
      entryA.amount !== entryB.amount ||
      (entryA.notes ?? undefined) !== (entryB.notes ?? undefined)
    ) {
      return false;
    }
  }
  if (!decisionsEqual(a.decision, b.decision)) {
    return false;
  }
  return true;
}

function ensureOfferDecision(
  offer: Offer,
  fallback?: OfferDecision,
): { offer: Offer; changed: boolean } {
  const fallbackNormalized = fallback
    ? normalizeDecisionValue(fallback)
    : undefined;
  const targetDecision =
    fallbackNormalized ??
    (offer.decision ? normalizeDecisionValue(offer.decision) : undefined) ??
    createDefaultDecision();
  const original = offer.decision;
  const changed =
    !original ||
    original.status !== targetDecision.status ||
    original.decidedAt !== targetDecision.decidedAt ||
    original.notes !== targetDecision.notes;
  if (!changed && original) {
    return { offer, changed: false };
  }
  return { offer: { ...offer, decision: targetDecision }, changed: true };
}

function ensureApplicationDecision(
  app: JobApplication,
): { application: JobApplication; changed: boolean } {
  const current = app.decision ? normalizeDecisionValue(app.decision) : undefined;
  const offerDecision =
    app.offer && app.offer.decision
      ? normalizeDecisionValue(app.offer.decision)
      : undefined;
  const decision = current ?? offerDecision ?? createDefaultDecision();
  let changed =
    !app.decision ||
    app.decision.status !== decision.status ||
    app.decision.decidedAt !== decision.decidedAt ||
    app.decision.notes !== decision.notes;
  let nextOffer = app.offer;
  if (app.offer) {
    const { offer: normalizedOffer, changed: offerChanged } = ensureOfferDecision(
      app.offer,
      decision,
    );
    if (offerChanged) {
      nextOffer = normalizedOffer;
      changed = true;
    }
  }
  if (!changed) {
    return { application: app, changed: false };
  }
  const updated: JobApplication = { ...app, decision };
  if (nextOffer) {
    updated.offer = nextOffer;
  } else {
    delete (updated as Partial<JobApplication>).offer;
  }
  return { application: updated, changed: true };
}

function migrateOfferDecisions(data: unknown): Offer[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return (data as Offer[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as Offer;
    }
    const { offer: normalized } = ensureOfferDecision(entry as Offer);
    return normalized;
  });
}

function migrateApplicationDecisions(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return (data as JobApplication[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as JobApplication;
    }
    const { application } = ensureApplicationDecision(entry as JobApplication);
    return application;
  });
}

function migrateGoals(data: unknown, version: number): TalentForgeGoalTag[] {
  const migrated = migrate<TalentForgeGoalTag[]>(data, version, GOALS_VERSION, {
    0: normalizeGoalTags,
  });
  return normalizeGoalTags(migrated);
}

function createDefaultPipelineLayoutPreferences(): PipelineLayoutPreferences {
  return {
    order: [...STATUSES],
    collapsed: [],
  };
}

function normalizePipelineLayoutPreferences(
  value?: Partial<PipelineLayoutPreferences> | null,
): PipelineLayoutPreferences {
  const order: ApplicationStatus[] = [];
  const seen = new Set<ApplicationStatus>();
  const inputOrder = Array.isArray(value?.order) ? value?.order : [];
  for (const entry of inputOrder) {
    if (typeof entry !== "string") continue;
    const status = entry as ApplicationStatus;
    if (STATUSES.includes(status) && !seen.has(status)) {
      seen.add(status);
      order.push(status);
    }
  }
  STATUSES.forEach((status) => {
    if (!seen.has(status)) {
      seen.add(status);
      order.push(status);
    }
  });

  const collapsedCandidates = Array.isArray(value?.collapsed)
    ? value?.collapsed
    : [];
  const collapsedSet = new Set<ApplicationStatus>();
  for (const entry of collapsedCandidates) {
    if (typeof entry !== "string") continue;
    const status = entry as ApplicationStatus;
    if (STATUSES.includes(status)) {
      collapsedSet.add(status);
    }
  }

  const collapsed = order.filter((status) => collapsedSet.has(status));

  return {
    order,
    collapsed,
  };
}

function migratePipelineLayout(
  data: unknown,
  version: number,
): PipelineLayoutPreferences {
  const migrated = migrate<PipelineLayoutPreferences>(
    data,
    version,
    PIPELINE_LAYOUT_VERSION,
    {
      0: (value) =>
        normalizePipelineLayoutPreferences(
          value && typeof value === "object"
            ? (value as Partial<PipelineLayoutPreferences>)
            : undefined,
        ),
    },
  );
  return normalizePipelineLayoutPreferences(migrated);
}

function migrateCustomPromptTiles(
  data: unknown,
  version: number,
): CustomPromptTile[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const migrated: CustomPromptTile[] = [];
  for (const entry of data as unknown[]) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const candidate = entry as CustomPromptTileLike & { id?: unknown };
    const rawId =
      typeof candidate.id === "string"
        ? candidate.id.trim()
        : typeof candidate.id === "number"
          ? String(candidate.id)
          : "";
    const baseId = rawId || uuid();
    const ensuredId = ensureCustomPromptId(baseId, migrated);
    const sanitized = sanitizeCustomPromptTileInput(
      candidate,
      ensuredId,
      candidate as CustomPromptTile,
    );
    if (sanitized) {
      migrated.push(sanitized);
    }
  }
  return migrated;
}

function sanitizeNegotiationLibraryEntry(
  entry: unknown,
  existing: NegotiationLibraryEntry[],
): NegotiationLibraryEntry | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const candidate = entry as Partial<NegotiationLibraryEntry> & {
    name?: unknown;
    body?: unknown;
  };
  const rawContent =
    typeof candidate.content === "string"
      ? candidate.content
      : typeof candidate.body === "string"
        ? candidate.body
        : "";
  if (rawContent.trim().length === 0) {
    return null;
  }
  const rawLabel =
    typeof candidate.label === "string" && candidate.label.trim().length > 0
      ? candidate.label.trim()
      : typeof candidate.name === "string" && candidate.name.trim().length > 0
        ? candidate.name.trim()
        : "";
  const label = rawLabel || "Negotiation draft";
  const now = new Date().toISOString();
  const providedId =
    typeof candidate.id === "string" && candidate.id.trim().length > 0
      ? candidate.id.trim()
      : undefined;
  const hasConflict = providedId
    ? existing.some((entry) => entry.id === providedId)
    : false;
  const id = hasConflict || !providedId ? uuid() : providedId;
  const createdAt =
    typeof candidate.createdAt === "string" &&
    !Number.isNaN(Date.parse(candidate.createdAt))
      ? candidate.createdAt
      : now;
  const updatedAt =
    typeof candidate.updatedAt === "string" &&
    !Number.isNaN(Date.parse(candidate.updatedAt))
      ? candidate.updatedAt
      : createdAt;
  return {
    id,
    label,
    content: rawContent,
    createdAt,
    updatedAt,
  };
}

function migrateNegotiationLibrary(
  data: unknown,
  version: number,
): NegotiationLibraryEntry[] {
  return migrate<NegotiationLibraryEntry[]>(
    data,
    version,
    NEGOTIATION_LIBRARY_VERSION,
    {
      0: (value) => {
        if (!Array.isArray(value)) {
          return [];
        }
        const migrated: NegotiationLibraryEntry[] = [];
        for (const entry of value) {
          const sanitized = sanitizeNegotiationLibraryEntry(entry, migrated);
          if (sanitized) {
            migrated.push(sanitized);
          }
        }
        return migrated;
      },
    },
  );
}

const MIGRATORS: {
  [K in keyof StoreSchema]: (
    data: unknown,
    version: number,
  ) => StoreSchema[K];
} = {
  user: migrateUser,
  resumes: migrateResumes,
  messages: migrateMessages,
  offers: migrateOffers,
  applications: migrateApplications,
  recruiters: migrateRecruiters,
  onboarding: migrateOnboarding,
  openai: migrateOpenAI,
  connectorTokens: migrateConnectorTokens,
  connectorSyncSnapshot: migrateConnectorSyncSnapshot,
  linkedinProfileSnapshot: migrateLinkedInProfileSnapshot,
  autoReplyTemplates: migrateAutoReplyTemplates,
  currentCompensation: migrateCurrentCompensation,
  goals: migrateGoals,
  pipelineLayout: migratePipelineLayout,
  negotiationLibrary: migrateNegotiationLibrary,
  customPromptTiles: migrateCustomPromptTiles,
};

const DEFAULTS: { [K in keyof StoreSchema]: StoreSchema[K] } = {
  user: undefined,
  resumes: [],
  messages: [],
  offers: [],
  applications: [],
  recruiters: [],
  onboarding: 0,
  openai: undefined,
  connectorTokens: {},
  connectorSyncSnapshot: {},
  linkedinProfileSnapshot: { listings: [] as JobListing[] },
  autoReplyTemplates: AUTO_REPLY_TEMPLATES as Record<string, string>,
  currentCompensation: { salary: "", benefits: "", stock: "" },
  goals: [],
  pipelineLayout: createDefaultPipelineLayoutPreferences(),
  negotiationLibrary: [],
  customPromptTiles: [],
} as const;

function load<K extends keyof StoreSchema>(
  key: K,
  fallback: StoreSchema[K],
): StoreSchema[K] {
  const value = loadItem<StoreSchema[K]>(
    KEYS[key],
    VERSION[key],
    MIGRATORS[key],
  );
  if (value !== undefined) return value;
  return fallback;
}

function save<K extends keyof StoreSchema>(key: K, value: StoreSchema[K]): void {
  saveItem(KEYS[key], value, VERSION[key]);
}

function remove<K extends keyof StoreSchema>(key: K): void {
  deleteItem(KEYS[key]);
}

// Migrations
interface LegacyOffer {
  id: string;
  compensation: string;
  result: string;
}

interface LegacyMessageReply {
  id: string;
  content: string;
  sentAt: string;
  connector?: string;
}

interface LegacyMessage {
  id: string;
  connector: string;
  content: string;
  status: "unread" | "read";
  replies?: LegacyMessageReply[];
}

function migrateLegacyOffers(data: unknown): Offer[] {
  if (!Array.isArray(data)) return [];
  return (data as LegacyOffer[]).map((o) => ({
    id: o.id,
    application: {} as ApplicationRecord,
    compensation: [
      { type: "note", amount: 0, notes: o.compensation } as OfferComp,
    ],
    summary: o.result ? [o.result] : [],
  }));
}

function migrateLegacyMessages(data: unknown): Message[] {
  if (!Array.isArray(data)) return [];
  return (data as LegacyMessage[]).map((m) => ({
    id: m.id,
    threadId: m.id,
    senderId: m.connector,
    sentAt: new Date().toISOString(),
    body: m.content,
    connector: m.connector,
    status: m.status,
    replies: Array.isArray(m.replies)
      ? m.replies.map((r) => ({
          id: r.id,
          body: r.content,
          sentAt: r.sentAt,
          connector: r.connector || m.connector,
        }))
      : [],
  }));
}

interface LegacyJobApplication extends JobListing {
  id: string;
  status: ApplicationStatus;
  history: StatusChange[];
}

function migrateLegacyApplications(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) return [];
  return (data as LegacyJobApplication[]).map((a) => ({
    id: a.id,
    applicant: { id: "", name: "", email: "" } as User,
    role: { ...a, id: uuid() },
    status: a.status,
    history: a.history,
    recruiters: [],
    threads: [],
    offerHistory: [],
  }));
}

// User profile
export function getUserProfile(): UserProfile | undefined {
  return load("user", undefined);
}
export function saveUserProfile(profile: UserProfile): void {
  save("user", profile);
}

export function getCurrentCompensation(): CurrentCompensation {
  return load("currentCompensation", { salary: "", benefits: "", stock: "" });
}
export function saveCurrentCompensation(comp: CurrentCompensation): void {
  save("currentCompensation", comp);
}

export function getPipelineLayoutPreferences(): PipelineLayoutPreferences {
  const stored = load(
    "pipelineLayout",
    createDefaultPipelineLayoutPreferences(),
  );
  return normalizePipelineLayoutPreferences(stored);
}

export function savePipelineLayoutPreferences(
  preferences: PipelineLayoutPreferences,
): PipelineLayoutPreferences {
  const normalized = normalizePipelineLayoutPreferences(preferences);
  save("pipelineLayout", normalized);
  return normalized;
}

export function getGoals(): TalentForgeGoalTag[] {
  const goals = load("goals", []);
  if (typeof window === "undefined") {
    return goals;
  }

  const hasNewEntry = window.localStorage.getItem(KEYS.goals) !== null;
  if (hasNewEntry) {
    return goals;
  }

  const legacy = loadItem<TalentForgeGoalTag[]>(
    LEGACY_GOALS_KEY,
    LEGACY_GOAL_SELECTIONS_VERSION,
    (data, version) => migrateGoals(data, version),
  );
  if (legacy !== undefined) {
    setGoals(legacy);
    return legacy;
  }

  if (window.localStorage.getItem(LEGACY_GOALS_KEY) !== null) {
    deleteItem(LEGACY_GOALS_KEY);
  }

  return goals;
}

export function setGoals(goals: TalentForgeGoalTag[]): void {
  const normalized = normalizeGoalTags(goals);
  save("goals", normalized);
  deleteItem(LEGACY_GOALS_KEY);
}

export function getSelectedGoals(): TalentForgeGoalTag[] {
  return getGoals();
}
export function saveSelectedGoals(goals: TalentForgeGoalTag[]): void {
  setGoals(goals);
}

// Resumes
function generateUniqueTitle(base: string, existing: ResumeEntry[]): string {
  const titles = existing.map((r) => r.title.toLowerCase());
  const candidate = base.trim() || "Resume";
  let suffix = 1;
  let title = candidate;
  while (titles.includes(title.toLowerCase())) {
    suffix += 1;
    title = `${candidate} (${suffix})`;
  }
  return title;
}

export function getResumes(): ResumeEntry[] {
  const loaded = load("resumes", []);
  const existing: ResumeEntry[] = [];
  let changed = false;
  const updated = loaded.map((r) => {
    const title = r.title
      ? generateUniqueTitle(r.title, existing)
      : generateUniqueTitle("Resume", existing);
    if (title !== r.title) changed = true;
    const updatedResume = { ...r, title };
    existing.push(updatedResume);
    return updatedResume;
  });
  if (changed) saveResumes(updated);
  return updated;
}
export function saveResumes(resumes: ResumeEntry[]): void {
  save("resumes", resumes);
}
export function addResume(resume: ResumeEntry): ResumeEntry[] {
  const current = getResumes();
  const title = generateUniqueTitle(resume.title || "Resume", current);
  const importedAt = resume.importedAt ?? new Date().toISOString();
  const newResume = { ...resume, title, importedAt };
  const updated = [...current, newResume];
  saveResumes(updated);
  return updated;
}
export function updateResume(resume: ResumeEntry): ResumeEntry[] {
  const current = getResumes();
  const others = current.filter((r) => r.id !== resume.id);
  const title = generateUniqueTitle(resume.title || "Resume", others);
  const updatedResume = { ...resume, title };
  const updated = [...others, updatedResume];
  saveResumes(updated);
  return updated;
}
export function deleteResume(id: string): ResumeEntry[] {
  const updated = getResumes().filter((r) => r.id !== id);
  saveResumes(updated);
  return updated;
}
export function cloneResume(resume: ResumeEntry): ResumeEntry[] {
  const current = getResumes();
  const title = generateUniqueTitle(resume.title, current);
  const clone = { ...resume, id: uuid(), title };
  const updated = [...current, clone];
  saveResumes(updated);
  return updated;
}

// Negotiation library
export function getNegotiationLibrary(): NegotiationLibraryEntry[] {
  return load("negotiationLibrary", []);
}

function saveNegotiationLibrary(entries: NegotiationLibraryEntry[]): void {
  save("negotiationLibrary", entries);
}

export function addNegotiationLibraryEntry(
  entry: NegotiationLibraryEntry,
): NegotiationLibraryEntry[] {
  const current = getNegotiationLibrary();
  const filtered = current.filter((existing) => existing.id !== entry.id);
  const updated = [...filtered, entry];
  saveNegotiationLibrary(updated);
  return updated;
}

export function updateNegotiationLibraryEntry(
  id: string,
  updates: Partial<NegotiationLibraryEntry>,
): NegotiationLibraryEntry[] {
  const current = getNegotiationLibrary();
  let changed = false;
  const sanitizedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined),
  ) as Partial<NegotiationLibraryEntry>;
  const updated = current.map((entry) => {
    if (entry.id !== id) {
      return entry;
    }
    changed = true;
    return { ...entry, ...sanitizedUpdates };
  });
  if (changed) {
    saveNegotiationLibrary(updated);
    return updated;
  }
  return current;
}

export function deleteNegotiationLibraryEntry(
  id: string,
): NegotiationLibraryEntry[] {
  const current = getNegotiationLibrary();
  const updated = current.filter((entry) => entry.id !== id);
  if (updated.length !== current.length) {
    saveNegotiationLibrary(updated);
    return updated;
  }
  return current;
}

// Custom prompt tiles
export function getCustomPromptTiles(): CustomPromptTile[] {
  return load("customPromptTiles", []);
}

function saveCustomPromptTiles(tiles: CustomPromptTile[]): void {
  save("customPromptTiles", tiles);
}

export function getCustomPromptTileById(
  id: string,
): CustomPromptTile | undefined {
  return getCustomPromptTiles().find((tile) => tile.id === id);
}

export function addCustomPromptTile(
  tile: CustomPromptTileInput,
): CustomPromptTile[] {
  const current = getCustomPromptTiles();
  const rawId =
    typeof tile.id === "string" && tile.id.trim() ? tile.id.trim() : "";
  const previous = rawId ? current.find((entry) => entry.id === rawId) : undefined;
  const baseId = rawId || uuid();
  const normalizedId = ensureCustomPromptId(baseId, current, previous?.id);
  const sanitized = sanitizeCustomPromptTileInput(tile, normalizedId, previous);
  if (!sanitized) {
    return current;
  }
  const others = current.filter((entry) => entry.id !== sanitized.id);
  const updated = [...others, sanitized];
  saveCustomPromptTiles(updated);
  return updated;
}

export function updateCustomPromptTile(
  tile: CustomPromptTileInput,
): CustomPromptTile[] {
  const current = getCustomPromptTiles();
  if (!tile.id) {
    return current;
  }
  const previous = current.find((entry) => entry.id === tile.id);
  if (!previous) {
    return current;
  }
  const sanitized = sanitizeCustomPromptTileInput(tile, tile.id, previous);
  if (!sanitized) {
    return current;
  }
  const updated = current.map((entry) =>
    entry.id === sanitized.id ? sanitized : entry,
  );
  saveCustomPromptTiles(updated);
  return updated;
}

export function deleteCustomPromptTile(id: string): CustomPromptTile[] {
  const current = getCustomPromptTiles();
  const updated = current.filter((entry) => entry.id !== id);
  saveCustomPromptTiles(updated);
  return updated;
}

// Auto reply templates
export function getAutoReplyTemplates(): Record<string, string> {
  return load("autoReplyTemplates", AUTO_REPLY_TEMPLATES as Record<string, string>);
}

export function saveAutoReplyTemplates(templates: Record<string, string>): void {
  save("autoReplyTemplates", templates);
}

// Messages
export function getMessages(): Message[] {
  return load("messages", []);
}
export function addMessage(message: Message): Message[] {
  const updated = [...getMessages(), message];
  save("messages", updated);
  return updated;
}
export function deleteMessage(id: string): Message[] {
  const updated = getMessages().filter((m) => m.id !== id);
  save("messages", updated);
  return updated;
}
export function addMessageReply(id: string, reply: MessageReply): Message[] {
  const updated = getMessages().map((m) =>
    m.id === id ? { ...m, replies: [...m.replies, reply] } : m,
  );
  save("messages", updated);
  return updated;
}
export function updateMessageStatus(
  id: string,
  status: "unread" | "read",
): Message[] {
  const updated = getMessages().map((m) =>
    m.id === id ? { ...m, status } : m,
  );
  save("messages", updated);
  return updated;
}

// Thread aliases
export function getThreads(): Message[] {
  return getMessages();
}
export function addThread(thread: Message): Message[] {
  return addMessage(thread);
}
export function deleteThread(id: string): Message[] {
  return deleteMessage(id);
}
export function addThreadReply(id: string, reply: MessageReply): Message[] {
  return addMessageReply(id, reply);
}
export function updateThreadStatus(
  id: string,
  status: "unread" | "read",
): Message[] {
  return updateMessageStatus(id, status);
}

// Offers
export function getOffers(): Offer[] {
  const offers = load("offers", []);
  let migrated = false;
  const updated = offers.map((offer) => {
    const summary = offer.summary as unknown;
    if (summary && !Array.isArray(summary)) {
      migrated = true;
      const summaryLines =
        typeof summary === "string"
          ? summary
              .split(/\r?\n/)
              .map((line) => line.replace(/^\-\s*/, "").trim())
              .filter(Boolean)
          : [];
      const normalizedSummaryOffer = { ...offer, summary: summaryLines };
      const { offer: withDecision, changed } = ensureOfferDecision(
        normalizedSummaryOffer,
      );
      if (changed) {
        return withDecision;
      }
      return normalizedSummaryOffer;
    }
    const { offer: normalizedOffer, changed } = ensureOfferDecision(offer);
    if (changed) {
      migrated = true;
      return normalizedOffer;
    }
    return offer;
  });
  if (migrated) {
    save("offers", updated);
  }
  return updated;
}
export function addOffer(offer: Offer): Offer[] {
  const { offer: normalized } = ensureOfferDecision(offer);
  const updated = [...getOffers(), normalized];
  save("offers", updated);
  return updated;
}
export function updateOffer(offer: Offer): Offer[] {
  const { offer: normalized } = ensureOfferDecision(offer);
  const updated = getOffers().map((o) =>
    o.id === normalized.id ? normalized : o,
  );
  save("offers", updated);
  return updated;
}
export function deleteOffer(id: string): Offer[] {
  const updated = getOffers().filter((o) => o.id !== id);
  save("offers", updated);
  return updated;
}

// Job applications
function normalizeOfferHistoryEntries(
  history: JobApplication["offerHistory"] | string[] | undefined,
): { entries: OfferHistoryEntry[]; changed: boolean } {
  if (!Array.isArray(history)) {
    return { entries: [], changed: Boolean(history) };
  }

  let changed = false;
  const normalized: OfferHistoryEntry[] = [];

  history.forEach((item, index) => {
    if (typeof item === "string") {
      changed = true;
      normalized.push({
        id: uuid(),
        createdAt: new Date().toISOString(),
        sourceLabel: `Offer note ${index + 1}`,
        content: item,
      });
      return;
    }

    const entry = item as Partial<OfferHistoryEntry>;
    const hasId = typeof entry.id === "string" && entry.id.length > 0;
    const hasCreatedAt =
      typeof entry.createdAt === "string" && entry.createdAt.length > 0;
    const hasSourceLabel =
      typeof entry.sourceLabel === "string" && entry.sourceLabel.trim().length > 0;
    const hasContent = typeof entry.content === "string";

    if (hasId && hasCreatedAt && hasSourceLabel && hasContent) {
      normalized.push(entry as OfferHistoryEntry);
      return;
    }

    changed = true;
    normalized.push({
      id: hasId ? (entry.id as string) : uuid(),
      createdAt: hasCreatedAt
        ? (entry.createdAt as string)
        : new Date().toISOString(),
      sourceLabel: hasSourceLabel
        ? (entry.sourceLabel as string).trim()
        : `Offer note ${index + 1}`,
      content: hasContent ? (entry.content as string) : "",
    });
  });

  return changed
    ? { entries: normalized, changed: true }
    : { entries: history as OfferHistoryEntry[], changed: false };
}

const ACTIVITY_OUTCOME_SUCCESS: ApplicationActivity["outcome"] = "success";
const ACTIVITY_OUTCOME_ERROR: ApplicationActivity["outcome"] = "error";

const isValidActivityOutcome = (
  value: unknown,
): value is ApplicationActivity["outcome"] =>
  value === ACTIVITY_OUTCOME_SUCCESS || value === ACTIVITY_OUTCOME_ERROR;

function normalizeActivityEntry(
  value: unknown,
  index: number,
): { activity: ApplicationActivity; changed: boolean } {
  const fallbackSummary = `Tile activity ${index + 1}`;
  const fallbackTileId = `tile-${index + 1}`;

  const base: Partial<ApplicationActivity> =
    value && typeof value === "object"
      ? (value as Partial<ApplicationActivity>)
      : {};

  const originalId = typeof base.id === "string" ? base.id : undefined;
  const trimmedId = originalId?.trim();
  const originalTileId = typeof base.tileId === "string" ? base.tileId : undefined;
  const trimmedTileId = originalTileId?.trim();
  const originalSummary = typeof base.summary === "string" ? base.summary : undefined;
  const trimmedSummary = originalSummary?.trim();
  const originalTimestamp =
    typeof base.createdAt === "string" ? base.createdAt : undefined;
  const trimmedTimestamp = originalTimestamp?.trim();
  const parsedTimestamp = trimmedTimestamp ? new Date(trimmedTimestamp) : new Date(NaN);
  const isoFromRaw = !Number.isNaN(parsedTimestamp.getTime())
    ? parsedTimestamp.toISOString()
    : undefined;
  const originalOutcome = isValidActivityOutcome(base.outcome)
    ? base.outcome
    : undefined;
  const originalGeneratedContentId =
    typeof base.generatedContentId === "string"
      ? base.generatedContentId
      : undefined;
  const trimmedGeneratedContentId = originalGeneratedContentId?.trim();
  const originalError = typeof base.error === "string" ? base.error : undefined;
  const trimmedError = originalError?.trim();

  const normalizedId = trimmedId && trimmedId.length > 0 ? trimmedId : uuid();
  const normalizedTileId =
    trimmedTileId && trimmedTileId.length > 0 ? trimmedTileId : fallbackTileId;
  const normalizedSummary =
    trimmedSummary && trimmedSummary.length > 0 ? trimmedSummary : fallbackSummary;
  const normalizedTimestamp = isoFromRaw ?? new Date().toISOString();
  const normalizedOutcome = originalOutcome ?? ACTIVITY_OUTCOME_SUCCESS;
  const normalizedGeneratedContentId =
    trimmedGeneratedContentId && trimmedGeneratedContentId.length > 0
      ? trimmedGeneratedContentId
      : undefined;
  const normalizedError =
    normalizedOutcome === ACTIVITY_OUTCOME_ERROR && trimmedError
      ? trimmedError.length > 0
        ? trimmedError
        : undefined
      : undefined;

  const activity: ApplicationActivity = {
    id: normalizedId,
    tileId: normalizedTileId,
    createdAt: normalizedTimestamp,
    summary: normalizedSummary,
    outcome: normalizedOutcome,
    ...(normalizedGeneratedContentId
      ? { generatedContentId: normalizedGeneratedContentId }
      : {}),
    ...(normalizedError ? { error: normalizedError } : {}),
  };

  const changed =
    normalizedId !== (originalId ?? normalizedId) ||
    normalizedTileId !== (originalTileId ?? fallbackTileId) ||
    normalizedSummary !== (originalSummary ?? fallbackSummary) ||
    normalizedTimestamp !== (originalTimestamp ?? normalizedTimestamp) ||
    normalizedOutcome !== (originalOutcome ?? ACTIVITY_OUTCOME_SUCCESS) ||
    normalizedGeneratedContentId !==
      (originalGeneratedContentId ?? normalizedGeneratedContentId) ||
    normalizedError !==
      (normalizedOutcome === ACTIVITY_OUTCOME_ERROR
        ? originalError ?? normalizedError
        : undefined);

  return { activity, changed };
}

function normalizeActivities(
  value: JobApplication["activities"] | unknown,
): { activities: ApplicationActivity[]; changed: boolean } {
  if (!Array.isArray(value)) {
    return { activities: [], changed: Boolean(value) };
  }

  let changed = false;
  const normalized = value.map((entry, index) => {
    const { activity, changed: entryChanged } = normalizeActivityEntry(
      entry,
      index,
    );
    if (entryChanged) {
      changed = true;
    }
    return activity;
  });

  return changed
    ? { activities: normalized, changed: true }
    : { activities: value as ApplicationActivity[], changed: false };
}

type ReminderFields = Partial<Pick<JobApplication, "nextAction" | "dueAt">>;

function normalizeNextAction(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeDueAt(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

function normalizeReminderFields(
  value: { nextAction?: unknown; dueAt?: unknown },
): { values: ReminderFields; changed: boolean } {
  const normalized: ReminderFields = {};
  const originalNextAction =
    typeof value.nextAction === "string" ? value.nextAction : undefined;
  const originalDueAt =
    typeof value.dueAt === "string" ? value.dueAt : undefined;

  const normalizedNextAction = normalizeNextAction(value.nextAction);
  const normalizedDueAt = normalizeDueAt(value.dueAt);

  if (normalizedNextAction !== undefined) {
    normalized.nextAction = normalizedNextAction;
  } else if (originalNextAction !== undefined) {
    normalized.nextAction = undefined;
  }

  if (normalizedDueAt !== undefined) {
    normalized.dueAt = normalizedDueAt;
  } else if (originalDueAt !== undefined) {
    normalized.dueAt = undefined;
  }

  const changed =
    normalizedNextAction !== originalNextAction ||
    normalizedDueAt !== originalDueAt;

  return { values: normalized, changed };
}

function normalizeAttachmentEntry(value: unknown): ApplicationAttachment | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<ApplicationAttachment> &
    Record<string, unknown>;

  const rawId =
    typeof candidate.id === "string" && candidate.id.trim().length > 0
      ? candidate.id.trim()
      : uuid();
  const rawName =
    typeof candidate.name === "string" && candidate.name.trim().length > 0
      ? candidate.name.trim()
      : undefined;
  const rawMime =
    typeof candidate.mimeType === "string" && candidate.mimeType.trim().length > 0
      ? candidate.mimeType.trim()
      : "application/octet-stream";
  const base64Value =
    typeof candidate["base64"] === "string"
      ? (candidate["base64"] as string)
      : undefined;
  const rawContent =
    typeof candidate.content === "string"
      ? candidate.content
      : base64Value;

  if (!rawName || !rawContent) {
    return null;
  }

  const normalizedContent = rawContent.replace(/\s+/g, "");

  return {
    id: rawId,
    name: rawName,
    mimeType: rawMime,
    content: normalizedContent,
  };
}

function normalizeAttachments(
  value: unknown,
): { attachments: ApplicationAttachment[]; changed: boolean } {
  if (!Array.isArray(value)) {
    return { attachments: [], changed: value !== undefined };
  }

  const attachments: ApplicationAttachment[] = [];
  let changed = false;

  value.forEach((entry) => {
    const normalized = normalizeAttachmentEntry(entry);
    if (!normalized) {
      changed = true;
      return;
    }
    attachments.push(normalized);
    if (entry && typeof entry === "object") {
      const candidate = entry as Partial<ApplicationAttachment> &
        Record<string, unknown>;
      const rawId =
        typeof candidate.id === "string" && candidate.id.trim().length > 0
          ? candidate.id.trim()
          : undefined;
      const rawName =
        typeof candidate.name === "string" && candidate.name.trim().length > 0
          ? candidate.name.trim()
          : undefined;
      const rawMime =
        typeof candidate.mimeType === "string" && candidate.mimeType.trim().length > 0
          ? candidate.mimeType.trim()
          : undefined;
      const candidateBase64 =
        typeof candidate["base64"] === "string"
          ? (candidate["base64"] as string)
          : undefined;
      const rawContent =
        typeof candidate.content === "string"
          ? candidate.content.replace(/\s+/g, "")
          : candidateBase64
            ? candidateBase64.replace(/\s+/g, "")
            : undefined;

      if (
        rawId !== normalized.id ||
        rawName !== normalized.name ||
        rawMime !== normalized.mimeType ||
        rawContent !== normalized.content
      ) {
        changed = true;
      }
    } else {
      changed = true;
    }
  });

  if (attachments.length !== value.length) {
    changed = true;
  }

  return { attachments, changed };
}

function attachmentsEqual(
  a: ApplicationAttachment[] | undefined,
  b: ApplicationAttachment[] | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return !a && !b;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.name !== right.name ||
      left.mimeType !== right.mimeType ||
      left.content !== right.content
    ) {
      return false;
    }
  }
  return true;
}

function activitiesEqual(
  a: ApplicationActivity[] | undefined,
  b: ApplicationActivity[] | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return !a && !b;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.tileId !== right.tileId ||
      left.createdAt !== right.createdAt ||
      left.summary !== right.summary ||
      left.outcome !== right.outcome ||
      left.generatedContentId !== right.generatedContentId ||
      left.error !== right.error
    ) {
      return false;
    }
  }
  return true;
}

function migrateReminderFields(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return (data as JobApplication[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as JobApplication;
    }
    const record = entry as JobApplication & {
      nextAction?: unknown;
      dueAt?: unknown;
    };
    const { values, changed } = normalizeReminderFields(record);
    if (!changed) {
      return record;
    }
    return { ...record, ...values } as JobApplication;
  });
}

function migrateApplicationAttachments(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) {
    return [];
  }
  let changed = false;
  const migrated = (data as JobApplication[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as JobApplication;
    }
    const record = entry as JobApplication & { attachments?: unknown };
    const hasArray = Array.isArray(record.attachments);
    const { attachments, changed: attachmentsChanged } = normalizeAttachments(
      record.attachments,
    );
    if (attachmentsChanged || !hasArray) {
      changed = true;
      return { ...record, attachments } as JobApplication;
    }
    return record as JobApplication;
  });
  return changed ? migrated : (data as JobApplication[]);
}

function migrateApplicationActivities(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) {
    return [];
  }
  let changed = false;
  const migrated = (data as JobApplication[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as JobApplication;
    }
    const record = entry as JobApplication & { activities?: unknown };
    const hasArray = Array.isArray(record.activities);
    const { activities, changed: activitiesChanged } = normalizeActivities(
      record.activities,
    );
    if (activitiesChanged || !hasArray) {
      changed = true;
      return { ...record, activities } as JobApplication;
    }
    return record as JobApplication;
  });
  return changed ? migrated : (data as JobApplication[]);
}

function normalizeApplicationUpdates(
  updates: Partial<JobApplication>,
): Partial<JobApplication> {
  const needsNormalization =
    Object.prototype.hasOwnProperty.call(updates, "offerHistory") ||
    Object.prototype.hasOwnProperty.call(updates, "nextAction") ||
    Object.prototype.hasOwnProperty.call(updates, "dueAt") ||
    Object.prototype.hasOwnProperty.call(updates, "attachments") ||
    Object.prototype.hasOwnProperty.call(updates, "activities");
  if (!needsNormalization) {
    return updates;
  }

  const normalized: Partial<JobApplication> = { ...updates };
  if (Object.prototype.hasOwnProperty.call(updates, "offerHistory")) {
    normalized.offerHistory = normalizeOfferHistoryEntries(
      updates.offerHistory,
    ).entries;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "nextAction")) {
    normalized.nextAction = normalizeNextAction(updates.nextAction);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "dueAt")) {
    normalized.dueAt = normalizeDueAt(updates.dueAt);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "attachments")) {
    normalized.attachments = normalizeAttachments(updates.attachments).attachments;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "activities")) {
    normalized.activities = normalizeActivities(updates.activities).activities;
  }
  return normalized;
}

function applyApplicationUpdates(
  app: JobApplication,
  updates: Partial<JobApplication>,
): JobApplication {
  const normalizedUpdates = normalizeApplicationUpdates(updates);
  const hasNormalizedChanges =
    normalizedUpdates && Object.keys(normalizedUpdates).length > 0;
  let nextApp = app;
  if (hasNormalizedChanges) {
    const {
      attachments: attachmentUpdates,
      activities: activityUpdates,
      ...otherUpdates
    } = normalizedUpdates;
    if (Object.keys(otherUpdates).length > 0) {
      nextApp = { ...nextApp, ...otherUpdates } as JobApplication;
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdates, "attachments")) {
      const nextAttachments = Array.isArray(attachmentUpdates)
        ? (attachmentUpdates as ApplicationAttachment[])
        : [];
      const currentAttachments = Array.isArray(nextApp.attachments)
        ? nextApp.attachments
        : [];
      if (!attachmentsEqual(currentAttachments, nextAttachments)) {
        nextApp = { ...nextApp, attachments: nextAttachments } as JobApplication;
      }
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdates, "activities")) {
      const nextActivities = Array.isArray(activityUpdates)
        ? (activityUpdates as ApplicationActivity[])
        : [];
      const currentActivities = Array.isArray(nextApp.activities)
        ? nextApp.activities
        : [];
      if (!activitiesEqual(currentActivities, nextActivities)) {
        nextApp = { ...nextApp, activities: nextActivities } as JobApplication;
      }
    }
  }

  const hasDecisionUpdate = Object.prototype.hasOwnProperty.call(
    updates,
    "decision",
  );
  let decisionFallback: OfferDecision | undefined =
    nextApp.decision ?? app.decision ?? app.offer?.decision;
  if (hasDecisionUpdate) {
    const mergedDecision = mergeDecision(
      app.decision ?? app.offer?.decision,
      updates.decision as Partial<OfferDecision>,
    );
    if (!decisionsEqual(nextApp.decision, mergedDecision)) {
      nextApp = { ...nextApp, decision: mergedDecision } as JobApplication;
    }
    decisionFallback = mergedDecision;
  }

  const hasOfferUpdate = Object.prototype.hasOwnProperty.call(
    updates,
    "offer",
  );
  if (hasOfferUpdate) {
    const rawOffer = updates.offer;
    if (rawOffer && typeof rawOffer === "object") {
      const { offer: normalizedOffer } = ensureOfferDecision(
        rawOffer as Offer,
        decisionFallback,
      );
      if (!offersEqual(nextApp.offer, normalizedOffer)) {
        nextApp = { ...nextApp, offer: normalizedOffer } as JobApplication;
      }
    } else {
      if (nextApp.offer) {
        const clone = { ...nextApp } as Partial<JobApplication>;
        delete clone.offer;
        nextApp = clone as JobApplication;
      }
    }
  }

  const { application: aligned } = ensureApplicationDecision(nextApp);
  return aligned;
}

export function getJobApplications(): JobApplication[] {
  const apps = load("applications", []);
  let migrated = false;
  const updated = apps.map((app) => {
    const summary = app.offer?.summary as unknown;
    let nextApp = app;
    if (app.offer && summary && !Array.isArray(summary)) {
      migrated = true;
      const summaryLines =
        typeof summary === "string"
          ? summary
              .split(/\r?\n/)
              .map((line) => line.replace(/^\-\s*/, "").trim())
              .filter(Boolean)
          : [];
      nextApp = { ...app, offer: { ...app.offer, summary: summaryLines } };
    }

    const { entries, changed } = normalizeOfferHistoryEntries(nextApp.offerHistory);
    if (changed) {
      migrated = true;
      nextApp = { ...nextApp, offerHistory: entries };
    }

    const { values: reminderValues, changed: reminderChanged } =
      normalizeReminderFields(nextApp);
    if (reminderChanged) {
      migrated = true;
      nextApp = { ...nextApp, ...reminderValues };
    }

    const hasAttachmentArray = Array.isArray(nextApp.attachments);
    const { attachments: normalizedAttachments, changed: attachmentsChanged } =
      normalizeAttachments(nextApp.attachments);
    if (attachmentsChanged || !hasAttachmentArray) {
      migrated = true;
      nextApp = { ...nextApp, attachments: normalizedAttachments };
    }

    const hasActivityArray = Array.isArray(nextApp.activities);
    const { activities: normalizedActivities, changed: activitiesChanged } =
      normalizeActivities(nextApp.activities);
    if (activitiesChanged || !hasActivityArray) {
      migrated = true;
      nextApp = { ...nextApp, activities: normalizedActivities };
    }

    const { application: normalizedApp, changed: decisionChanged } =
      ensureApplicationDecision(nextApp);
    if (decisionChanged) {
      migrated = true;
      return normalizedApp;
    }
    return nextApp;
  });
  if (migrated) {
    save("applications", updated);
  }
  return updated;
}
export function addJobApplication(app: JobApplication): JobApplication[] {
  const { entries: offerHistory } = normalizeOfferHistoryEntries(app.offerHistory);
  const { values: reminderValues } = normalizeReminderFields(app);
  const { attachments } = normalizeAttachments(app.attachments);
  const { activities } = normalizeActivities(app.activities);
  const withHistory = {
    ...app,
    ...reminderValues,
    attachments,
    activities,
    history: [
      ...(app.history ?? []),
      { status: app.status, changedAt: new Date().toISOString() },
    ],
    offerHistory,
  } as JobApplication;
  const { application: normalized } = ensureApplicationDecision(withHistory);
  const updated = [...getJobApplications(), normalized];
  save("applications", updated);
  return updated;
}
export function updateJobApplication(
  id: string,
  updates: Partial<JobApplication>,
): JobApplication[] {
  let changed = false;
  const updated = getJobApplications().map((app) => {
    if (app.id !== id) {
      return app;
    }
    const nextApp = applyApplicationUpdates(app, updates);
    if (nextApp !== app) {
      changed = true;
    }
    return nextApp;
  });
  if (changed) {
    save("applications", updated);
  }
  return updated;
}

function applyStatusUpdate(
  app: JobApplication,
  status: ApplicationStatus,
  options?: { reason?: string; changedAt?: string },
): JobApplication {
  const opts = options ?? {};
  const hasReasonOption = Object.prototype.hasOwnProperty.call(opts, "reason");
  const rawReason = hasReasonOption ? opts.reason ?? "" : undefined;
  const trimmedReason = rawReason?.trim();
  const hasChangedAtOption = Object.prototype.hasOwnProperty.call(
    opts,
    "changedAt",
  );
  const changedAtValue = hasChangedAtOption ? opts.changedAt : undefined;

  const parseChangedAt = (value?: string) => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const history = [...(app.history || [])];
  const lastEntry = history[history.length - 1];

  if (
    lastEntry &&
    lastEntry.status === status &&
    (hasReasonOption || hasChangedAtOption)
  ) {
    const updatedEntry: StatusChange = {
      ...lastEntry,
      status,
      changedAt: hasChangedAtOption
        ? parseChangedAt(changedAtValue).toISOString()
        : lastEntry.changedAt,
    };
    if (hasReasonOption) {
      if (trimmedReason) {
        updatedEntry.reason = trimmedReason;
      } else {
        delete updatedEntry.reason;
      }
    }
    history[history.length - 1] = updatedEntry;
    return { ...app, status, history };
  }

  const baseDate = hasChangedAtOption
    ? parseChangedAt(changedAtValue)
    : new Date();
  const entry: StatusChange = {
    status,
    changedAt: baseDate.toISOString(),
  };
  if (trimmedReason) {
    entry.reason = trimmedReason;
  }
  return { ...app, status, history: [...history, entry] };
}
export function updateJobApplicationStatus(
  id: string,
  status: ApplicationStatus,
  options?: { reason?: string; changedAt?: string },
): JobApplication[] {
  const updated = getJobApplications().map((app) =>
    app.id === id ? applyStatusUpdate(app, status, options) : app,
  );
  save("applications", updated);
  return updated;
}
export function bulkUpdateJobApplications(
  ids: string[],
  updates: Partial<JobApplication>,
): JobApplication[] {
  if (ids.length === 0) {
    return getJobApplications();
  }
  const idSet = new Set(ids);
  let changed = false;
  const updated = getJobApplications().map((app) => {
    if (!idSet.has(app.id)) {
      return app;
    }
    const nextApp = applyApplicationUpdates(app, updates);
    if (nextApp !== app) {
      changed = true;
    }
    return nextApp;
  });
  if (changed) {
    save("applications", updated);
  }
  return updated;
}

export function bulkUpdateJobApplicationStatus(
  ids: string[],
  status: ApplicationStatus,
  options?: { reason?: string; changedAt?: string },
): JobApplication[] {
  if (ids.length === 0) {
    return getJobApplications();
  }
  const idSet = new Set(ids);
  let changed = false;
  const updated = getJobApplications().map((app) => {
    if (!idSet.has(app.id)) {
      return app;
    }
    changed = true;
    return applyStatusUpdate(app, status, options);
  });
  if (changed) {
    save("applications", updated);
  }
  return updated;
}
export function deleteJobApplication(id: string): JobApplication[] {
  const updated = getJobApplications().filter((a) => a.id !== id);
  save("applications", updated);
  return updated;
}

// Recruiters
export function getRecruiters(): RecruiterEntry[] {
  return load("recruiters", []);
}

export function addRecruiter(recruiter: RecruiterEntry): RecruiterEntry[] {
  const updated = [...getRecruiters(), recruiter];
  save("recruiters", updated);
  return updated;
}

export function updateRecruiter(recruiter: RecruiterEntry): RecruiterEntry[] {
  const updated = getRecruiters().map((r) =>
    r.id === recruiter.id ? recruiter : r,
  );
  save("recruiters", updated);
  return updated;
}

export function deleteRecruiter(id: string): RecruiterEntry[] {
  const updated = getRecruiters().filter((r) => r.id !== id);
  save("recruiters", updated);
  return updated;
}

export function linkThreadToApplication(
  threadId: string,
  applicationId?: string,
): Message[] {
  const messages = getMessages().map((m) =>
    m.id === threadId ? { ...m, applicationId: applicationId || undefined } : m,
  );
  save("messages", messages);
  return messages;
}

export function linkThreadToRecruiter(
  threadId: string,
  recruiterId: string,
): Message[] {
  const messages = getMessages().map((m) =>
    m.id === threadId ? { ...m, recruiterId } : m,
  );
  save("messages", messages);

  const recruiters = getRecruiters();
  for (const r of recruiters) {
    const hasThread = r.threadIds.includes(threadId);
    if (r.id === recruiterId && !hasThread) {
      r.threadIds.push(threadId);
    } else if (r.id !== recruiterId && hasThread) {
      r.threadIds = r.threadIds.filter((t) => t !== threadId);
    }
  }
  save("recruiters", recruiters);
  return messages;
}

// Onboarding step
export function getOnboardingStep(): number {
  return load("onboarding", 0);
}
export function setOnboardingStep(step: number): void {
  save("onboarding", step);
}
export function clearOnboardingStep(): void {
  remove("onboarding");
}

// OpenAI key
export function getOpenAIKey(): string | undefined {
  return load("openai", undefined);
}
export function setOpenAIKey(key: string): void {
  save("openai", key);
}
export function deleteOpenAIKey(): void {
  remove("openai");
}

// Connector tokens
interface ConnectorTokenMap {
  [name: string]: ConnectorToken;
}

function getConnectorTokens(): ConnectorTokenMap {
  return load("connectorTokens", {});
}

export function getConnectorToken(
  connector: string,
): ConnectorToken | undefined {
  return getConnectorTokens()[connector];
}

export function saveConnectorToken(
  connector: string,
  token: ConnectorToken,
): void {
  const tokens = getConnectorTokens();
  tokens[connector] = token;
  save("connectorTokens", tokens);
}

export function deleteConnectorToken(connector: string): void {
  const tokens = getConnectorTokens();
  delete tokens[connector];
  save("connectorTokens", tokens);
}

export function getConnectorSyncSnapshot(): ConnectorSyncSnapshot {
  return load("connectorSyncSnapshot", {});
}

export function saveConnectorSyncSnapshot(
  snapshot: ConnectorSyncSnapshot,
): void {
  save("connectorSyncSnapshot", snapshot);
}

export function getLinkedInProfileSnapshot(): LinkedInProfileSnapshot {
  return load("linkedinProfileSnapshot", { listings: [] });
}

export function saveLinkedInProfileSnapshot(
  snapshot: LinkedInProfileSnapshot,
): void {
  save("linkedinProfileSnapshot", snapshot);
}

// Export / Import
function migrateSnapshot(
  fromVersion: number,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const migrated = { ...data };
  if (fromVersion < 2) {
    migrated[KEYS.connectorTokens] = migrated[KEYS.connectorTokens] || {};
  }
  if (fromVersion < 6) {
    if (!(KEYS.connectorSyncSnapshot in migrated)) {
      migrated[KEYS.connectorSyncSnapshot] = {
        version: CONNECTOR_SYNC_SNAPSHOT_VERSION,
        data: {},
      };
    }
    if (!(KEYS.linkedinProfileSnapshot in migrated)) {
      migrated[KEYS.linkedinProfileSnapshot] = {
        version: LINKEDIN_PROFILE_SNAPSHOT_VERSION,
        data: { listings: [] },
      };
    }
  }
  if (fromVersion < 8) {
    if (!(KEYS.pipelineLayout in migrated)) {
      migrated[KEYS.pipelineLayout] = {
        version: PIPELINE_LAYOUT_VERSION,
        data: createDefaultPipelineLayoutPreferences(),
      };
    }
  }
  if (fromVersion < 10) {
    if (!(KEYS.customPromptTiles in migrated)) {
      migrated[KEYS.customPromptTiles] = {
        version: CUSTOM_PROMPT_TILES_VERSION,
        data: [],
      };
    }
  }
  if (fromVersion < 11) {
    if (!(KEYS.negotiationLibrary in migrated)) {
      migrated[KEYS.negotiationLibrary] = {
        version: NEGOTIATION_LIBRARY_VERSION,
        data: [],
      };
    }
  }
  if (fromVersion < 5) {
    const legacyGoalsEntry = migrated[LEGACY_GOALS_KEY];
    if (legacyGoalsEntry !== undefined) {
      const payload =
        legacyGoalsEntry &&
        typeof legacyGoalsEntry === "object" &&
        "data" in (legacyGoalsEntry as Record<string, unknown>)
          ? (legacyGoalsEntry as { data?: unknown; version?: number })
          : { data: legacyGoalsEntry, version: LEGACY_GOAL_SELECTIONS_VERSION };
      const version =
        typeof payload.version === "number"
          ? payload.version
          : LEGACY_GOAL_SELECTIONS_VERSION;
      const migratedGoals = migrateGoals(payload.data, version);
      migrated[KEYS.goals] = { version: GOALS_VERSION, data: migratedGoals };
      delete migrated[LEGACY_GOALS_KEY];
    }
  }
  if (fromVersion < 4) {
    const resumesEntry = migrated[KEYS.resumes];
    if (
      resumesEntry &&
      typeof resumesEntry === "object" &&
      "data" in (resumesEntry as Record<string, unknown>)
    ) {
      const payload = resumesEntry as { data?: ResumeEntry[] };
      if (Array.isArray(payload.data)) {
        const timestamp = new Date().toISOString();
        const migratedResumes = payload.data.map((resume) => {
          if (!resume || typeof resume !== "object") {
            return resume;
          }
          const typed = resume as ResumeEntry;
          return {
            ...typed,
            sourceFilename: typed.sourceFilename ?? "Imported resume",
            importedAt: typed.importedAt ?? timestamp,
          };
        });
        migrated[KEYS.resumes] = { ...(resumesEntry as Record<string, unknown>), data: migratedResumes };
      }
    }
  }
  return migrated;
}

export function exportToJson(): string {
  if (typeof window === "undefined") {
    return JSON.stringify({ version: SNAPSHOT_VERSION, data: {} });
  }
  const data: Record<string, unknown> = {};
  for (const key of Object.values(KEYS)) {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  const payload = { version: SNAPSHOT_VERSION, data };
  return JSON.stringify(payload, null, 2);
}

export function importFromJson(json: string): void {
  if (typeof window === "undefined") return;
  try {
    const parsed = JSON.parse(json) as
      | { version?: number; data?: Record<string, unknown> }
      | Record<string, unknown>;
    let version = 0;
    let data: Record<string, unknown>;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "data" in parsed &&
      "version" in parsed
    ) {
      version = typeof parsed.version === "number" ? parsed.version : 0;
      data = (parsed as { data: Record<string, unknown> }).data;
    } else {
      data = parsed as Record<string, unknown>;
    }
    if (version < SNAPSHOT_VERSION) {
      data = migrateSnapshot(version, data);
    }
    const validKeys = Object.values(KEYS) as string[];
    for (const [key, value] of Object.entries(data)) {
      if (validKeys.includes(key)) {
        try {
          const payload =
            value && typeof value === "object" && "version" in (value as object)
              ? (value as object)
              : { version: 0, data: value };
          window.localStorage.setItem(key, JSON.stringify(payload));
        } catch {
          // ignore write errors
        }
      }
    }
    // Trigger migrations for all known keys after importing
    for (const key of Object.keys(KEYS) as (keyof StoreSchema)[]) {
      load(key, DEFAULTS[key]);
    }
  } catch {
    // ignore parse errors
  }
}

const dataStore = {
  getUserProfile,
  saveUserProfile,
  getCurrentCompensation,
  saveCurrentCompensation,
  getPipelineLayoutPreferences,
  savePipelineLayoutPreferences,
  getGoals,
  setGoals,
  getSelectedGoals,
  saveSelectedGoals,
  getResumes,
  saveResumes,
  addResume,
  updateResume,
  deleteResume,
  getMessages,
  addMessage,
  deleteMessage,
  addMessageReply,
  updateMessageStatus,
  getThreads,
  addThread,
  deleteThread,
  addThreadReply,
  updateThreadStatus,
  getOffers,
  addOffer,
  updateOffer,
  deleteOffer,
  getJobApplications,
  addJobApplication,
  updateJobApplication,
  updateJobApplicationStatus,
  deleteJobApplication,
  getRecruiters,
  addRecruiter,
  updateRecruiter,
  deleteRecruiter,
  linkThreadToRecruiter,
  getAutoReplyTemplates,
  saveAutoReplyTemplates,
  getOnboardingStep,
  setOnboardingStep,
  clearOnboardingStep,
  getOpenAIKey,
  setOpenAIKey,
  deleteOpenAIKey,
  getConnectorToken,
  saveConnectorToken,
  deleteConnectorToken,
  getConnectorSyncSnapshot,
  saveConnectorSyncSnapshot,
  getLinkedInProfileSnapshot,
  saveLinkedInProfileSnapshot,
  getCustomPromptTiles,
  getCustomPromptTileById,
  addCustomPromptTile,
  updateCustomPromptTile,
  deleteCustomPromptTile,
  getNegotiationLibrary,
  addNegotiationLibraryEntry,
  updateNegotiationLibraryEntry,
  deleteNegotiationLibraryEntry,
  exportToJson,
  importFromJson,
};

export default dataStore;

