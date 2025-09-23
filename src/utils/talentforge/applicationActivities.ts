import { v4 as uuid } from "uuid";
import type {
  ApplicationActivity,
  ApplicationActivityContentReference,
  ApplicationActivityStatus,
  JobApplication,
} from "@/types";

export type AppendJobApplicationActivityFn = (
  id: string,
  activity: ApplicationActivity,
) => JobApplication[];

export type SyncApplicationReferencesFn = (
  applications: JobApplication[],
  applicationId: string,
) => void;

export interface RecordApplicationTileActivityOptions {
  appendActivity: AppendJobApplicationActivityFn;
  setApplications: (applications: JobApplication[]) => void;
  syncApplicationReferences: SyncApplicationReferencesFn;
  createId?: () => string;
  now?: () => string;
  source?: ApplicationActivity["source"];
}

export interface RecordApplicationTileActivityInput {
  tileId: string;
  summary: string;
  status: ApplicationActivityStatus;
  generatedContentRef?: ApplicationActivityContentReference;
  error?: string;
}

export function createApplicationTileActivityRecorder({
  appendActivity,
  setApplications,
  syncApplicationReferences,
  createId = uuid,
  now = () => new Date().toISOString(),
  source = "ai",
}: RecordApplicationTileActivityOptions) {
  return (
    applicationId: string,
    details: RecordApplicationTileActivityInput,
  ): ApplicationActivity => {
    const activity: ApplicationActivity = {
      id: createId(),
      tileId: details.tileId,
      timestamp: now(),
      summary: details.summary,
      source,
      status: details.status,
      ...(details.generatedContentRef
        ? { generatedContentRef: details.generatedContentRef }
        : {}),
      ...(details.error ? { error: details.error } : {}),
    };
    const updated = appendActivity(applicationId, activity);
    setApplications(updated);
    syncApplicationReferences(updated, applicationId);
    return activity;
  };
}
