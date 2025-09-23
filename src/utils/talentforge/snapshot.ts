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
} from "./dataStore";

export function exportSnapshot(): string {
  return exportToJson();
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

