import { v4 as uuid } from "uuid";
import type {
  ApplicationActivity,
  ApplicationAttachment,
  Offer,
  OfferDecision,
  OfferHistoryEntry,
  ScreenRoleAnalysis,
  StatusChange,
} from "@/types";
import {
  decisionsEqual,
  ensureApplicationDecision,
  ensureOfferDecision,
  mergeDecision,
  offersEqual,
  type JobApplication,
} from "./dataStoreDecisions";

export function normalizeOfferHistoryEntries(
  history: JobApplication["offerHistory"] | string[] | undefined,
): { entries: OfferHistoryEntry[]; changed: boolean } {
  if (!Array.isArray(history)) {
    return { entries: [], changed: Boolean(history) };
  }

  let changed = false;
  const normalized: OfferHistoryEntry[] = [];

  history.forEach((item, index) => {
    if (typeof item === "string") {
      changed = true;
      normalized.push({
        id: uuid(),
        createdAt: new Date().toISOString(),
        sourceLabel: `Offer note ${index + 1}`,
        content: item,
      });
      return;
    }

    const entry = item as Partial<OfferHistoryEntry>;
    const hasId = typeof entry.id === "string" && entry.id.length > 0;
    const hasCreatedAt = typeof entry.createdAt === "string" && entry.createdAt.length > 0;
    const hasSourceLabel =
      typeof entry.sourceLabel === "string" && entry.sourceLabel.trim().length > 0;
    const hasContent = typeof entry.content === "string";

    if (hasId && hasCreatedAt && hasSourceLabel && hasContent) {
      normalized.push(entry as OfferHistoryEntry);
      return;
    }

    changed = true;
    normalized.push({
      id: hasId ? (entry.id as string) : uuid(),
      createdAt: hasCreatedAt ? (entry.createdAt as string) : new Date().toISOString(),
      sourceLabel: hasSourceLabel
        ? (entry.sourceLabel as string).trim()
        : `Offer note ${index + 1}`,
      content: hasContent ? (entry.content as string) : "",
    });
  });

  return changed
    ? { entries: normalized, changed: true }
    : { entries: history as OfferHistoryEntry[], changed: false };
}

export function normalizeScreenRoleAnalysisValue(
  value: JobApplication["screenRoleAnalysis"] | unknown,
): {
  analysis?: ScreenRoleAnalysis;
  changed: boolean;
} {
  if (typeof value === "undefined") {
    return { analysis: undefined, changed: false };
  }
  if (!value || typeof value !== "object") {
    return { analysis: undefined, changed: true };
  }

  const source = value as Record<string, unknown>;
  const summaryRaw = source.summary;
  const hasSummary = typeof summaryRaw === "string";
  const trimmedSummary = hasSummary ? summaryRaw.trim() : undefined;
  let changed = Boolean(summaryRaw) && (!hasSummary || trimmedSummary !== summaryRaw);

  const issuesRaw = source.issues;
  const issues: ScreenRoleAnalysis["issues"] = [];
  if (Array.isArray(issuesRaw)) {
    issuesRaw.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        changed = true;
        return;
      }
      const record = entry as Record<string, unknown>;
      const severityValue = record.severity;
      const messageValue = record.message;
      const severity =
        severityValue === "red" || severityValue === "yellow" ? severityValue : undefined;
      const trimmedMessage = typeof messageValue === "string" ? messageValue.trim() : undefined;
      if (severity && trimmedMessage) {
        issues.push({ severity, message: trimmedMessage });
        if (severityValue !== severity || messageValue !== trimmedMessage) {
          changed = true;
        }
      } else {
        changed = true;
      }
    });
  } else if (typeof issuesRaw !== "undefined") {
    changed = true;
  }

  const hasContent = Boolean(trimmedSummary) || issues.length > 0;
  if (!hasContent) {
    return { analysis: undefined, changed };
  }

  const analysis: ScreenRoleAnalysis = { issues };
  if (trimmedSummary) {
    analysis.summary = trimmedSummary;
  }
  return { analysis, changed };
}

const ACTIVITY_OUTCOME_SUCCESS: ApplicationActivity["outcome"] = "success";
const ACTIVITY_OUTCOME_ERROR: ApplicationActivity["outcome"] = "error";

const isValidActivityOutcome = (value: unknown): value is ApplicationActivity["outcome"] =>
  value === ACTIVITY_OUTCOME_SUCCESS || value === ACTIVITY_OUTCOME_ERROR;

