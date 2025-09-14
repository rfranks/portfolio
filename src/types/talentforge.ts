import type {
  ApplicationStatus,
  JobApplication,
  JobListing,
} from "./talentforge/job";

export interface UserProfile {
  /** Unique identifier for the user. */
  id: string;
  /** Display name of the user. */
  name: string;
  /** Email address of the user. */
  email: string;
  /** Resumes associated with the user. */
  resumes: Resume[];
}

export interface Resume {
  /** Unique identifier for the resume. */
  id: string;
  /** Original filename of the resume. */
  filename: string;
  /** URL where the resume file can be accessed. */
  url: string;
  /** Tags describing the resume's contents. */
  tags?: string[];
}

export interface Message {
  /** Unique identifier for the message. */
  id: string;
  /** Identifier of the user sending the message. */
  from: string;
  /** Identifier of the user receiving the message. */
  to: string;
  /** Timestamp in ISO format when the message was sent. */
  sentAt: string;
  /** Body of the message. */
  body: string;
}

export interface Offer {
  /** Unique identifier for the offer. */
  id: string;
  /** Original text of the offer letter. */
  offerText: string;
  /** Current compensation details provided by the user. */
  compensation: string;
  /** Generated negotiation draft or analysis. */
  result: string;
}

export type { JobApplication, ApplicationStatus, JobListing };

