import type {
  ApplicationStatus,
  JobApplication,
  Recruiter,
  OfferDecision,
  OfferDecisionStatus,
} from "@/types";
import {
  OFFER_DECISION_STATUS_LABELS,
} from "@/types";

const HEADERS = [
  { key: "title", label: "Title" },
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "status", label: "Status" },
  { key: "nextAction", label: "Next Action" },
  { key: "nextActionDue", label: "Next Action Due" },
  { key: "recruiters", label: "Recruiters" },
  { key: "recruiterEmails", label: "Recruiter Emails" },
  { key: "interviewDate", label: "Interview Date" },
  { key: "interviewLocation", label: "Interview Location" },
  { key: "offerSummary", label: "Offer Summary" },
  { key: "offerCompensation", label: "Offer Compensation" },
  { key: "decisionStatus", label: "Decision Status" },
  { key: "decisionDate", label: "Decision Date" },
  { key: "decisionNotes", label: "Decision Notes" },
  { key: "source", label: "Source" },
  { key: "url", label: "Job URL" },
] as const;

export const APPLICATION_EXPORT_HEADERS = HEADERS;

export type ApplicationExportKey = (typeof HEADERS)[number]["key"];

export type ApplicationExportRow = Record<ApplicationExportKey, string>;

export interface RecruiterSummary {
  id: string;
  name: string;
  email?: string;
}

export interface OfferCompensationSummary {
  type: string;
  amount: number;
  notes?: string;
}

export interface OfferDetailsSummary {
  id: string;
  summary: string[];
  compensation: OfferCompensationSummary[];
  decision?: {
    status: OfferDecisionStatus;
    decidedAt?: string;
    notes?: string;
  };
}

export interface ApplicationExportRecord extends ApplicationExportRow {
  id: string;
  history: { status: string; changedAt: string; reason?: string }[];
  recruiterDetails: RecruiterSummary[];
  offerDetails?: OfferDetailsSummary;
  decision?: {
    status: OfferDecisionStatus;
    decidedAt?: string;
    notes?: string;
  };
  resumeVariant?: { id: string; title: string };
  jobDescription?: string;
}

const toIsoString = (value?: string): string => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const formatStatusLabel = (status: ApplicationStatus): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatDecisionStatus = (status: OfferDecisionStatus): string =>
  OFFER_DECISION_STATUS_LABELS[status] ?? status;

const getDecision = (application: JobApplication): OfferDecision | undefined =>
  application.decision ?? application.offer?.decision;

const normalizeDecisionForExport = (
  decision?: OfferDecision,
): { status: OfferDecisionStatus; decidedAt?: string; notes?: string } | undefined => {
  if (!decision) {
    return undefined;
  }
  const result: { status: OfferDecisionStatus; decidedAt?: string; notes?: string } = {
    status: decision.status,
  };
  const decidedAtIso = toIsoString(decision.decidedAt);
  if (decidedAtIso) {
    result.decidedAt = decidedAtIso;
  }
  if (decision.notes && decision.notes.trim().length > 0) {
    result.notes = decision.notes.trim();
  }
  return result;
};

const summarizeRecruiters = (recruiters?: Recruiter[]): {
  names: string;
  emails: string;
  details: RecruiterSummary[];
} => {
  if (!recruiters || recruiters.length === 0) {
    return { names: "", emails: "", details: [] };
  }

  const details = recruiters.map(({ id, name, email }) => ({
    id,
    name,
    ...(email ? { email } : {}),
  }));

  const names = details.map((recruiter) => recruiter.name).join("; ");
  const emails = details
    .map((recruiter) => recruiter.email)
    .filter((email): email is string => Boolean(email))
    .join("; ");

  return { names, emails, details };
};

