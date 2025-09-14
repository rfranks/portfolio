import type { ApplicationStatus, StatusChange } from "./job";

export interface User {
  /** Unique identifier for the user. */
  id: string;
  /** User's full name. */
  name: string;
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
  /** URL where the resume file is stored. */
  url: string;
  /** Additional notes about this resume variant. */
  notes?: string;
}

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
  resumeVariant?: ResumeVariant;
  /** Current status of the application. */
  status: ApplicationStatus;
  /** History of status changes for the application. */
  history: StatusChange[];
  /** Recruiters associated with this application. */
  recruiters?: Recruiter[];
  /** Conversation threads about this application. */
  threads?: Thread[];
  /** Offer details if an offer has been made. */
  offer?: Offer;
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
  connector?: string;
  /** Tags describing the recruiter. */
  tags?: string[];
  /** Notes about the recruiter. */
  notes?: string;
  /** Message thread IDs linked to this recruiter. */
  threadIds?: string[];
}

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

export interface Message {
  /** Unique identifier for the message. */
  id: string;
  /** Identifier of the thread containing the message. */
  threadId: string;
  /** Identifier of the sender (user or recruiter). */
  senderId: string;
  /** Recruiter associated with this thread, if any. */
  recruiterId?: string;
  /** Timestamp in ISO format indicating when the message was sent. */
  sentAt: string;
  /** Body content of the message. */
  body: string;
}

export interface Offer {
  /** Unique identifier for the offer. */
  id: string;
  /** Application associated with the offer. */
  application: ApplicationRecord;
  /** Compensation components that make up the offer. */
  compensation: OfferComp[];
  /** Optional summary or notes about the offer. */
  summary?: string;
}

export interface OfferComp {
  /** Type of compensation, e.g. "base", "bonus", or "equity". */
  type: string;
  /** Monetary amount or value for this component. */
  amount: number;
  /** Optional additional details about the component. */
  notes?: string;
}

