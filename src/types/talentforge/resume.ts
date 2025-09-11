export interface ParsedResume {
  /** Contact information block. */
  contact: string;
  /** Experience entries in plain text. */
  experience: string[];
  /** Education entries in plain text. */
  education: string[];
  /** Skills list in plain text. */
  skills: string[];
}
