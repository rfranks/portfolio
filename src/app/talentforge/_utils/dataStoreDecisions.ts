import type { ApplicationRecord, Offer, OfferDecision, OfferDecisionStatus } from "@/types";
import { OFFER_DECISION_DEFAULT_STATUS, OFFER_DECISION_STATUSES } from "@/types";

export type JobApplication = ApplicationRecord;

export function createDefaultDecision(): OfferDecision {
  return { status: OFFER_DECISION_DEFAULT_STATUS };
}

export function normalizeIsoTimestamp(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function isDecisionStatus(value: unknown): value is OfferDecisionStatus {
  return (
    typeof value === "string" && (OFFER_DECISION_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeDecisionValue(value: unknown): OfferDecision {
  if (!value || typeof value !== "object") {
    return createDefaultDecision();
  }
  const raw = value as Partial<OfferDecision>;
  const status = isDecisionStatus(raw.status) ? raw.status : OFFER_DECISION_DEFAULT_STATUS;
  const decidedAt = normalizeIsoTimestamp(raw.decidedAt);
  const notes =
    typeof raw.notes === "string" && raw.notes.trim().length > 0 ? raw.notes.trim() : undefined;
  const decision: OfferDecision = { status };
  if (decidedAt) {
    decision.decidedAt = decidedAt;
  }
  if (notes) {
    decision.notes = notes;
  }
  return decision;
}

export function mergeDecision(
  current: OfferDecision | undefined,
  updates: Partial<OfferDecision> | undefined,
): OfferDecision {
  const base = current ? normalizeDecisionValue(current) : createDefaultDecision();
  if (!updates || typeof updates !== "object") {
    return base;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "status")) {
    base.status = isDecisionStatus(updates.status) ? updates.status : OFFER_DECISION_DEFAULT_STATUS;
  }
  if (Object.prototype.hasOwnProperty.call(updates, "decidedAt")) {
    const normalized = normalizeIsoTimestamp(updates.decidedAt);
    if (normalized) {
      base.decidedAt = normalized;
    } else {
      delete base.decidedAt;
    }
  }
  if (Object.prototype.hasOwnProperty.call(updates, "notes")) {
    const trimmed = typeof updates.notes === "string" ? updates.notes.trim() : "";
    if (trimmed) {
      base.notes = trimmed;
    } else {
      delete base.notes;
    }
  }
  return base;
}

export function decisionsEqual(
  a: OfferDecision | undefined,
  b: OfferDecision | undefined,
): boolean {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  const normalizedA = normalizeDecisionValue(a);
  const normalizedB = normalizeDecisionValue(b);
  return (
    normalizedA.status === normalizedB.status &&
    normalizedA.decidedAt === normalizedB.decidedAt &&
    normalizedA.notes === normalizedB.notes
  );
}

export function offersEqual(a?: Offer, b?: Offer): boolean {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  if (a.id !== b.id) {
    return false;
  }
  const summaryA = Array.isArray(a.summary) ? a.summary : [];
  const summaryB = Array.isArray(b.summary) ? b.summary : [];
  if (summaryA.length !== summaryB.length) {
    return false;
  }
  for (let i = 0; i < summaryA.length; i += 1) {
    if (summaryA[i] !== summaryB[i]) {
      return false;
    }
  }
  const compA = Array.isArray(a.compensation) ? a.compensation : [];
  const compB = Array.isArray(b.compensation) ? b.compensation : [];
  if (compA.length !== compB.length) {
    return false;
  }
  for (let i = 0; i < compA.length; i += 1) {
    const entryA = compA[i];
    const entryB = compB[i];
    if (
      entryA.type !== entryB.type ||
      entryA.amount !== entryB.amount ||
      (entryA.notes ?? undefined) !== (entryB.notes ?? undefined)
    ) {
      return false;
    }
  }
  if (!decisionsEqual(a.decision, b.decision)) {
    return false;
  }
  return true;
}

export function ensureOfferDecision(
  offer: Offer,
  fallback?: OfferDecision,
): { offer: Offer; changed: boolean } {
  const fallbackNormalized = fallback ? normalizeDecisionValue(fallback) : undefined;
  const targetDecision =
    fallbackNormalized ??
    (offer.decision ? normalizeDecisionValue(offer.decision) : undefined) ??
    createDefaultDecision();
  const original = offer.decision;
  const changed =
    !original ||
    original.status !== targetDecision.status ||
    original.decidedAt !== targetDecision.decidedAt ||
    original.notes !== targetDecision.notes;
  if (!changed && original) {
    return { offer, changed: false };
  }
  return { offer: { ...offer, decision: targetDecision }, changed: true };
}

export function ensureApplicationDecision(app: JobApplication): {
  application: JobApplication;
  changed: boolean;
} {
  const current = app.decision ? normalizeDecisionValue(app.decision) : undefined;
  const offerDecision =
    app.offer && app.offer.decision ? normalizeDecisionValue(app.offer.decision) : undefined;
  const decision = current ?? offerDecision ?? createDefaultDecision();
  let changed =
    !app.decision ||
    app.decision.status !== decision.status ||
    app.decision.decidedAt !== decision.decidedAt ||
    app.decision.notes !== decision.notes;
  let nextOffer = app.offer;
  if (app.offer) {
    const { offer: normalizedOffer, changed: offerChanged } = ensureOfferDecision(
      app.offer,
      decision,
    );
    if (offerChanged) {
      nextOffer = normalizedOffer;
      changed = true;
    }
  }
  if (!changed) {
    return { application: app, changed: false };
  }
  const updated: JobApplication = { ...app, decision };
  if (nextOffer) {
    updated.offer = nextOffer;
  } else {
    delete (updated as Partial<JobApplication>).offer;
  }
  return { application: updated, changed: true };
}

export function migrateOfferDecisions(data: unknown): Offer[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return (data as Offer[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as Offer;
    }
    const { offer: normalized } = ensureOfferDecision(entry as Offer);
    return normalized;
  });
}

export function migrateApplicationDecisions(data: unknown): JobApplication[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return (data as JobApplication[]).map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry as JobApplication;
    }
    const { application } = ensureApplicationDecision(entry as JobApplication);
    return application;
  });
}