function normalizeActivityEntry(
  value: unknown,
  index: number,
): { activity: ApplicationActivity; changed: boolean } {
  const fallbackSummary = `Tile activity ${index + 1}`;
  const fallbackTileId = `tile-${index + 1}`;

  const base: Partial<ApplicationActivity> =
    value && typeof value === "object" ? (value as Partial<ApplicationActivity>) : {};

  const originalId = typeof base.id === "string" ? base.id : undefined;
  const trimmedId = originalId?.trim();
  const originalTileId = typeof base.tileId === "string" ? base.tileId : undefined;
  const trimmedTileId = originalTileId?.trim();
  const originalSummary = typeof base.summary === "string" ? base.summary : undefined;
  const trimmedSummary = originalSummary?.trim();
  const originalTimestamp = typeof base.createdAt === "string" ? base.createdAt : undefined;
  const trimmedTimestamp = originalTimestamp?.trim();
  const parsedTimestamp = trimmedTimestamp ? new Date(trimmedTimestamp) : new Date(NaN);
  const isoFromRaw = !Number.isNaN(parsedTimestamp.getTime())
    ? parsedTimestamp.toISOString()
    : undefined;
  const originalOutcome = isValidActivityOutcome(base.outcome) ? base.outcome : undefined;
  const originalGeneratedContentId =
    typeof base.generatedContentId === "string" ? base.generatedContentId : undefined;
  const trimmedGeneratedContentId = originalGeneratedContentId?.trim();
  const originalError = typeof base.error === "string" ? base.error : undefined;
  const trimmedError = originalError?.trim();

  const normalizedId = trimmedId && trimmedId.length > 0 ? trimmedId : uuid();
  const normalizedTileId =
    trimmedTileId && trimmedTileId.length > 0 ? trimmedTileId : fallbackTileId;
  const normalizedSummary =
    trimmedSummary && trimmedSummary.length > 0 ? trimmedSummary : fallbackSummary;
  const normalizedTimestamp = isoFromRaw ?? new Date().toISOString();
  const normalizedOutcome = originalOutcome ?? ACTIVITY_OUTCOME_SUCCESS;
  const normalizedGeneratedContentId =
    trimmedGeneratedContentId && trimmedGeneratedContentId.length > 0
      ? trimmedGeneratedContentId
      : undefined;
  const normalizedError =
    normalizedOutcome === ACTIVITY_OUTCOME_ERROR && trimmedError
      ? trimmedError.length > 0
        ? trimmedError
        : undefined
      : undefined;

  const activity: ApplicationActivity = {
    id: normalizedId,
    tileId: normalizedTileId,
    createdAt: normalizedTimestamp,
    summary: normalizedSummary,
    outcome: normalizedOutcome,
    ...(normalizedGeneratedContentId ? { generatedContentId: normalizedGeneratedContentId } : {}),
    ...(normalizedError ? { error: normalizedError } : {}),
  };

  const changed =
    normalizedId !== (originalId ?? normalizedId) ||
    normalizedTileId !== (originalTileId ?? fallbackTileId) ||
    normalizedSummary !== (originalSummary ?? fallbackSummary) ||
    normalizedTimestamp !== (originalTimestamp ?? normalizedTimestamp) ||
    normalizedOutcome !== (originalOutcome ?? ACTIVITY_OUTCOME_SUCCESS) ||
    normalizedGeneratedContentId !== (originalGeneratedContentId ?? normalizedGeneratedContentId) ||
    normalizedError !==
      (normalizedOutcome === ACTIVITY_OUTCOME_ERROR
        ? (originalError ?? normalizedError)
        : undefined);

  return { activity, changed };
}

export function normalizeActivities(value: JobApplication["activities"] | unknown): {
  activities: ApplicationActivity[];
  changed: boolean;
} {
  if (!Array.isArray(value)) {
    return { activities: [], changed: Boolean(value) };
  }

  let changed = false;
  const normalized = value.map((entry, index) => {
    const { activity, changed: entryChanged } = normalizeActivityEntry(entry, index);
    if (entryChanged) {
      changed = true;
    }
    return activity;
  });

  return changed
    ? { activities: normalized, changed: true }
    : { activities: value as ApplicationActivity[], changed: false };
}

type ReminderFields = Partial<Pick<JobApplication, "nextAction" | "dueAt">>;

