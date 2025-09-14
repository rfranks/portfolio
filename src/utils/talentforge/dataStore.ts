"use client";

import { ConnectorToken } from "@/types/connector";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  resumes: ResumeEntry[];
}

export interface ResumeEntry {
  id: string;
  content: string;
  tags: string[];
}

export interface Message {
  id: string;
  from: string;
  to: string;
  sentAt: string;
  body: string;
}

export interface Offer {
  id: string;
  applicationId: string;
  compensation: string;
  accepted: boolean;
}

export interface JobApplication {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  status: ApplicationStatus;
}

export type ApplicationStatus =
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

const KEYS = {
  user: "userProfile",
  resumes: "resumes",
  messages: "messages",
  offers: "offers",
  applications: "jobApplications",
  onboarding: "onboardingStep",
  openai: "talentforge-openai-key",
  connectorTokens: "connectorTokens",
} as const;

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors
  }
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

// User profile
export function getUserProfile(): UserProfile | undefined {
  return load<UserProfile | undefined>(KEYS.user, undefined);
}
export function saveUserProfile(profile: UserProfile): void {
  save(KEYS.user, profile);
}

// Resumes
export function getResumes(): ResumeEntry[] {
  return load<ResumeEntry[]>(KEYS.resumes, []);
}
export function saveResumes(resumes: ResumeEntry[]): void {
  save(KEYS.resumes, resumes);
}
export function addResume(resume: ResumeEntry): ResumeEntry[] {
  const updated = [...getResumes(), resume];
  saveResumes(updated);
  return updated;
}
export function updateResume(resume: ResumeEntry): ResumeEntry[] {
  const updated = getResumes().map((r) => (r.id === resume.id ? resume : r));
  saveResumes(updated);
  return updated;
}
export function deleteResume(id: string): ResumeEntry[] {
  const updated = getResumes().filter((r) => r.id !== id);
  saveResumes(updated);
  return updated;
}

// Messages
export function getMessages(): Message[] {
  return load<Message[]>(KEYS.messages, []);
}
export function addMessage(message: Message): Message[] {
  const updated = [...getMessages(), message];
  save(KEYS.messages, updated);
  return updated;
}
export function deleteMessage(id: string): Message[] {
  const updated = getMessages().filter((m) => m.id !== id);
  save(KEYS.messages, updated);
  return updated;
}

// Offers
export function getOffers(): Offer[] {
  return load<Offer[]>(KEYS.offers, []);
}
export function addOffer(offer: Offer): Offer[] {
  const updated = [...getOffers(), offer];
  save(KEYS.offers, updated);
  return updated;
}
export function updateOffer(offer: Offer): Offer[] {
  const updated = getOffers().map((o) => (o.id === offer.id ? offer : o));
  save(KEYS.offers, updated);
  return updated;
}
export function deleteOffer(id: string): Offer[] {
  const updated = getOffers().filter((o) => o.id !== id);
  save(KEYS.offers, updated);
  return updated;
}

// Job applications
export function getJobApplications(): JobApplication[] {
  return load<JobApplication[]>(KEYS.applications, []);
}
export function addJobApplication(app: JobApplication): JobApplication[] {
  const updated = [...getJobApplications(), app];
  save(KEYS.applications, updated);
  return updated;
}
export function updateJobApplicationStatus(
  id: string,
  status: ApplicationStatus,
): JobApplication[] {
  const updated = getJobApplications().map((app) =>
    app.id === id ? { ...app, status } : app,
  );
  save(KEYS.applications, updated);
  return updated;
}
export function deleteJobApplication(id: string): JobApplication[] {
  const updated = getJobApplications().filter((a) => a.id !== id);
  save(KEYS.applications, updated);
  return updated;
}

// Onboarding step
export function getOnboardingStep(): number {
  return load<number>(KEYS.onboarding, 0);
}
export function setOnboardingStep(step: number): void {
  save(KEYS.onboarding, step);
}
export function clearOnboardingStep(): void {
  remove(KEYS.onboarding);
}

// OpenAI key
export function getOpenAIKey(): string | undefined {
  return load<string | undefined>(KEYS.openai, undefined);
}
export function setOpenAIKey(key: string): void {
  save(KEYS.openai, key);
}
export function deleteOpenAIKey(): void {
  remove(KEYS.openai);
}

// Connector tokens
interface ConnectorTokenMap {
  [name: string]: ConnectorToken;
}

function getConnectorTokens(): ConnectorTokenMap {
  return load<ConnectorTokenMap>(KEYS.connectorTokens, {});
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
  save(KEYS.connectorTokens, tokens);
}

export function deleteConnectorToken(connector: string): void {
  const tokens = getConnectorTokens();
  delete tokens[connector];
  save(KEYS.connectorTokens, tokens);
}

// Export / Import
export function exportToJson(): string {
  if (typeof window === "undefined") return "{}";
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
  return JSON.stringify(data, null, 2);
}

export function importFromJson(json: string): void {
  if (typeof window === "undefined") return;
  try {
    const data = JSON.parse(json) as Record<string, unknown>;
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
  getOffers,
  addOffer,
  updateOffer,
  deleteOffer,
  getJobApplications,
  addJobApplication,
  updateJobApplicationStatus,
  deleteJobApplication,
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

