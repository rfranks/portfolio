import type { ApplicationStatus, OfferDecisionStatus, ScreenRoleAnalysis } from "@/types";
import { OFFER_DECISION_STATUS_LABELS } from "@/types";

export function formatOfferHistoryTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function formatStatusLabel(status: ApplicationStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatDecisionStatus(status: OfferDecisionStatus): string {
  return OFFER_DECISION_STATUS_LABELS[status] ?? status;
}

export function toDateTimeLocalValue(iso?: string): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function toIsoOrUndefined(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function arrayMove<T>(array: readonly T[], from: number, to: number): T[] {
  if (array.length === 0) return [];
  const clampedFrom = Math.min(Math.max(from, 0), array.length - 1);
  const clampedTo = Math.min(Math.max(to, 0), array.length - 1);
  if (clampedFrom === clampedTo) {
    return [...array];
  }
  const next = [...array];
  const [item] = next.splice(clampedFrom, 1);
  next.splice(clampedTo, 0, item);
  return next;
}

export function normalizeScreenRoleAnalysisResponse(value: unknown): ScreenRoleAnalysis | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const source = value as Record<string, unknown>;
  const summaryRaw = source.summary;
  const trimmedSummary = typeof summaryRaw === "string" ? summaryRaw.trim() : undefined;
  const issuesRaw = source.issues;
  const issues: ScreenRoleAnalysis["issues"] = [];
  if (Array.isArray(issuesRaw)) {
    issuesRaw.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        return;
      }
      const record = entry as Record<string, unknown>;
      const severity = record.severity;
      const messageRaw = record.message;
      const normalizedSeverity = severity === "red" || severity === "yellow" ? severity : undefined;
      const trimmedMessage = typeof messageRaw === "string" ? messageRaw.trim() : undefined;
      if (normalizedSeverity && trimmedMessage) {
        issues.push({ severity: normalizedSeverity, message: trimmedMessage });
      }
    });
  }
  const hasSummary = Boolean(trimmedSummary);
  if (!hasSummary && issues.length === 0) {
    return null;
  }
  const analysis: ScreenRoleAnalysis = { issues };
  if (hasSummary) {
    analysis.summary = trimmedSummary;
  }
  return analysis;
}