export function normalizeNextAction(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeDueAt(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

export function normalizeReminderFields(value: { nextAction?: unknown; dueAt?: unknown }): {
  values: ReminderFields;
  changed: boolean;
} {
  const normalized: ReminderFields = {};
  const originalNextAction = typeof value.nextAction === "string" ? value.nextAction : undefined;
  const originalDueAt = typeof value.dueAt === "string" ? value.dueAt : undefined;

  const normalizedNextAction = normalizeNextAction(value.nextAction);
  const normalizedDueAt = normalizeDueAt(value.dueAt);

  if (normalizedNextAction !== undefined) {
    normalized.nextAction = normalizedNextAction;
  } else if (originalNextAction !== undefined) {
    normalized.nextAction = undefined;
  }

  if (normalizedDueAt !== undefined) {
    normalized.dueAt = normalizedDueAt;
  } else if (originalDueAt !== undefined) {
    normalized.dueAt = undefined;
  }

  const changed = normalizedNextAction !== originalNextAction || normalizedDueAt !== originalDueAt;

  return { values: normalized, changed };
}

function normalizeAttachmentEntry(value: unknown): ApplicationAttachment | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as Partial<ApplicationAttachment> & Record<string, unknown>;

  const rawId =
    typeof candidate.id === "string" && candidate.id.trim().length > 0
      ? candidate.id.trim()
      : uuid();
  const rawName =
    typeof candidate.name === "string" && candidate.name.trim().length > 0
      ? candidate.name.trim()
      : undefined;
  const rawMime =
    typeof candidate.mimeType === "string" && candidate.mimeType.trim().length > 0
      ? candidate.mimeType.trim()
      : "application/octet-stream";
  const base64Value =
    typeof candidate["base64"] === "string" ? (candidate["base64"] as string) : undefined;
  const rawContent = typeof candidate.content === "string" ? candidate.content : base64Value;

  if (!rawName || !rawContent) {
    return null;
  }

  const normalizedContent = rawContent.replace(/\s+/g, "");

  return {
    id: rawId,
    name: rawName,
    mimeType: rawMime,
    content: normalizedContent,
  };
}

export function normalizeAttachments(value: unknown): {
  attachments: ApplicationAttachment[];
  changed: boolean;
} {
  if (!Array.isArray(value)) {
    return { attachments: [], changed: value !== undefined };
  }

  const attachments: ApplicationAttachment[] = [];
  let changed = false;

  value.forEach((entry) => {
    const normalized = normalizeAttachmentEntry(entry);
    if (!normalized) {
      changed = true;
      return;
    }
    attachments.push(normalized);
    if (entry && typeof entry === "object") {
      const candidate = entry as Partial<ApplicationAttachment> & Record<string, unknown>;
      const rawId =
        typeof candidate.id === "string" && candidate.id.trim().length > 0
          ? candidate.id.trim()
          : undefined;
      const rawName =
        typeof candidate.name === "string" && candidate.name.trim().length > 0
          ? candidate.name.trim()
          : undefined;
      const rawMime =
        typeof candidate.mimeType === "string" && candidate.mimeType.trim().length > 0
          ? candidate.mimeType.trim()
          : undefined;
      const candidateBase64 =
        typeof candidate["base64"] === "string" ? (candidate["base64"] as string) : undefined;
      const rawContent =
        typeof candidate.content === "string"
          ? candidate.content.replace(/\s+/g, "")
          : candidateBase64
            ? candidateBase64.replace(/\s+/g, "")
            : undefined;

      if (
        rawId !== normalized.id ||
        rawName !== normalized.name ||
        rawMime !== normalized.mimeType ||
        rawContent !== normalized.content
      ) {
        changed = true;
      }
    } else {
      changed = true;
    }
  });

  if (attachments.length !== value.length) {
    changed = true;
  }

  return { attachments, changed };
}

export function attachmentsEqual(
  a: ApplicationAttachment[] | undefined,
  b: ApplicationAttachment[] | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return !a && !b;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.name !== right.name ||
      left.mimeType !== right.mimeType ||
      left.content !== right.content
    ) {
      return false;
    }
  }
  return true;
}

export function activitiesEqual(
  a: ApplicationActivity[] | undefined,
  b: ApplicationActivity[] | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return !a && !b;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.tileId !== right.tileId ||
      left.createdAt !== right.createdAt ||
      left.summary !== right.summary ||
      left.outcome !== right.outcome ||
      left.generatedContentId !== right.generatedContentId ||
      left.error !== right.error
    ) {
      return false;
    }
  }
  return true;
}

