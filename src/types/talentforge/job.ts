export interface JobListing {
  /** Title of the job listing */
  title: string;
  /** Name of the company offering the job */
  company: string;
  /** Location where the job is based */
  location: string;
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

export interface JobApplication extends JobListing {
  /** Current status of the job application */
  status: ApplicationStatus;
}
