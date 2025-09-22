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
  OfferHistoryEntry,
  OfferComp,
  RecruiterEntry,
  ConnectorSyncSnapshot,
  ConnectorSyncState,
  ConnectorSyncStatus,
  LinkedInProfileSnapshot,
} from "@/types";
import { AUTO_REPLY_TEMPLATES } from "@/utils/autoReply/templates";
import type { TalentForgeGoalTag } from "./promptRegistry";

export type UserProfile = User;

export type JobApplication = ApplicationRecord;

export interface CurrentCompensation {
  salary: string;
  benefits: string;
  stock: string;
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
} as const;

const LEGACY_GOALS_KEY = "talentforge-goal-selections";
const KNOWN_GOAL_TAGS: readonly TalentForgeGoalTag[] = [
  "resume",
  "networking",
  "search",
];
const LEGACY_GOAL_SELECTIONS_VERSION = 1;

// Version constants per entity so tests and other modules can reference them.
export const USER_VERSION = 1;
export const RESUMES_VERSION = 1;
export const MESSAGES_VERSION = 2;
export const OFFERS_VERSION = 2;
export const APPLICATIONS_VERSION = 3;
export const RECRUITERS_VERSION = 1;
export const ONBOARDING_VERSION = 1;
export const OPENAI_VERSION = 1;
export const CONNECTOR_TOKENS_VERSION = 1;
export const CONNECTOR_SYNC_SNAPSHOT_VERSION = 1;
export const LINKEDIN_PROFILE_SNAPSHOT_VERSION = 1;
export const AUTO_REPLY_TEMPLATES_VERSION = 1;
export const CURRENT_COMP_VERSION = 1;
export const GOALS_VERSION = 1;

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
} as const;

export const SNAPSHOT_VERSION = 6;

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
  });
}

function migrateApplications(data: unknown, version: number): JobApplication[] {
  return migrate<JobApplication[]>(data, version, APPLICATIONS_VERSION, {
    0: migrateLegacyApplications,
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
    const raw = profileCandidate as Record<string, unknown>;
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

function migrateGoals(data: unknown, version: number): TalentForgeGoalTag[] {
  const migrated = migrate<TalentForgeGoalTag[]>(data, version, GOALS_VERSION, {
    0: normalizeGoalTags,
  });
  return normalizeGoalTags(migrated);
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
      return { ...offer, summary: summaryLines };
    }
    return offer;
  });
  if (migrated) {
    save("offers", updated);
  }
  return updated;
}
export function addOffer(offer: Offer): Offer[] {
  const updated = [...getOffers(), offer];
  save("offers", updated);
  return updated;
}
export function updateOffer(offer: Offer): Offer[] {
  const updated = getOffers().map((o) => (o.id === offer.id ? offer : o));
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

    return nextApp;
  });
  if (migrated) {
    save("applications", updated);
  }
  return updated;
}
export function addJobApplication(app: JobApplication): JobApplication[] {
  const { entries: offerHistory } = normalizeOfferHistoryEntries(app.offerHistory);
  const withHistory = {
    ...app,
    history: [
      ...(app.history ?? []),
      { status: app.status, changedAt: new Date().toISOString() },
    ],
    offerHistory,
  } as JobApplication;
  const updated = [...getJobApplications(), withHistory];
  save("applications", updated);
  return updated;
}
export function updateJobApplication(
  id: string,
  updates: Partial<JobApplication>,
): JobApplication[] {
  const normalizedUpdates = Object.prototype.hasOwnProperty.call(
    updates,
    "offerHistory",
  )
    ? {
        ...updates,
        offerHistory: normalizeOfferHistoryEntries(updates.offerHistory).entries,
      }
    : updates;
  const updated = getJobApplications().map((app) =>
    app.id === id ? { ...app, ...normalizedUpdates } : app,
  );
  save("applications", updated);
  return updated;
}
export function updateJobApplicationStatus(
  id: string,
  status: ApplicationStatus,
  options?: { reason?: string; changedAt?: string },
): JobApplication[] {
  const updated = getJobApplications().map((app) => {
    if (app.id === id) {
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
      history.push(entry);
      return { ...app, status, history };
    }
    return app;
  });
  save("applications", updated);
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
  exportToJson,
  importFromJson,
};

export default dataStore;