const summarizeOffer = (
  offer: JobApplication["offer"],
): {
  summaryText: string;
  compensationText: string;
  details?: OfferDetailsSummary;
} => {
  if (!offer) {
    return { summaryText: "", compensationText: "" };
  }

  const summary = Array.isArray(offer.summary)
    ? offer.summary.filter((line) => line.trim().length > 0)
    : [];
  const compensation = Array.isArray(offer.compensation)
    ? offer.compensation.map(({ type, amount, notes }) => ({
        type,
        amount,
        ...(notes ? { notes } : {}),
      }))
    : [];

  const summaryText = summary.join("; ");
  const compensationText = compensation
    .map((comp) => {
      const parts = [comp.type, Number.isFinite(comp.amount) ? String(comp.amount) : ""]
        .filter(Boolean)
        .join(": ");
      return comp.notes ? `${parts} (${comp.notes})` : parts;
    })
    .filter((line) => line.trim().length > 0)
    .join("; ");

  const decisionDetails = normalizeDecisionForExport(offer.decision);

  return {
    summaryText,
    compensationText,
    details: {
      id: offer.id,
      summary,
      compensation,
      ...(decisionDetails ? { decision: decisionDetails } : {}),
    },
  };
};

const escapeCsvValue = (value: string): string => {
  if (value === "") {
    return "";
  }
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

export const mapApplicationToRow = (
  application: JobApplication,
): ApplicationExportRow => {
  const { names, emails } = summarizeRecruiters(application.recruiters);
  const { summaryText, compensationText } = summarizeOffer(application.offer);
  const decision = getDecision(application);
  const decisionStatus = decision ? formatDecisionStatus(decision.status) : "";
  const decisionDate = decision?.decidedAt
    ? toIsoString(decision.decidedAt)
    : "";
  const decisionNotes = decision?.notes ? decision.notes.trim() : "";

  return {
    title: application.role.title ?? "",
    company: application.role.company ?? "",
    location: application.role.location ?? "",
    status: formatStatusLabel(application.status),
    nextAction: application.nextAction ?? "",
    nextActionDue: toIsoString(application.dueAt),
    recruiters: names,
    recruiterEmails: emails,
    interviewDate: toIsoString(application.interviewDateTime),
    interviewLocation: application.interviewLocation ?? "",
    offerSummary: summaryText,
    offerCompensation: compensationText,
    decisionStatus,
    decisionDate,
    decisionNotes,
    source: application.role.source ?? "",
    url: application.role.url ?? "",
  };
};

export const mapApplicationToRecord = (
  application: JobApplication,
): ApplicationExportRecord => {
  const row = mapApplicationToRow(application);
  const recruiterSummary = summarizeRecruiters(application.recruiters);
  const offerSummary = summarizeOffer(application.offer);
  const decisionDetails = normalizeDecisionForExport(getDecision(application));

  const history = (application.history ?? []).map((entry) => {
    const formatted: { status: string; changedAt: string; reason?: string } = {
      status: formatStatusLabel(entry.status),
      changedAt: toIsoString(entry.changedAt),
    };
    if (entry.reason) {
      formatted.reason = entry.reason;
    }
    return formatted;
  });

  const record: ApplicationExportRecord = {
    ...row,
    id: application.id,
    history,
    recruiterDetails: recruiterSummary.details,
  };

  if (offerSummary.details) {
    record.offerDetails = {
      id: offerSummary.details.id,
      summary: offerSummary.details.summary,
      compensation: offerSummary.details.compensation.map((comp) => ({
        type: comp.type,
        amount: comp.amount,
        ...(comp.notes ? { notes: comp.notes } : {}),
      })),
      ...(offerSummary.details.decision
        ? { decision: offerSummary.details.decision }
        : {}),
    };
  }

  if (decisionDetails) {
    record.decision = decisionDetails;
  }

  if (application.resumeVariant) {
    record.resumeVariant = {
      id: application.resumeVariant.id,
      title: application.resumeVariant.title,
    };
  }

  if (application.role.description) {
    record.jobDescription = application.role.description;
  }

  return record;
};

export const createApplicationsCsv = (
  applications: JobApplication[],
): string => {
  const headerLine = HEADERS.map((header) => header.label).join(",");
  if (applications.length === 0) {
    return headerLine;
  }

  const lines = applications.map((application) => {
    const row = mapApplicationToRow(application);
    return HEADERS.map((header) => escapeCsvValue(row[header.key])).join(",");
  });

  return [headerLine, ...lines].join("\n");
};

export const prepareApplicationsForJson = (
  applications: JobApplication[],
): ApplicationExportRecord[] => applications.map(mapApplicationToRecord);