export function migrateReminderFields(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return (data as JobApplication[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as JobApplication;
    }
    const record = entry as JobApplication & {
      nextAction?: unknown;
      dueAt?: unknown;
    };
    const { values, changed } = normalizeReminderFields(record);
    if (!changed) {
      return record;
    }
    return { ...record, ...values } as JobApplication;
  });
}

export function migrateApplicationAttachments(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) {
    return [];
  }
  let changed = false;
  const migrated = (data as JobApplication[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as JobApplication;
    }
    const record = entry as JobApplication & { attachments?: unknown };
    const hasArray = Array.isArray(record.attachments);
    const { attachments, changed: attachmentsChanged } = normalizeAttachments(record.attachments);
    if (attachmentsChanged || !hasArray) {
      changed = true;
      return { ...record, attachments } as JobApplication;
    }
    return record as JobApplication;
  });
  return changed ? migrated : (data as JobApplication[]);
}

export function migrateApplicationActivities(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) {
    return [];
  }
  let changed = false;
  const migrated = (data as JobApplication[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as JobApplication;
    }
    const record = entry as JobApplication & { activities?: unknown };
    const hasArray = Array.isArray(record.activities);
    const { activities, changed: activitiesChanged } = normalizeActivities(record.activities);
    if (activitiesChanged || !hasArray) {
      changed = true;
      return { ...record, activities } as JobApplication;
    }
    return record as JobApplication;
  });
  return changed ? migrated : (data as JobApplication[]);
}

export function migrateScreenRoleAnalysis(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) {
    return [];
  }
  let changed = false;
  const migrated = (data as JobApplication[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as JobApplication;
    }
    const record = entry as JobApplication & { screenRoleAnalysis?: unknown };
    const { analysis, changed: analysisChanged } = normalizeScreenRoleAnalysisValue(
      record.screenRoleAnalysis,
    );
    if (analysisChanged) {
      changed = true;
      if (analysis) {
        return { ...record, screenRoleAnalysis: analysis } as JobApplication;
      }
      const clone = { ...record } as Partial<JobApplication>;
      delete clone.screenRoleAnalysis;
      return clone as JobApplication;
    }
    return record as JobApplication;
  });
  return changed ? migrated : (data as JobApplication[]);
}

export function normalizeApplicationUpdates(
  updates: Partial<JobApplication>,
): Partial<JobApplication> {
  const needsNormalization =
    Object.prototype.hasOwnProperty.call(updates, "offerHistory") ||
    Object.prototype.hasOwnProperty.call(updates, "nextAction") ||
    Object.prototype.hasOwnProperty.call(updates, "dueAt") ||
    Object.prototype.hasOwnProperty.call(updates, "attachments") ||
    Object.prototype.hasOwnProperty.call(updates, "activities") ||
    Object.prototype.hasOwnProperty.call(updates, "screenRoleAnalysis");
  if (!needsNormalization) {
    return updates;
  }

  const normalized: Partial<JobApplication> = { ...updates };
  if (Object.prototype.hasOwnProperty.call(updates, "offerHistory")) {
    normalized.offerHistory = normalizeOfferHistoryEntries(updates.offerHistory).entries;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "nextAction")) {
    normalized.nextAction = normalizeNextAction(updates.nextAction);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "dueAt")) {
    normalized.dueAt = normalizeDueAt(updates.dueAt);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "attachments")) {
    normalized.attachments = normalizeAttachments(updates.attachments).attachments;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "activities")) {
    normalized.activities = normalizeActivities(updates.activities).activities;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "screenRoleAnalysis")) {
    normalized.screenRoleAnalysis = normalizeScreenRoleAnalysisValue(
      updates.screenRoleAnalysis,
    ).analysis;
  }
  return normalized;
}

