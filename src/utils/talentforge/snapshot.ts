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
} from "./dataStore";

const SNAPSHOT_SCHEMA_VERSION = 1;

interface SnapshotPayload {
  schemaVersion: number;
  data: Record<string, unknown>;
}

function isSnapshotPayload(obj: unknown): obj is SnapshotPayload {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "schemaVersion" in obj &&
    typeof (obj as { schemaVersion: unknown }).schemaVersion === "number" &&
    "data" in obj
  );
}

function migrateSnapshot(
  fromVersion: number,
  data: Record<string, unknown>,
): Record<string, unknown> {
  let migrated = data;
  // Future snapshot migrations can be handled here
  if (fromVersion < 1) {
    // No changes needed for initial version
    migrated = data;
  }
  return migrated;
}

export function exportSnapshot(): string {
  const raw = exportToJson();
  const payload: SnapshotPayload = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    data: JSON.parse(raw),
  };
  return JSON.stringify(payload, null, 2);
}

export function importSnapshot(json: string): void {
  try {
    const parsed = JSON.parse(json) as Partial<SnapshotPayload> | Record<string, unknown>;
    let version: number;
    let data: Record<string, unknown>;

    if (isSnapshotPayload(parsed)) {
      version = parsed.schemaVersion;
      data = parsed.data;
    } else {
      // Legacy snapshot without schemaVersion
      version = 0;
      data = parsed as Record<string, unknown>;
    }

    if (version < SNAPSHOT_SCHEMA_VERSION) {
      data = migrateSnapshot(version, data);
    }

    importFromJson(JSON.stringify(data));

    // Trigger dataStore migrations
    getUserProfile();
    getResumes();
    getMessages();
    getOffers();
    getJobApplications();
    getOnboardingStep();
    getOpenAIKey();
  } catch {
    // Ignore parse errors
  }
}

