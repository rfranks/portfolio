import type { ApplicationStatus, StatusChange } from "./job";
import type { ParsedResume } from "./resume";

export interface OfferHistoryEntry {
  /** Unique identifier for this offer history entry. */
  id: string;
  /** Timestamp when the entry was created, stored as an ISO string. */
  createdAt: string;
  /** Human readable label describing the entry source. */
  sourceLabel: string;
  /** Raw markdown content that was captured for this entry. */
  content: string;
}

export interface User {
  /** Unique identifier for the user. */
  id: string;
  /** User's full name. */
  name: string;
  /** User's given name captured during onboarding. */
  firstName?: string;
  /** User's family name captured during onboarding. */
  lastName?: string;
  /** Email address for contacting the user. */
  email: string;
  /** Resume variants owned by the user. Optional because not all users upload resumes. */
  resumeVariants?: ResumeVariant[];
  /** Applications submitted by the user. */
  applications?: ApplicationRecord[];
  /** Message threads involving the user. */
  threads?: Thread[];
}

export interface ResumeVariant {
  /** Unique identifier for this resume variant. */
  id: string;
  /** Identifier of the user who owns the resume. */
  userId: string;
  /** Human readable label for the resume variant. */
  label: string;
  /** User editable title for the resume variant. */
  title: string;
  /** URL where the resume file is stored. */
  url: string;
  /** Raw text content of the resume. */
  content: string;
  /** Parsed resume sections extracted from the content. */
  parsed: ParsedResume;
  /** Tags describing the resume. */
  tags: string[];
  /** Additional notes about this resume variant. */
  notes?: string;
  /** Original filename of the resume source, if known. */
  sourceFilename?: string;
  /** ISO timestamp capturing when this resume was imported. */
  importedAt?: string;
}

/**
 * Alias maintained for backwards compatibility with older imports.
 */
export type ResumeEntry = ResumeVariant;

export interface RolePosting {
  /** Unique identifier for the role posting. */
  id: string;
  /** Title of the role. */
  title: string;
  /** Company offering the role. */
  company: string;
  /** Location of the job, if specified. */
  location?: string;
  /** Full job description text. */
  description?: string;
  /** Direct link to the job posting. */
  url?: string;
  /** Source of the listing such as "indeed" or "linkedin". */
  source?: string;
  /** Applications submitted for this role. */
  applications?: ApplicationRecord[];
}

export interface ApplicationRecord {
  /** Unique identifier for the application. */
  id: string;
  /** User who submitted the application. */
  applicant: User;
  /** Role being applied to. */
  role: RolePosting;
  /** Resume variant used for the application, if any. */
  resumeVariant?: ResumeEntry;
  /** Next follow-up action to take for this application. */
  nextAction?: string;
  /** When the next action is due, stored as an ISO timestamp. */
  dueAt?: string;
  /** Current status of the application. */
  status: ApplicationStatus;
  /** History of status changes for the application. */
  history: StatusChange[];
  /** Scheduled date and time for an interview, if any. */
  interviewDateTime?: string;
  /** Meeting URL or physical location for the interview. */
  interviewLocation?: string;
  /** Recruiters associated with this application. */
  recruiters?: Recruiter[];
  /** Conversation threads about this application. */
  threads?: Thread[];
  /** Offer details if an offer has been made. */
  offer?: Offer;
  /** Generated offer negotiations attached to this application. */
  offerHistory?: OfferHistoryEntry[];
}

export interface Recruiter {
  /** Unique identifier for the recruiter. */
  id: string;
  /** Recruiter's name. */
  name: string;
  /** Contact email for the recruiter. */
  email?: string;
  /** Applications managed by this recruiter. */
  applications?: ApplicationRecord[];
  /** Connector that surfaced this recruiter. */
  connector: string;
  /** Tags describing the recruiter. */
  tags: string[];
  /** Notes about the recruiter. */
  notes: string;
  /** Message thread IDs linked to this recruiter. */
  threadIds: string[];
}

/**
 * Alias maintained for backwards compatibility with older imports.
 */
export type RecruiterEntry = Recruiter;

export interface Thread {
  /** Unique identifier for the thread. */
  id: string;
  /** Application this thread is related to. */
  application: ApplicationRecord;
  /** Participants involved in the thread (user and recruiter IDs). */
  participantIds: string[];
  /** Messages that belong to this thread. */
  messages: Message[];
}

export interface MessageReply {
  /** Unique identifier for the message reply. */
  id: string;
  /** Body content of the reply. */
  body: string;
  /** Timestamp in ISO format indicating when the reply was sent. */
  sentAt: string;
  /** Connector through which the reply was sent. */
  connector: string;
}

export interface Message {
  /** Unique identifier for the message. */
  id: string;
  /** Identifier of the thread containing the message. */
  threadId: string;
  /** Identifier of the sender (user or recruiter). */
  senderId: string;
  /** Recruiter associated with this thread, if any. */
  recruiterId?: string;
  /** Application associated with this message thread, if any. */
  applicationId?: string;
  /** Timestamp in ISO format indicating when the message was sent. */
  sentAt: string;
  /** Body content of the message. */
  body: string;
  /** Connector through which the message was received. */
  connector: string;
  /** Current read status of the message. */
  status: "unread" | "read";
  /** Replies to the message, if any. */
  replies: MessageReply[];
}

export interface Offer {
  /** Unique identifier for the offer. */
  id: string;
  /** Application associated with the offer. */
  application: ApplicationRecord;
  /** Compensation components that make up the offer. */
  compensation: OfferComp[];
  /** Optional summary or notes about the offer. */
  summary?: string[];
}

export interface OfferComp {
  /** Type of compensation, e.g. "base", "bonus", or "equity". */
  type: string;
  /** Monetary amount or value for this component. */
  amount: number;
  /** Optional additional details about the component. */
  notes?: string;
}

