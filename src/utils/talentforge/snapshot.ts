"use client";

import {
  exportToJson,
  importFromJson,
  getUserProfile,
  getResumes,
  getMessages,
  getOffers,
  getJobApplications,
  getOnboardingStep,
  getOpenAIKey,
  getConnectorSyncSnapshot,
  getLinkedInProfileSnapshot,
  getPipelineLayoutPreferences,
  getNegotiationLibrary,
  type SnapshotExportOptions,
} from "./dataStore";

export type { SnapshotMetadata } from "./dataStore";

export function exportSnapshot(options?: SnapshotExportOptions): string {
  return exportToJson(options);
}

export function importSnapshot(json: string): void {
  importFromJson(json);

  // Trigger dataStore migrations
  getUserProfile();
  getResumes();
  getMessages();
  getOffers();
  getJobApplications();
  getOnboardingStep();
  getOpenAIKey();
  getConnectorSyncSnapshot();
  getLinkedInProfileSnapshot();
  getPipelineLayoutPreferences();
  getNegotiationLibrary();
}