export function applyApplicationUpdates(
  app: JobApplication,
  updates: Partial<JobApplication>,
): JobApplication {
  const normalizedUpdates = normalizeApplicationUpdates(updates);
  const hasNormalizedChanges = normalizedUpdates && Object.keys(normalizedUpdates).length > 0;
  let nextApp = app;
  if (hasNormalizedChanges) {
    const {
      attachments: attachmentUpdates,
      activities: activityUpdates,
      screenRoleAnalysis: screenRoleAnalysisUpdate,
      ...otherUpdates
    } = normalizedUpdates;
    if (Object.keys(otherUpdates).length > 0) {
      nextApp = { ...nextApp, ...otherUpdates } as JobApplication;
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdates, "attachments")) {
      const nextAttachments = Array.isArray(attachmentUpdates)
        ? (attachmentUpdates as ApplicationAttachment[])
        : [];
      const currentAttachments = Array.isArray(nextApp.attachments) ? nextApp.attachments : [];
      if (!attachmentsEqual(currentAttachments, nextAttachments)) {
        nextApp = {
          ...nextApp,
          attachments: nextAttachments,
        } as JobApplication;
      }
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdates, "activities")) {
      const nextActivities = Array.isArray(activityUpdates)
        ? (activityUpdates as ApplicationActivity[])
        : [];
      const currentActivities = Array.isArray(nextApp.activities) ? nextApp.activities : [];
      if (!activitiesEqual(currentActivities, nextActivities)) {
        nextApp = { ...nextApp, activities: nextActivities } as JobApplication;
      }
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdates, "screenRoleAnalysis")) {
      if (typeof screenRoleAnalysisUpdate === "undefined") {
        if ("screenRoleAnalysis" in nextApp) {
          const clone = { ...nextApp } as Partial<JobApplication>;
          delete clone.screenRoleAnalysis;
          nextApp = clone as JobApplication;
        }
      } else {
        nextApp = {
          ...nextApp,
          screenRoleAnalysis: screenRoleAnalysisUpdate as ScreenRoleAnalysis,
        } as JobApplication;
      }
    }
  }

  const hasDecisionUpdate = Object.prototype.hasOwnProperty.call(updates, "decision");
  let decisionFallback: OfferDecision | undefined =
    nextApp.decision ?? app.decision ?? app.offer?.decision;
  if (hasDecisionUpdate) {
    const mergedDecision = mergeDecision(
      app.decision ?? app.offer?.decision,
      updates.decision as Partial<OfferDecision>,
    );
    if (!decisionsEqual(nextApp.decision, mergedDecision)) {
      nextApp = { ...nextApp, decision: mergedDecision } as JobApplication;
    }
    decisionFallback = mergedDecision;
  }

  const hasOfferUpdate = Object.prototype.hasOwnProperty.call(updates, "offer");
  if (hasOfferUpdate) {
    const rawOffer = updates.offer;
    if (rawOffer && typeof rawOffer === "object") {
      const { offer: normalizedOffer } = ensureOfferDecision(rawOffer as Offer, decisionFallback);
      if (!offersEqual(nextApp.offer, normalizedOffer)) {
        nextApp = { ...nextApp, offer: normalizedOffer } as JobApplication;
      }
    } else {
      if (nextApp.offer) {
        const clone = { ...nextApp } as Partial<JobApplication>;
        delete clone.offer;
        nextApp = clone as JobApplication;
      }
    }
  }

  const { application: aligned } = ensureApplicationDecision(nextApp);
  return aligned;
}

export function applyStatusUpdate(
  app: JobApplication,
  status: JobApplication["status"],
  options?: { reason?: string; changedAt?: string },
): JobApplication {
  const opts = options ?? {};
  const hasReasonOption = Object.prototype.hasOwnProperty.call(opts, "reason");
  const rawReason = hasReasonOption ? (opts.reason ?? "") : undefined;
  const trimmedReason = rawReason?.trim();
  const hasChangedAtOption = Object.prototype.hasOwnProperty.call(opts, "changedAt");
  const changedAtValue = hasChangedAtOption ? opts.changedAt : undefined;

  const parseChangedAt = (value?: string) => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const history = [...(app.history || [])];
  const lastEntry = history[history.length - 1];

  if (lastEntry && lastEntry.status === status && (hasReasonOption || hasChangedAtOption)) {
    const updatedEntry: StatusChange = {
      ...lastEntry,
      status,
      changedAt: hasChangedAtOption
        ? parseChangedAt(changedAtValue).toISOString()
        : lastEntry.changedAt,
    };
    if (hasReasonOption) {
      if (trimmedReason) {
        updatedEntry.reason = trimmedReason;
      } else {
        delete updatedEntry.reason;
      }
    }
    history[history.length - 1] = updatedEntry;
    return { ...app, status, history };
  }

  const baseDate = hasChangedAtOption ? parseChangedAt(changedAtValue) : new Date();
  const entry: StatusChange = {
    status,
    changedAt: baseDate.toISOString(),
  };
  if (trimmedReason) {
    entry.reason = trimmedReason;
  }
  return { ...app, status, history: [...history, entry] };
}
