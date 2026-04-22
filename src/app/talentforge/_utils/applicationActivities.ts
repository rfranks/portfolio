"use client";

import { v4 as uuid } from "uuid";

import type { ApplicationActivity, ApplicationActivityOutcome, JobApplication } from "@/types";
import { updateJobApplication } from "./dataStore";

const SUCCESS_OUTCOME: ApplicationActivityOutcome = "success";
const ERROR_OUTCOME: ApplicationActivityOutcome = "error";

const toIsoTimestamp = (factory?: () => string): string => {
  if (factory) {
    const value = factory();
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    }
  }
  return new Date().toISOString();
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error && typeof error.message === "string") {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    const value = (error as { message?: unknown }).message;
    if (typeof value === "string") {
      return value;
    }
  }
  return "Unknown error";
};

const trimOrFallback = (value: string | undefined, fallback: string): string => {
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

export interface TileActivityRecorderPersistHandler {
  (applications: JobApplication[], updatedApplication: JobApplication | null): void;
}

export interface TileActivityRecorderConfig {
  application: JobApplication;
  tileId: string;
  tileLabel: string;
  onPersist?: TileActivityRecorderPersistHandler;
}

export interface TileActivityRecorderDependencies {
  updateApplication?: typeof updateJobApplication;
  createId?: () => string;
  now?: () => string;
}

export interface TileActivitySuccessOptions {
  summary?: string;
  generatedContentId?: string;
}

export interface TileActivityErrorOptions {
  summary?: string;
}

export interface TileActivityRecorder {
  recordSuccess(options?: TileActivitySuccessOptions): JobApplication | null;
  recordError(error: unknown, options?: TileActivityErrorOptions): JobApplication | null;
}

export function createApplicationTileActivityRecorder(
  config: TileActivityRecorderConfig,
  dependencies: TileActivityRecorderDependencies = {},
): TileActivityRecorder {
  const { application, tileId, tileLabel, onPersist } = config;
  const updateApplication = dependencies.updateApplication ?? updateJobApplication;
  const createId = dependencies.createId ?? uuid;
  const nowFactory = dependencies.now;

  let latestApplication = application;

  const appendActivity = (
    outcome: ApplicationActivityOutcome,
    summary: string,
    extra: Partial<Pick<ApplicationActivity, "generatedContentId" | "error">> = {},
  ): JobApplication | null => {
    const timestamp = toIsoTimestamp(nowFactory);
    const trimmedId = extra.generatedContentId?.trim();
    const trimmedError =
      outcome === ERROR_OUTCOME && typeof extra.error === "string" ? extra.error.trim() : undefined;

    const activity: ApplicationActivity = {
      id: createId(),
      tileId,
      createdAt: timestamp,
      summary,
      outcome,
      ...(trimmedId ? { generatedContentId: trimmedId } : {}),
      ...(trimmedError ? { error: trimmedError } : {}),
    };

    const currentActivities = Array.isArray(latestApplication.activities)
      ? latestApplication.activities
      : [];
    const nextActivities = [...currentActivities, activity];
    const updated = updateApplication(latestApplication.id, {
      activities: nextActivities,
    });
    const refreshed = updated.find((entry) => entry.id === latestApplication.id) ?? null;
    if (refreshed) {
      latestApplication = refreshed;
    } else {
      latestApplication = {
        ...latestApplication,
        activities: nextActivities,
      } as JobApplication;
    }
    onPersist?.(updated, refreshed);
    return refreshed;
  };

  const buildSuccessSummary = (summary?: string) =>
    trimOrFallback(summary, `Generated ${tileLabel}`);

  const buildErrorSummary = (summary?: string) => trimOrFallback(summary, `${tileLabel} failed`);

  return {
    recordSuccess(options) {
      const summary = buildSuccessSummary(options?.summary);
      return appendActivity(SUCCESS_OUTCOME, summary, {
        generatedContentId: options?.generatedContentId?.trim()
          ? options?.generatedContentId.trim()
          : undefined,
      });
    },
    recordError(error, options) {
      const summary = buildErrorSummary(options?.summary);
      const message = toErrorMessage(error).trim();
      return appendActivity(ERROR_OUTCOME, summary, {
        error: message,
      });
    },
  };
}
