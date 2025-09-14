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
} from "@/types/talentforge/job";
import { AUTO_REPLY_TEMPLATES } from "@/utils/autoReply";
import type {
  User,
  ResumeVariant,
  Message as ModelMessage,
  Offer as ModelOffer,
  ApplicationRecord,
  OfferComp,
  Recruiter,
} from "@/types";
import { ParsedResume } from "@/types/talentforge/resume";

export type UserProfile = User;

export type ResumeEntry = ResumeVariant & {
  content: string;
  parsed: ParsedResume;
  tags: string[];
};

export type MessageReply = {
  id: string;
  body: string;
  sentAt: string;
  connector: string;
};

export interface Message extends ModelMessage {
  connector: string;
  status: "unread" | "read";
  replies: MessageReply[];
}

export type Offer = ModelOffer;

export type JobApplication = ApplicationRecord;

export type RecruiterEntry = Recruiter & {
  connector: string;
  tags: string[];
  notes: string;
  threadIds: string[];
};

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
  autoReplyTemplates: Record<string, string>;
}

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
  autoReplyTemplates: "autoReplyTemplates",
} as const;

const VERSION: { [K in keyof StoreSchema]: number } = {
  user: 1,
  resumes: 1,
  messages: 2,
  offers: 2,
  applications: 2,
  recruiters: 1,
  onboarding: 1,
  openai: 1,
  connectorTokens: 1,
  autoReplyTemplates: 1,
} as const;

export const SNAPSHOT_VERSION = 3;

function load<K extends keyof StoreSchema>(
  key: K,
  fallback: StoreSchema[K],
  migrateLegacy?: (data: unknown) => StoreSchema[K],
): StoreSchema[K] {
  const value = loadItem<StoreSchema[K]>(KEYS[key], VERSION[key]);
  if (value !== undefined) return value;
  if (migrateLegacy && typeof window !== "undefined") {
    const raw = window.localStorage.getItem(KEYS[key]);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const migrated = migrateLegacy(parsed);
        saveItem(KEYS[key], migrated, VERSION[key]);
        return migrated;
      } catch {
        return fallback;
      }
    }
  }
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
    summary: o.result,
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
  }));
}

// User profile
export function getUserProfile(): UserProfile | undefined {
  return load("user", undefined);
}
export function saveUserProfile(profile: UserProfile): void {
  save("user", profile);
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
  const newResume = { ...resume, title };
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
  return load("messages", [], migrateLegacyMessages);
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
  return load("offers", [], migrateLegacyOffers);
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
export function getJobApplications(): JobApplication[] {
  return load("applications", [], migrateLegacyApplications);
}
export function addJobApplication(app: JobApplication): JobApplication[] {
  const withHistory = {
    ...app,
    history: [
      ...(app.history ?? []),
      { status: app.status, changedAt: new Date().toISOString() },
    ],
  } as JobApplication;
  const updated = [...getJobApplications(), withHistory];
  save("applications", updated);
  return updated;
}
export function updateJobApplicationStatus(
  id: string,
  status: ApplicationStatus,
): JobApplication[] {
  const updated = getJobApplications().map((app) => {
    if (app.id === id) {
      const history = [
        ...(app.history || []),
        { status, changedAt: new Date().toISOString() },
      ];
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

// Export / Import
function migrateSnapshot(
  fromVersion: number,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const migrated = { ...data };
  if (fromVersion < 2) {
    migrated[KEYS.connectorTokens] = migrated[KEYS.connectorTokens] || {};
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
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // ignore write errors
        }
      }
    }
  } catch {
    // ignore parse errors
  }
}

const dataStore = {
  getUserProfile,
  saveUserProfile,
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
  exportToJson,
  importFromJson,
};

export default dataStore;

