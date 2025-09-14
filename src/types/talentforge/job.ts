export interface JobListing {
  /** Title of the job listing */
  title: string;
  /** Name of the company offering the job */
  company: string;
  /** Location where the job is based */
  location: string;
  /** Full job description text */
  description?: string;
  /** Direct link to the job posting */
  url: string;
  /** Source of the job listing, e.g. "indeed" or "linkedin" */
  source: string;
}

export type ApplicationStatus =
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export interface StatusChange {
  /** Status the application transitioned to. */
  status: ApplicationStatus;
  /** ISO timestamp when the status changed. */
  changedAt: string;
  /** Optional reason for the status change. */
  reason?: string;
}

export interface JobApplication extends JobListing {
  /** Unique identifier for the job application */
  id: string;
  /** Current status of the job application */
  status: ApplicationStatus;
  /** History of status changes for this application */
  history: StatusChange[];
}
