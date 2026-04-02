import type { JobListing } from "./job";

/** Possible statuses for a connector sync operation. */
export type ConnectorSyncStatus = "idle" | "syncing" | "success" | "error";

/**
 * Metadata describing the outcome of the most recent connector sync.
 */
export interface ConnectorSyncState {
  /** Current status for the connector's latest sync run. */
  status: ConnectorSyncStatus;
  /** ISO timestamp when the latest sync attempt started. */
  lastAttemptedAt?: string;
  /** ISO timestamp when the connector last synced successfully. */
  lastSuccessfulAt?: string;
  /** Optional error message captured from the latest failure. */
  error?: string;
}

/**
 * Snapshot of sync metadata keyed by connector identifier.
 */
export interface ConnectorSyncSnapshot {
  [connector: string]: ConnectorSyncState | undefined;
}

/**
 * Minimal set of fields captured from a LinkedIn profile during sync.
 */
export interface LinkedInProfileDetails {
  /** Unique identifier for the LinkedIn member. */
  id: string;
  /** Member's first name. */
  firstName: string;
  /** Member's last name. */
  lastName: string;
  /** Optional professional headline displayed on LinkedIn. */
  headline?: string;
  /** Optional primary location for the member. */
  location?: string;
  /** Optional industry designation. */
  industry?: string;
  /** Optional summary/about text shown on the profile. */
  summary?: string;
  /** Optional approximate connection count. */
  connections?: number;
}

/**
 * Snapshot of LinkedIn profile information retrieved during a connector sync.
 */
export interface LinkedInProfileSnapshot {
  /** ISO timestamp indicating when the snapshot was captured. */
  capturedAt?: string;
  /** Optional error captured from the most recent sync attempt. */
  error?: string;
  /** Profile details returned by the LinkedIn connector. */
  profile?: LinkedInProfileDetails;
  /** Job listings fetched alongside the profile. */
  listings: JobListing[];
}
